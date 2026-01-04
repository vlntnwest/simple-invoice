"use server";

import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
