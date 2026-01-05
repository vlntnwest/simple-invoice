import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/app/actions/organization";
import { ProfileForm } from "./components/profile-form";
import { OrganizationForm } from "./components/organization-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Récupération des données
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const currentOrgId = await getCurrentOrgId();

  let currentOrg = null;
  if (currentOrgId) {
    currentOrg = await prisma.organization.findUnique({
      where: { id: currentOrgId },
    });
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      </div>
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="profile">Mon Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                {/* On passe les données au composant client */}
                <OrganizationForm organization={currentOrg} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Mes informations</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm user={dbUser} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
