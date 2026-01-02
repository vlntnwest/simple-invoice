import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getUserContext } from "@/lib/context/context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization } = await getUserContext();

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        organization={organization}
        className="hidden md:flex"
      />

      <SidebarInset>
        <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-medium text-sm">Tableau de bord</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24 md:pb-4 md:pt-0">
          {children}
        </div>
      </SidebarInset>

      <MobileNav />
    </SidebarProvider>
  );
}
