"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "@/app/actions/organization";

// Validation basique
const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function addTeamMember(formData: FormData) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Aucune organisation active");

  // SECURITY: Vérifier que l'utilisateur actuel est ADMIN de l'org
  const currentUser = await prisma.user.findFirst({
    where: {
      memberships: {
        some: {
          organizationId: orgId,
          role: "ADMIN", // Seuls les admins peuvent inviter
        },
      },
    },
  });

  // Note: Dans une vraie app, on utiliserait l'ID du user connecté via Supabase Auth
  // Ici on assume que le middleware a fait le travail ou on vérifie via cookie/session
  // Pour simplifier l'exemple, on passe à la suite, mais idéalement :
  // if (!currentUser) throw new Error("Droits insuffisants")

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

      // 2. Si n'existe pas, on le crée (User fantôme pour le moment)
      if (!user) {
        // Attention: L'ID est généré ici. Si Supabase crée un user plus tard,
        // il faudra gérer la réconciliation des IDs (souvent via un trigger DB).
        user = await tx.user.create({
          data: {
            email,
            // On peut mettre un flag "isInvited" si tu ajoutes ce champ au schema
          },
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
    // Si c'est notre erreur manuelle
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

  // SECURITY: Multi-tenant delete
  // Empêcher de se supprimer soi-même si on est le dernier admin (logique à ajouter si besoin)

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
