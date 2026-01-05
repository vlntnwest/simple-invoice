import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/app/actions/organization";
import { OrgSwitcher } from "@/components/org-switcher";
import { Building2, Users, FileText, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TeamMemberForm } from "@/components/team-member-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Récupération des données contextuelles
  const currentOrgId = await getCurrentOrgId();

  // Charge toutes les organisations du user pour le switcher
  const organizations = await prisma.organization.findMany({
    where: { memberships: { some: { userId: user.id } } },
    select: { id: true, name: true },
  });

  // Charge les détails de l'organisation active
  const currentOrg = await prisma.organization.findUnique({
    where: { id: currentOrgId || "" },
    include: {
      _count: {
        select: { customers: true, invoices: true },
      },
    },
  });

  // Fallback si pas d'org (ne devrait pas arriver avec le middleware/onboarding)
  if (!currentOrg) return <div>Chargement...</div>;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* En-tête Pleine Largeur */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* --- Carte Entreprise --- */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {currentOrg.name}
            </CardTitle>
            <CardDescription>
              {currentOrg.address ? (
                <div>
                  <p>{currentOrg.address}</p>
                  <p>
                    {currentOrg.zipCode} {currentOrg.city}
                  </p>
                  <p>{currentOrg.country}</p>
                </div>
              ) : (
                "Aucune adresse configurée"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {currentOrg._count.customers}
                </span>{" "}
                clients •{" "}
                <span className="font-medium text-foreground">
                  {currentOrg._count.invoices}
                </span>{" "}
                factures
              </div>

              {/* Le switcher est ici utilisé comme bouton d'action */}
              <div className="w-full sm:w-auto">
                <OrgSwitcher
                  organizations={organizations}
                  currentOrgId={currentOrgId}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Actions Rapides --- */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Action: Créer Client */}
          <Link href="/dashboard/customers" className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:bg-muted/50 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Nouveau Client
                  </span>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ajouter un nouveau client à votre répertoire pour lui adresser
                  des devis.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Action: Créer Facture (Phase 5) */}
          <Link href="/dashboard/invoices/new" className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:bg-muted/50 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Nouvelle Facture
                  </span>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Éditer une facture pour un client existant ou créer un
                  brouillon.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Action: Inviter Membre (Nouvelle Carte) */}
          <TeamMemberForm>
            <Card className="h-full group transition-all hover:border-primary/50 hover:bg-muted/50 cursor-pointer text-left">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Inviter Membre
                  </span>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Donner accès à votre organisation à un collaborateur.
                </p>
              </CardContent>
            </Card>
          </TeamMemberForm>
        </div>

        {/* Placeholder pour les stats futures */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-3 bg-muted/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <p className="font-medium">Statistiques à venir</p>
              <p className="text-sm text-muted-foreground">
                Les graphiques de chiffre d'affaires arriveront dans la Phase 5.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
