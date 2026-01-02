import { getUserContext } from "@/lib/context/context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cette fonction est maintenant légère grâce au cache
  await getUserContext();

  return (
    <div className="min-h-screen bg-background">
      <main className="md:ml-64">{children}</main>
    </div>
  );
}
