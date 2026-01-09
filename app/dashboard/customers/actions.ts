"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { CustomerType } from "@prisma/client";
import { redirect } from "next/navigation";

export type ActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
};

// 1. On définit la structure de base (sans le superRefine)
const BaseCustomerSchema = z.object({
  type: z.nativeEnum(CustomerType),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  email: z
    .string()
    .min(1, "L'email est obligatoire")
    .email("Format d'email invalide"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// 2. On extrait la logique de validation métier pour la réutiliser
const customerRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (
    data.type === "COMPANY" &&
    (!data.companyName || data.companyName.trim() === "")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le nom de l'entreprise est obligatoire",
      path: ["companyName"],
    });
  }
  if (
    data.type === "INDIVIDUAL" &&
    (!data.lastName || data.lastName.trim() === "")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le nom de famille est obligatoire",
      path: ["lastName"],
    });
  }
};

// 3. Schéma pour la Création (Base + Refine)
const CustomerSchema = BaseCustomerSchema.superRefine(customerRefinement);

// 4. Schéma pour l'Update (Base + ID + Refine)
const UpdateCustomerSchema = BaseCustomerSchema.extend({
  id: z.string().min(1),
}).superRefine(customerRefinement);

export async function createCustomer(formData: FormData) {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Organisation introuvable" };

  // 1. Déterminer le type
  const isCompany = formData.get("isCompany") === "true";
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

export async function updateCustomer(formData: FormData): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Session expirée" };

  const isCompany = formData.get("isCompany") === "true";
  const type = isCompany ? "COMPANY" : "INDIVIDUAL";

  const rawData = {
    id: formData.get("id"),
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

  const validated = UpdateCustomerSchema.safeParse(rawData);

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  try {
    // SECURITY: Multi-tenant update
    // On vérifie d'abord que le client appartient à l'org
    const count = await prisma.customer.count({
      where: {
        id: validated.data.id,
        organizationId: organization.id,
      },
    });

    if (count === 0) return { error: "Client introuvable ou accès refusé" };

    await prisma.customer.update({
      where: { id: validated.data.id },
      data: {
        ...validated.data,
        companyName: type === "INDIVIDUAL" ? null : validated.data.companyName,
      },
    });

    revalidatePath("/dashboard/customers");
    // On revalide aussi la page spécifique
    revalidatePath(`/dashboard/customers/edit/${validated.data.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur Update:", error);
    return { error: "Erreur technique lors de la mise à jour." };
  }
}

export async function deleteCustomer(formData: FormData): Promise<ActionState> {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Session expirée" };

  const id = formData.get("id") as string;

  if (!id) return { error: "ID du client manquant" };

  try {
    // SECURITY: On vérifie que le client appartient bien à l'organisation avant de supprimer
    const count = await prisma.customer.count({
      where: {
        id: id,
        organizationId: organization.id,
      },
    });

    if (count === 0) return { error: "Client introuvable ou accès refusé" };

    // Suppression
    await prisma.customer.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Erreur Delete:", error);
    // Erreur typique : Le client a déjà des factures (Constraint Violation)
    return {
      error:
        "Impossible de supprimer ce client (il est probablement lié à des factures).",
    };
  }

  // Succès : On revalide et on redirige
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
