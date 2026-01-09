"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "@/app/actions/organization";
import { createClient } from "@/lib/supabase/server";

// Validation basique
const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function addTeamMember(formData: FormData) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Aucune organisation active");

  // Get current authenticated user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Non autorisé");

  // SECURITY: Vérifier que l'utilisateur actuel est ADMIN de l'org
  const adminMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: authUser.id,
        organizationId: orgId,
      },
    },
  });

  if (!adminMembership || adminMembership.role !== "ADMIN") {
    throw new Error("Droits insuffisants");
  }

  const rawData = {
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
  };

  const validated = inviteSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  const { email, role } = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Chercher le user
      let user = await tx.user.findUnique({
        where: { email },
      });

      // 2. Si n'existe pas, on le crée (User fantôme)
      if (!user) {
        user = await tx.user.create({
          data: { email },
        });
      }

      // 3. Vérifier si déjà membre
      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: orgId,
          },
        },
      });

      if (existingMembership) {
        throw new Error("Cet utilisateur est déjà membre de l'équipe");
      }

      // 4. Créer le lien (Membership)
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          role: role as "ADMIN" | "MEMBER",
        },
      });
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Cet utilisateur est déjà membre de l'équipe") {
      return { success: false, error: "Déjà membre" };
    }
    console.error(error);
    return { success: false, error: "Erreur serveur lors de l'ajout" };
  }
}

export async function removeTeamMember(userId: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  // Get current authenticated user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Non autorisé");

  // SECURITY: Verify caller is ADMIN
  const callerMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: authUser.id, organizationId: orgId },
    },
  });
  if (!callerMembership || callerMembership.role !== "ADMIN") {
    throw new Error("Droits insuffisants");
  }

  // Prevent removing the last admin
  // On compte les admins de l'organisation
  const targetMembership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (targetMembership?.role === "ADMIN") {
    const adminCount = await prisma.membership.count({
      where: { organizationId: orgId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error("Impossible de supprimer le dernier administrateur");
    }
  }

  await prisma.membership.delete({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: orgId,
      },
    },
  });

  revalidatePath("/dashboard/settings");
}
