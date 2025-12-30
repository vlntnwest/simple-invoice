import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Vérif Session Supabase
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // 2. Récupérer le User Prisma + Ses Memberships
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        include: { organization: true }, // On récupère les infos des orgs
      },
    },
  });

  if (!dbUser) redirect("/login"); // Cas "Zombie"

  // 3. Déterminer l'Organisation Active
  // Priorité : lastViewedOrgId > Première Org de la liste > Aucune
  let currentOrgId = dbUser.lastViewedOrgId;

  // Sécurité : Si l'ID stocké ne correspond plus à une membership valide (ex: exclu)
  const hasValidMembership = dbUser.memberships.some(
    (m) => m.organizationId === currentOrgId
  );

  if (!currentOrgId || !hasValidMembership) {
    if (dbUser.memberships.length > 0) {
      // Fallback sur la première org trouvée
      currentOrgId = dbUser.memberships[0].organizationId;

      // On met à jour la DB pour la prochaine fois (Optionnel mais propre)
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastViewedOrgId: currentOrgId },
      });
    } else {
      // Cas rare : User inscrit mais sans aucune org (invitation en attente ?)
      // Pour l'instant, on redirige vers une page de création d'org (à faire plus tard)
      return <div className="p-10">Vous n'avez aucune organisation.</div>;
    }
  }

  // TODO: On pourrait passer 'currentOrg' via un Context React ici plus tard

  return (
    <div className="min-h-screen bg-background">
      <main className="md:ml-64">{children}</main>
    </div>
  );
}
