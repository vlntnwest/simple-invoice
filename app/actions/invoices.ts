"use server";

import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";
import { createClient } from "@/lib/supabase/server";
import {
  createInvoiceSchema,
  CreateInvoiceValues,
} from "@/lib/schemas/invoice";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: CreateInvoiceValues) {
  const organizationId = await requireUserOrganization();
  if (!organizationId) throw new Error("Organisation introuvable");

  // 1. Validation des données brutes
  const validated = createInvoiceSchema.parse(data);

  // 2. Calculs Financiers Sécurisés (Côté Serveur)
  // On calcule tout en centimes pour éviter les erreurs d'arrondi flottant
  let subtotal = 0; // Total HT
  let taxAmount = 0; // Total TVA

  const itemsData = validated.items.map((item) => {
    const priceInCents = Math.round(item.price * 100);
    const lineTotalHT = priceInCents * item.quantity;
    const lineTax = Math.round(lineTotalHT * (item.taxRate / 100));

    subtotal += lineTotalHT;
    taxAmount += lineTax;

    return {
      description: item.description,
      quantity: item.quantity,
      price: priceInCents, // Stocké en centimes
      taxRate: item.taxRate,
      // Pas besoin de stocker le total ligne en DB selon ton schema,
      // mais pratique pour les calculs ici.
    };
  });

  const total = subtotal + taxAmount; // Total TTC

  // 3. Création en Base (Transactionnelle implicite via create imbriqué)
  // SECURITY: On force l'organizationId
  const lastInvoice = await prisma.invoice.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  // Génération basique de numéro (Ex: INV-001). À améliorer plus tard.
  const nextNumber = lastInvoice
    ? `INV-${String(
        parseInt(lastInvoice.number.split("-")[1] || "0") + 1
      ).padStart(3, "0")}`
    : "INV-001";

  await prisma.invoice.create({
    data: {
      organizationId,
      customerId: validated.customerId,
      number: nextNumber,
      status: validated.status,
      date: validated.date,
      dueDate: validated.dueDate,
      note: validated.note,

      // Totaux calculés
      subtotal,
      tax: taxAmount,
      total,

      // Création des lignes
      items: {
        create: itemsData,
      },
    },
  });

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
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
