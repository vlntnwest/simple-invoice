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
import { redirect } from "next/navigation";

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
