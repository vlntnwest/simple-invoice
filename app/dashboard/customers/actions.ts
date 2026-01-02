"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";

// Schéma de validation
const CustomerSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est obligatoire"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  vatNumber: z.string().optional(),
  note: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const { organization } = await getUserContext();
  if (!organization) return { error: "Organisation introuvable" };

  const rawData = {
    companyName: formData.get("companyName") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    zipCode: formData.get("zipCode") as string,
    country: formData.get("country") as string,
    vatNumber: formData.get("vatNumber") as string,
    note: formData.get("note") as string,
  };

  const validated = CustomerSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  // SECURITY: On force l'organizationId
  await prisma.customer.create({
    data: {
      ...validated.data,
      organizationId: organization.id,
    },
  });

  revalidatePath("/dashboard/customers");
  return { success: true };
}
