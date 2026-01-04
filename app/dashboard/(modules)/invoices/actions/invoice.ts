"use server";

import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";
import { createClient } from "@/lib/supabase/server";
import {
  createInvoiceSchema,
  CreateInvoiceValues,
} from "@/lib/schemas/invoice";
import { revalidatePath } from "next/cache";
import { getUserWithOrg } from "@/lib/auth-helpers";
import { getUserContext } from "@/lib/context/context";

function generateNextNumber(lastNumber: string | undefined): string {
  if (!lastNumber) return "INV-001";
  const match = lastNumber.match(/(\d+)$/);
  if (!match) return "INV-001";
  const numberPart = match[1];
  const prefix = lastNumber.slice(0, -numberPart.length);
  const nextNumber = parseInt(numberPart, 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(numberPart.length, "0")}`;
}

export async function createInvoice(values: CreateInvoiceValues) {
  // 1. Auth & Org
  const user = await getUserWithOrg();
  if (!user || !user.organizationId) {
    throw new Error("Unauthorized");
  }

  const validatedFields = createInvoiceSchema.parse(values);

  // 2. Calculs de sécurité (Côté Serveur)
  // On prépare les items pour prisma ET on calcule les totaux en même temps
  let calculatedSubtotal = 0; // HT
  let calculatedTax = 0; // TVA

  const itemsToCreate = validatedFields.items.map((item) => {
    // Conversion immédiate en centimes pour éviter les erreurs de float JS
    const priceInCents = Math.round(item.price * 100);
    const quantity = item.quantity;
    const taxRate = item.taxRate;

    // Calcul ligne par ligne
    const lineSubtotal = priceInCents * quantity; // HT de la ligne
    const lineTax = lineSubtotal * (taxRate / 100); // TVA de la ligne

    // Accumulation
    calculatedSubtotal += lineSubtotal;
    calculatedTax += lineTax;

    return {
      description: item.description,
      details: item.details,
      quantity: quantity,
      unite: item.unite,
      price: priceInCents, // Stocké en centimes
      taxRate: taxRate,
    };
  });

  // Arrondi final des totaux (pour avoir des entiers propres en DB)
  const finalSubtotal = Math.round(calculatedSubtotal);
  const finalTax = Math.round(calculatedTax);
  const finalTotal = finalSubtotal + finalTax;

  // 3. Numérotation (si vide)
  let invoiceNumber = validatedFields.number;
  if (!invoiceNumber || invoiceNumber.trim() === "") {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });
    invoiceNumber = generateNextNumber(lastInvoice?.number);
  }

  // 4. Insertion DB avec les totaux calculés
  const newInvoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      number: invoiceNumber,
      customerId: validatedFields.customerId,
      date: validatedFields.date,
      dueDate: validatedFields.dueDate,
      status: validatedFields.status,
      note: validatedFields.note,

      // Les champs que tu as ajoutés au modèle :
      subtotal: finalSubtotal,
      tax: finalTax,
      total: finalTotal,

      items: {
        create: itemsToCreate,
      },
    },
  });

  // 5. Revalidate & Redirect
  revalidatePath("/dashboard/invoices");
  return { success: true, id: newInvoice.id };
}

export async function getInvoices() {
  // Récupère intelligemment l'ID de l'org active
  const organizationId = await requireUserOrganization();

  if (!organizationId) return []; // Ou throw new Error("Pas d'organisation")

  // SECURITY: Multi-tenant filter
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: organizationId,
    },
    include: {
      customer: {
        select: {
          companyName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invoices;
}

export async function switchOrganization(newOrgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non authentifié");

  // Sécurité : Vérifier que l'utilisateur est bien membre de la nouvelle org
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: newOrgId,
      },
    },
  });

  if (!membership) throw new Error("Accès refusé à cette organisation");

  // Mise à jour de la vue
  await prisma.user.update({
    where: { id: user.id },
    data: { lastViewedOrgId: newOrgId },
  });

  revalidatePath("/", "layout");
}

export type ActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
};

export async function updateInvoice(
  invoiceId: string,
  data: CreateInvoiceValues
): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  const validated = createInvoiceSchema.safeParse(data);
  if (!validated.success) {
    return {
      error: "Données invalides",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { customerId, date, dueDate, status, number, items } = validated.data;

  // 1. Préparation des items & Calculs
  let subtotalCents = 0;
  let totalTaxCents = 0;

  const prismaItems = items.map((item) => {
    const priceCents = Math.round(item.price * 100);
    const quantity = item.quantity;
    const taxRate = item.taxRate;
    // On récupère le discount (assumons qu'il est stocké en int/pourcentage tel quel, sinon faire * 100 si c'est des euros)
    const discount = item.discount || 0;

    // NOTE: Ici, il faut savoir si le discount affecte le total calculé.
    // Pour l'instant, je garde ta logique simple (Prix * Qté),
    // mais idéalement : lineTotal = (priceCents * quantity) - discountCents;
    const lineTotalCents = priceCents * quantity;
    const lineTaxCents = lineTotalCents * (taxRate / 100);

    subtotalCents += lineTotalCents;
    totalTaxCents += lineTaxCents;

    return {
      description: item.description,
      details: item.details,
      quantity: quantity,
      unite: item.unite,
      price: priceCents,
      taxRate: taxRate,
      discount: discount, // <--- AJOUT CRITIQUE ICI
    };
  });

  const totalCents = subtotalCents + totalTaxCents;

  try {
    await prisma.$transaction(async (tx) => {
      // Vérification
      const existingInvoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId: organization.id },
      });

      if (!existingInvoice) {
        throw new Error("Facture introuvable ou accès refusé.");
      }

      // Update Header
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          customerId,
          number,
          date,
          dueDate,
          status,
          subtotal: Math.round(subtotalCents),
          tax: Math.round(totalTaxCents),
          total: Math.round(totalCents),
        },
      });

      // Update Items (Delete + Recreate)
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      if (prismaItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: prismaItems.map((item) => ({
            ...item,
            invoiceId: invoiceId,
          })),
        });
      }
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/edit/${invoiceId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateInvoice:", error);
    return {
      error: "Erreur technique lors de la mise à jour.",
    };
  }
}

export async function deleteInvoice(id: string): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  try {
    const count = await prisma.invoice.count({
      where: { id, organizationId: organization.id },
    });

    if (count === 0) {
      return { error: "Facture introuvable ou accès refusé" };
    }

    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteInvoice:", error);
    return { error: "Impossible de supprimer la facture." };
  }
}
