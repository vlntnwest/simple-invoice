"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { CustomerType } from "@prisma/client";

// Schéma de validation conditionnel
const CustomerSchema = z.object({
  type: z.nativeEnum(CustomerType), // Validation stricte de l'enum
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  // On accepte string vide ou null pour companyName au départ
  companyName: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Organisation introuvable" };

  // 1. Déterminer le type
  const isCompany = formData.get("isCompany") === "true"; // On va passer "true" via un input hidden
  const type = isCompany ? "COMPANY" : "INDIVIDUAL";

  const rawData = {
    type,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    companyName: formData.get("companyName"),
    vatNumber: formData.get("vatNumber"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    zipCode: formData.get("zipCode"),
    country: formData.get("country"),
  };

  // 2. Validation Zod
  const validated = CustomerSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  // 3. Sauvegarde Prisma
  try {
    await prisma.customer.create({
      data: {
        ...validated.data,
        // Nettoyage : si Individual, on force companyName à null pour être propre
        companyName: type === "INDIVIDUAL" ? null : validated.data.companyName,
        organizationId: organization.id,
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur serveur lors de la création." };
  }
}
