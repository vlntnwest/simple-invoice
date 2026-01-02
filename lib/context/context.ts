import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// 'cache' de React permet de dé-dupliquer les requêtes sur le serveur
export const getUserContext = cache(async () => {
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // 2. DB Fetch
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!dbUser) redirect("/login");

  // 3. Resolve Organization
  let currentOrgId = dbUser.lastViewedOrgId;

  // Security Check: Membership valid?
  const hasValidMembership = dbUser.memberships.some(
    (m) => m.organizationId === currentOrgId
  );

  if (!currentOrgId || !hasValidMembership) {
    if (dbUser.memberships.length > 0) {
      currentOrgId = dbUser.memberships[0].organizationId;
      // Side effect: update preference async (don't await to speed up UI)
      prisma.user
        .update({
          where: { id: dbUser.id },
          data: { lastViewedOrgId: currentOrgId },
        })
        .then();
    } else {
      // Edge case: No org
      return { user: dbUser, organization: null, membership: null };
    }
  }

  const currentMembership = dbUser.memberships.find(
    (m) => m.organizationId === currentOrgId
  );

  const organization = currentMembership?.organization || null;

  return {
    user: dbUser,
    organization,
    membership: currentMembership,
  };
});
