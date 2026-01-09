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

  const firstName = (formData.get("firstName") as string) ?? "";
  const lastName = (formData.get("lastName") as string) ?? "";

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  if (!trimmedFirstName || !trimmedLastName) {
    return {
      success: false,
      message: "Le prénom et le nom sont requis",
    };
  }

  if (trimmedFirstName.length > 100 || trimmedLastName.length > 100) {
    return {
      success: false,
      message: "Le prénom et le nom ne peuvent pas dépasser 100 caractères",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: trimmedFirstName, lastName: trimmedLastName },
  });

  revalidatePath("/settings");
  return { success: true, message: "Profil mis à jour" };
}
