import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getUserWithOrg() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // On récupère le User ET ses Memberships
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        take: 1, // On prend la première organisation (contexte actuel)
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!dbUser || dbUser.memberships.length === 0) {
    return null;
  }

  // On retourne un objet "aplati" facile à utiliser
  return {
    ...dbUser,
    organizationId: dbUser.memberships[0].organizationId,
  };
}
