"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// --- Fonction utilitaire de synchronisation ---
// Cette fonction fusionne le user "Invité" (Prisma) avec le user "Auth" (Supabase)
async function syncUser(authUserId: string, email: string, metadata: any) {
  const firstName = metadata.firstName || "";
  const lastName = metadata.lastName || "";
  const companyName = metadata.companyName || "";

  await prisma.$transaction(async (tx) => {
    // 1. Chercher si un utilisateur existe déjà avec cet EMAIL
    const existingUser = await tx.user.findUnique({
      where: { email },
    });

    // CAS A : L'utilisateur existe déjà (invitation) mais avec un mauvais ID
    if (existingUser && existingUser.id !== authUserId) {
      console.log(`🔀 Migration du User ${existingUser.id} vers ${authUserId}`);

      // 1. Créer le nouveau user (avec l'ID Supabase) et un email temporaire
      // (On ne peut pas avoir deux fois le même email à cause de @unique)
      await tx.user.create({
        data: {
          id: authUserId,
          email: `${email}.migration`, // Email temporaire
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          lastViewedOrgId: existingUser.lastViewedOrgId,
        },
      });

      // 2. Transférer les Memberships de l'ancien vers le nouveau
      await tx.membership.updateMany({
        where: { userId: existingUser.id },
        data: { userId: authUserId },
      });

      // 3. Supprimer l'ancien user fantôme
      await tx.user.delete({
        where: { id: existingUser.id },
      });

      // 4. Remettre le bon email sur le nouveau user
      await tx.user.update({
        where: { id: authUserId },
        data: { email: email },
      });

      return; // Fin de la migration
    }

    // CAS B : L'utilisateur existe déjà et a le bon ID (Tout va bien)
    if (existingUser && existingUser.id === authUserId) {
      return;
    }

    // CAS C : Nouvel utilisateur complet (Pas d'invitation préalable)
    if (!existingUser) {
      const newUser = await tx.user.create({
        data: {
          id: authUserId,
          email,
          firstName,
          lastName,
        },
      });

      // On crée une organisation par défaut seulement pour les nouveaux inscrits (pas les invités)
      const newOrg = await tx.organization.create({
        data: {
          name: companyName || `${firstName}'s Company`,
        },
      });

      await tx.membership.create({
        data: {
          userId: newUser.id,
          organizationId: newOrg.id,
          role: "ADMIN",
        },
      });

      await tx.user.update({
        where: { id: newUser.id },
        data: { lastViewedOrgId: newOrg.id },
      });
    }
  });
}

// --- Actions Publiques ---

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Erreur connexion" };

  // Tentative de réparation/synchro à la connexion (Auto-Healing)
  try {
    await syncUser(
      data.user.id,
      data.user.email!,
      data.user.user_metadata || {}
    );
  } catch (e) {
    console.error("Erreur sync login:", e);
    // On ne bloque pas le login, mais ça risque de planter plus loin si pas sync
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const companyName = formData.get("companyName") as string;

  // 1. Auth Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName, companyName }, // Sauvegarde des infos
    },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Erreur création Auth" };

  // 2. Transaction Prisma avec gestion Invitation
  try {
    await syncUser(authData.user.id, email, {
      firstName,
      lastName,
      companyName,
    });
  } catch (dbError) {
    console.error("Erreur DB Signup:", dbError);
    return { error: "Erreur lors de l'initialisation du compte." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
