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

// --- HELPERS METIER ---

function generateNextNumber(lastNumber: string | undefined): string {
  if (!lastNumber) return "INV-001";
  const match = lastNumber.match(/(\d+)$/);
  if (!match) return "INV-001";
  const numberPart = match[1];
  const prefix = lastNumber.slice(0, -numberPart.length);
  const nextNumber = parseInt(numberPart, 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(numberPart.length, "0")}`;
}

function calculateInvoiceTotals(items: CreateInvoiceValues["items"]) {
  let subtotalCents = 0; // Total HT après remise
  let totalTaxCents = 0; // Total TVA

  const preparedItems = items.map((item) => {
    const priceCents = Math.round(item.price * 100);
    const quantity = item.quantity;
    const taxRate = item.taxRate;
    const discountPercent = item.discount || 0;

    // 1. Total brut de la ligne
    const lineGrossCents = priceCents * quantity;

    // 2. Montant de la remise
    const discountAmountCents = lineGrossCents * (discountPercent / 100);

    // 3. Total HT de la ligne (Base imposable)
    const lineNetCents = lineGrossCents - discountAmountCents;

    // 4. Montant TVA
    const lineTaxCents = lineNetCents * (taxRate / 100);

    // Accumulation
    subtotalCents += lineNetCents;
    totalTaxCents += lineTaxCents;

    return {
      description: item.description,
      details: item.details,
      quantity: quantity,
      unite: item.unite,
      price: priceCents,
      taxRate: taxRate,
      discount: discountPercent, // IMPORTANT : On stocke la remise
    };
  });

  return {
    subtotal: Math.round(subtotalCents),
    tax: Math.round(totalTaxCents),
    total: Math.round(subtotalCents + totalTaxCents),
    items: preparedItems,
  };
}

// --- ACTIONS ---

export async function createInvoice(values: CreateInvoiceValues) {
  // 1. Auth & Org
  const user = await getUserWithOrg();
  if (!user || !user.organizationId) {
    throw new Error("Unauthorized");
  }

  const validatedFields = createInvoiceSchema.parse(values);

  // 2. Calculs (Centralisés)
  const calculation = calculateInvoiceTotals(validatedFields.items);

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

  // 4. Insertion DB
  const newInvoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      number: invoiceNumber,
      customerId: validatedFields.customerId,
      date: validatedFields.date,
      dueDate: validatedFields.dueDate,
      status: validatedFields.status,
      note: validatedFields.note,

      // Totaux calculés
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      total: calculation.total,

      items: {
        create: calculation.items,
      },
    },
  });

  revalidatePath("/dashboard/invoices");
  return { success: true, id: newInvoice.id };
}

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

  // 1. Calculs (Réutilisation de la même logique que Create)
  const calculation = calculateInvoiceTotals(items);

  try {
    await prisma.$transaction(async (tx) => {
      // Vérification sécurité
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
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
        },
      });

      // Update Items (Delete + Recreate pattern)
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      if (calculation.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: calculation.items.map((item) => ({
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
    // Vérification stricte via organizationId
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

export async function getInvoices() {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return [];

  // SECURITY: Multi-tenant filter
  return await prisma.invoice.findMany({
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
}

// Type export
export type ActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};
