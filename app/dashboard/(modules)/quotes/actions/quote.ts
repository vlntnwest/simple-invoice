"use server";

import prisma from "@/lib/prisma";
import { createQuoteSchema, CreateQuoteValues } from "../lib/schemas/quote";
import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/context/context";
import { requireUserOrganization } from "@/lib/context/organization";

// --- HELPERS METIER ---

function generateNextNumber(lastNumber: string | undefined): string {
  if (!lastNumber) return "DEV-001";
  const match = lastNumber.match(/(\d+)$/);
  if (!match) return "DEV-001";
  const numberPart = match[1];
  const prefix = lastNumber.slice(0, -numberPart.length);
  const nextNumber = parseInt(numberPart, 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(numberPart.length, "0")}`;
}

function calculateQuoteTotals(items: CreateQuoteValues["items"]) {
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

function generateNextInvoiceNumber(lastNumber: string | undefined): string {
  if (!lastNumber) return "INV-001"; // Fallback par défaut

  const match = lastNumber.match(/(\d+)$/);
  if (!match) return "INV-001";

  const numberPart = match[1];
  const prefix = lastNumber.slice(0, -numberPart.length);
  const nextNumber = parseInt(numberPart, 10) + 1;

  return `${prefix}${nextNumber.toString().padStart(numberPart.length, "0")}`;
}

// --- ACTIONS ---

export async function createQuote(
  values: CreateQuoteValues
): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Unauthorized" };

  // Validation sécurisée
  const validated = createQuoteSchema.safeParse(values);
  if (!validated.success) {
    return {
      error: "Données invalides",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const validatedFields = validated.data;
  const calculation = calculateQuoteTotals(validatedFields.items);

  // LOGIQUE DE RETRY POUR EVITER LES COLLISIONS DE NUMERO
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const newQuote = await prisma.$transaction(async (tx) => {
        let quoteNumber = validatedFields.number;

        // Génération du numéro si absent DANS la transaction
        if (!quoteNumber || quoteNumber.trim() === "") {
          const lastQuote = await tx.quote.findFirst({
            where: { organizationId: organization.id },
            orderBy: { createdAt: "desc" },
            select: { number: true },
          });
          quoteNumber = generateNextNumber(lastQuote?.number);
        }

        return await tx.quote.create({
          data: {
            organizationId: organization.id,
            number: quoteNumber,
            customerId: validatedFields.customerId,
            date: validatedFields.date,
            validUntil: validatedFields.validUntil,
            status: validatedFields.status,
            note: validatedFields.note,
            subtotal: calculation.subtotal,
            tax: calculation.tax,
            total: calculation.total,
            items: {
              create: calculation.items,
            },
          },
        });
      });

      revalidatePath("/dashboard/quotes");
      return { success: true, id: newQuote.id };
    } catch (error: any) {
      // Gestion de l'erreur Prisma P2002 (Unique constraint failed)
      if (error.code === "P2002") {
        // Cas A : L'utilisateur a fourni son propre numéro -> Erreur directe
        if (validatedFields.number && validatedFields.number.trim() !== "") {
          return { error: "Ce numéro de devis existe déjà." };
        }

        // Cas B : Numéro auto-généré -> On réessaie (Collision concurrente)
        attempts++;
        if (attempts < maxRetries) {
          continue; // On boucle pour regénérer un nouveau numéro
        }
      }

      console.error("Erreur createQuote:", error);
      return { error: "Erreur technique lors de la création du devis." };
    }
  }

  return {
    error:
      "Impossible de générer un numéro unique après plusieurs essais. Veuillez réessayer.",
  };
}

export async function updateQuote(
  quoteId: string,
  data: CreateQuoteValues
): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  const validated = createQuoteSchema.safeParse(data);
  if (!validated.success) return { error: "Données invalides" };

  const { customerId, date, validUntil, status, number, items, note } =
    validated.data;
  const calculation = calculateQuoteTotals(items);

  try {
    const updatedQuote = await prisma.$transaction(async (tx) => {
      const existing = await tx.quote.findFirst({
        where: { id: quoteId, organizationId: organization.id },
      });
      if (!existing) throw new Error("Devis introuvable");

      // Mise à jour des infos
      const inv = await tx.quote.update({
        where: { id: quoteId },
        data: {
          customerId,
          number,
          date,
          validUntil,
          status,
          note,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
        },
      });

      // Remplacement des items (Delete + Create)
      await tx.quoteItem.deleteMany({ where: { quoteId } });
      if (calculation.items.length > 0) {
        await tx.quoteItem.createMany({
          data: calculation.items.map((item) => ({ ...item, quoteId })),
        });
      }
      return inv;
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/edit/${quoteId}`);
    return { success: true, id: quoteId };
  } catch (error) {
    console.error("Erreur updateQuote:", error);
    return { error: "Erreur technique lors de la mise à jour." };
  }
}

export async function deleteQuote(id: string): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  try {
    const count = await prisma.quote.count({
      where: { id, organizationId: organization.id },
    });

    if (count === 0) return { error: "Devis introuvable" };

    await prisma.quote.delete({ where: { id } });

    revalidatePath("/dashboard/quotes");
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteQuote:", error);
    return { error: "Impossible de supprimer le devis." };
  }
}

// Action rapide (pour les boutons "Valider" dans les listes/tableaux)
export async function validateQuote(quoteId: string): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Non autorisé" };

  try {
    await prisma.quote.update({
      where: { id: quoteId, organizationId: organization.id },
      data: { status: "SENT" },
    });

    revalidatePath("/dashboard/quotes");
    return { success: true, id: quoteId };
  } catch (error) {
    return { error: "Impossible de valider le devis." };
  }
}

export async function getQuotes() {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return [];

  const quotes = await prisma.quote.findMany({
    where: { organizationId },
    include: {
      customer: {
        select: { companyName: true, firstName: true, lastName: true },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((quote) => ({
    ...quote,
    items: quote.items?.map((item) => ({
      ...item,
      taxRate: item.taxRate != null ? item.taxRate.toNumber() : 20,
    })),
  }));
}

export async function getClientQuotes(customerId: string) {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return [];

  const quotes = await prisma.quote.findMany({
    where: { customerId, organizationId },
    include: {
      customer: {
        select: { companyName: true, firstName: true, lastName: true },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((quote) => ({
    ...quote,
    items: quote.items?.map((item) => ({
      ...item,
      taxRate: item.taxRate != null ? item.taxRate.toNumber() : 20,
    })),
  }));
}

export async function transformQuoteToInvoice(quoteId: string) {
  // 1. Auth & Security Check
  const organizationId = await requireUserOrganization();
  if (!organizationId) return { error: "Non autorisé" };

  // 2. Fetch du Devis
  const quote = await prisma.quote.findUnique({
    where: {
      id: quoteId,
      organizationId: organizationId,
    },
    include: { items: true },
  });

  if (!quote) return { error: "Devis introuvable" };

  try {
    // 3. Transaction Database
    const result = await prisma.$transaction(async (tx) => {
      // SECURITY: Check for existing invoice INSIDE transaction with organizationId filter
      // Use findFirst because findUnique requires unique constraint on ALL where fields
      const existingInvoice = await tx.invoice.findFirst({
        where: {
          fromQuoteId: quoteId,
          organizationId: organizationId,
        },
        select: { id: true },
      });

      if (existingInvoice) {
        return { existingId: existingInvoice.id };
      }

      // A. Passer le devis en ACCEPTED
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED" },
      });

      // B. Générer le numéro de facture
      const lastInvoice = await tx.invoice.findFirst({
        where: { organizationId: organizationId },
        orderBy: { createdAt: "desc" },
        select: { number: true },
      });

      const invoiceNumber = generateNextInvoiceNumber(lastInvoice?.number);

      // C. Créer la facture
      const invoice = await tx.invoice.create({
        data: {
          organizationId: organizationId,
          customerId: quote.customerId,
          number: invoiceNumber,
          status: "DRAFT",
          fromQuoteId: quoteId,

          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // J+30

          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          note: quote.note,

          items: {
            create: quote.items.map((item) => ({
              description: item.description,
              details: item.details,
              quantity: item.quantity,
              unite: item.unite,
              price: item.price,
              taxRate: item.taxRate,
              discount: item.discount,
            })),
          },
        },
        select: { id: true },
      });

      return { newId: invoice.id };
    });

    // 4. Succès & Revalidation
    if (result.existingId) {
      return {
        success: true,
        invoiceId: result.existingId,
        message: "Cette facture existe déjà.",
      };
    }

    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard/invoices");

    return {
      success: true,
      invoiceId: result.newId,
      message: "Facture créée avec succès !",
    };
  } catch (error) {
    console.error("Erreur transformation devis->facture:", error);
    if ((error as any).code === "P2002") {
      return {
        error: "Erreur de numérotation ou conflit, veuillez réessayer.",
      };
    }
    return { error: "Une erreur est survenue lors de la création." };
  }
}

// Types
export type ActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};
