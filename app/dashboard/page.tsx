import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; // Ton bon chemin utils
import prisma from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button"; // On vérifiera ce composant après
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  // 1. Vérification Session Supabase
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // 2. Récupération des données riches depuis Prisma
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        include: {
          organization: true, // On veut le nom de l'entreprise
        },
      },
    },
  });

  if (!user) {
    // Cas extrême : User dans Supabase mais pas dans Prisma
    return <div>Erreur : Compte utilisateur introuvable.</div>;
  }

  // 3. Trouver l'organisation active
  // On cherche celle qui correspond à lastViewedOrgId, sinon la première de la liste
  const currentMembership =
    user.memberships.find((m) => m.organizationId === user.lastViewedOrgId) ||
    user.memberships[0];

  const organization = currentMembership?.organization;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            👋 Bonjour, {user.firstName || "Inconnu"} !
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bloc Informations Organisation */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Espace de travail actuel
            </h3>

            {organization ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{organization.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {organization.id.slice(0, 8)}...
                  </p>
                </div>

                {/* Badge du rôle (Admin ou Member) */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    currentMembership.role === "ADMIN"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {currentMembership.role}
                </span>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">
                Aucune organisation trouvée.
              </p>
            )}
          </div>

          {/* Bouton de déconnexion */}
          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
