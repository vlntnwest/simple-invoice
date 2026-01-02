import { getUserContext } from "@/lib/context/context";
import { LogoutButton } from "@/components/logout-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  // Appel identique, mais instantané (0 requête DB ici car cache hit)
  const { user, organization, membership } = await getUserContext();

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
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Espace de travail actuel
            </h3>

            {organization && membership ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{organization.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {organization.id.slice(0, 8)}...
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    membership.role === "ADMIN"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {membership.role}
                </span>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">
                Aucune organisation trouvée.
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
