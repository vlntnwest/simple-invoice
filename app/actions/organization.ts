"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// --- Récupérer l'org active ---
export async function getCurrentOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("current_org_id")?.value;

  // 1. Si cookie présent, on vérifie l'appartenance
  if (cookieOrgId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: cookieOrgId,
        },
      },
    });
    if (membership) return cookieOrgId;
  }

  // 2. Fallback: Récupérer depuis la DB (lastViewedOrgId)
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.lastViewedOrgId) {
    // Vérif double sécurité
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: dbUser.lastViewedOrgId,
        },
      },
    });
    if (membership) return dbUser.lastViewedOrgId;
  }

  // 3. Dernier recours : Premier org trouvé
  const firstMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  return firstMembership?.organizationId || null;
}
// --- Création d'une nouvelle entreprise ---
export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const name = formData.get("name") as string;

  // Transaction : Créer Org + Membership ADMIN
  const newOrg = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name }, //
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN", //
      },
    });

    return org;
  });

  await switchOrganization(newOrg.id);
}

// --- Mise à jour entreprise ---
export async function updateOrganization(orgId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  // SECURITY: Vérifier droit ADMIN
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("Droit insuffisant");
  }

  // Récupération complète des champs
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    logoLink: formData.get("logoLink") as string,

    address: formData.get("address") as string,
    zipCode: formData.get("zipCode") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,

    siret: formData.get("siret") as string,
    vatNumber: formData.get("vatNumber") as string,

    iban: formData.get("iban") as string,
    bic: formData.get("bic") as string,
    bankName: formData.get("bankName") as string,
  };

  await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Entreprise mise à jour" };
}

// --- Switch Entreprise ---
export async function switchOrganization(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  // SECURITY: Vérifier appartenance
  const exists = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
  });
  if (!exists) throw new Error("Accès refusé à cette organisation");

  // 1. Update User DB pref
  await prisma.user.update({
    where: { id: user.id },
    data: { lastViewedOrgId: orgId }, //
  });

  // 2. Set Cookie
  const cookieStore = await cookies();
  cookieStore.set("current_org_id", orgId, { path: "/", maxAge: 31536000 });
}
