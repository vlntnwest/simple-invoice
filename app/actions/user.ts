"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName, lastName },
  });

  revalidatePath("/settings");
  return { success: true, message: "Profil mis à jour" };
}
