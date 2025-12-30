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

  if (error) {
    // Dans un cas réel, on retournerait l'erreur pour l'afficher
    // Pour l'instant on redirect ou on log
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const companyName = formData.get("companyName") as string;

  // 1. Création Auth Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création de l'utilisateur" };
  }

  // 2. Transaction Prisma : Créer Org + User lié
  try {
    await prisma.organization.create({
      data: {
        name: companyName || `${firstName} ${lastName}`,
        email: email,
        users: {
          create: {
            id: authData.user.id, // Lien Auth <-> DB
            email: email,
            firstName: firstName,
            lastName: lastName,
          },
        },
      },
    });
  } catch (dbError) {
    console.error("Erreur DB:", dbError);
    return { error: "Erreur lors de l'initialisation du compte." };
  }

  revalidatePath("/", "layout");
  redirect("/auth/sign-up-success");
}
