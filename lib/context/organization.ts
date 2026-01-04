import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUserOrganization() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // 1. Récupérer l'utilisateur et sa préférence
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastViewedOrgId: true },
  });

  // 2. Si une préférence existe, vérifier que le user est toujours membre (Sécurité)
  if (dbUser?.lastViewedOrgId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: dbUser.lastViewedOrgId,
        },
      },
    });

    if (membership) return membership.organizationId;
  }

  // 3. Fallback : Si pas de préférence (ou plus membre), prendre la première Org trouvée
  const firstMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { organizationId: true },
    orderBy: { createdAt: "asc" }, // Stabilité
  });

  if (!firstMembership) {
    // Cas critique : User sans organisation -> Redirection Onboarding
    // Pour l'instant on retourne null pour laisser l'appelant gérer
    return null;
  }

  // 4. Mettre à jour la préférence automatiquement (Auto-fix)
  await prisma.user.update({
    where: { id: user.id },
    data: { lastViewedOrgId: firstMembership.organizationId },
  });

  return firstMembership.organizationId;
}
