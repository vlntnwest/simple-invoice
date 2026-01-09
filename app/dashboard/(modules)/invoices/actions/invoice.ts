"use server";

import prisma from "@/lib/prisma";
import {
  createInvoiceSchema,
  CreateInvoiceValues,
} from "../lib/schemas/invoice";
import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/context/context";
import { invoiceEvents } from "../lib/events/invoice-events";
import { requireUserOrganization } from "@/lib/context/organization";

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
  let subtotalCents = 0;
  let totalTaxCents = 0;

  const preparedItems = items.map((item) => {
    const priceCents = Math.round(item.price * 100);
    const quantity = item.quantity;
    const taxRate = item.taxRate;
    const discountPercent = item.discount || 0;

    const lineGrossCents = priceCents * quantity;
    const discountAmountCents = lineGrossCents * (discountPercent / 100);
    const lineNetCents = lineGrossCents - discountAmountCents;
    const lineTaxCents = lineNetCents * (taxRate / 100);

    subtotalCents += lineNetCents;
    totalTaxCents += lineTaxCents;

    return {
      description: item.description,
      details: item.details,
      quantity: quantity,
      unite: item.unite,
      price: priceCents,
      taxRate: taxRate,
      discount: discountPercent,
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
  const user = await getUserContext();
  if (!user || !user.organization) {
    throw new Error("Unauthorized");
  }

  const validatedFields = createInvoiceSchema.parse(values);

  // 2. Calculs de sécurité (Côté Serveur)
  let calculatedSubtotal = 0; // HT
  let calculatedTax = 0; // TVA

  const itemsToCreate = validatedFields.items.map((item) => {
    const priceInCents = Math.round(item.price * 100);
    const quantity = item.quantity;
    const taxRate = item.taxRate;

    const lineSubtotal = priceInCents * quantity;
    const lineTax = lineSubtotal * (taxRate / 100);

    calculatedSubtotal += lineSubtotal;
    calculatedTax += lineTax;

    return {
      description: item.description,
      details: item.details,
      quantity: quantity,
      unite: item.unite,
      price: priceInCents,
      taxRate: taxRate,
    };
  });

  const finalSubtotal = Math.round(calculatedSubtotal);
  const finalTax = Math.round(calculatedTax);
  const finalTotal = finalSubtotal + finalTax;

  // 3. Transaction avec calcul de numéro ATOMIQUE (ou presque)
  const newInvoice = await prisma.$transaction(async (tx) => {
    let invoiceNumber = validatedFields.number;

    // Si pas de numéro fourni, on le génère DANS la transaction
    if (!invoiceNumber || invoiceNumber.trim() === "") {
      const lastInvoice = await tx.invoice.findFirst({
        where: { organizationId: user.organization?.id },
        orderBy: { createdAt: "desc" },
        select: { number: true },
      });
      invoiceNumber = generateNextNumber(lastInvoice?.number);
    }

    return await tx.invoice.create({
      data: {
        number: invoiceNumber,
        status: validatedFields.status,
        date: validatedFields.date,
        dueDate: validatedFields.dueDate,
        subtotal: finalSubtotal,
        tax: finalTax,
        total: finalTotal,
        organizationId: user.organization!.id,
        customerId: validatedFields.customerId,
        note: validatedFields.note,
        items: {
          create: itemsToCreate,
        },
      },
    });
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
  if (!validated.success) return { error: "Données invalides" };

  const { customerId, date, dueDate, status, number, items, note } =
    validated.data;
  const calculation = calculateInvoiceTotals(items);

  try {
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId: organization.id },
      });
      if (!existing) throw new Error("Facture introuvable");

      // Mise à jour des infos
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          customerId,
          number,
          date,
          dueDate,
          status,
          note,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
        },
      });

      // Remplacement des items (Delete + Create)
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
      if (calculation.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: calculation.items.map((item) => ({ ...item, invoiceId })),
        });
      }
      return inv;
    });

    // 2. TRIGGER : Si le statut est passé à SENT, on déclenche les events
    if (updatedInvoice.status === "SENT") {
      await invoiceEvents.onValidate(updatedInvoice.id);
    }

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/edit/${invoiceId}`);
    return { success: true, id: invoiceId };
  } catch (error) {
    console.error("Erreur updateInvoice:", error);
    return { error: "Erreur technique lors de la mise à jour." };
  }
}

export async function deleteInvoice(id: string): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  try {
    const count = await prisma.invoice.count({
      where: { id, organizationId: organization.id },
    });

    if (count === 0) return { error: "Facture introuvable" };

    await prisma.invoice.delete({ where: { id } });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteInvoice:", error);
    return { error: "Impossible de supprimer la facture." };
  }
}

// Action rapide (pour les boutons "Valider" dans les listes/tableaux)
export async function validateInvoice(invoiceId: string): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId, organizationId: organization.id },
      data: { status: "SENT" },
    });

    // TRIGGER via le bouton dédié aussi
    await invoiceEvents.onValidate(updatedInvoice.id);

    revalidatePath("/dashboard/invoices");
    return { success: true, id: invoiceId };
  } catch (error) {
    return { error: "Impossible de valider la facture." };
  }
}

export async function getInvoices() {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return [];

  return await prisma.invoice.findMany({
    where: { organizationId },
    include: {
      customer: {
        select: { companyName: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientInvoices(customerId: string) {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return [];

  return await prisma.invoice.findMany({
    where: { customerId, organizationId },
    include: {
      customer: {
        select: { companyName: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Types
export type ActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};
