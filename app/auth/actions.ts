"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

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
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Erreur création user Supabase" };

  const userId = authData.user.id;

  // 2. Transaction Prisma Sécurisée
  try {
    await prisma.$transaction(async (tx) => {
      // A. On crée d'abord le User
      // On utilise 'tx' au lieu de 'prisma' pour que tout soit lié
      const newUser = await tx.user.create({
        data: {
          id: userId, // ID venant de Supabase
          email: email,
          firstName: firstName,
          lastName: lastName,
        },
      });

      // B. On crée l'Organisation
      const newOrg = await tx.organization.create({
        data: {
          name: companyName || `${firstName}'s Company`,
        },
      });

      // C. On crée le lien (Membership) maintenant qu'on a les deux IDs !
      await tx.membership.create({
        data: {
          userId: newUser.id,
          organizationId: newOrg.id,
          role: "ADMIN",
        },
      });

      // D. On met à jour la vue par défaut
      await tx.user.update({
        where: { id: newUser.id },
        data: { lastViewedOrgId: newOrg.id },
      });
    });
  } catch (dbError) {
    console.error("GRAVE Erreur DB:", dbError);
    // Ici, tu pourrais appeler supabase.auth.admin.deleteUser... pour nettoyer
    return { error: "Erreur lors de l'initialisation de la base de données." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
