"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// --- Récupérer l'org active ---
export async function getCurrentOrgId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get("current_org_id")?.value;

  if (orgId) return orgId;

  // Fallback: Récupérer depuis la DB si pas de cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.lastViewedOrgId) return dbUser.lastViewedOrgId;
  }
  return null;
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

  // Récupération des champs du formulaire
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    zipCode: formData.get("zipCode") as string, //
    city: formData.get("city") as string,
    siret: formData.get("siret") as string, //
    iban: formData.get("iban") as string,
    bic: formData.get("bic") as string, //
    vatNumber: formData.get("vatNumber") as string,
  };

  await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  revalidatePath("/settings");
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
