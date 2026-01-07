import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";

export const navItems = [
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Devis",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    name: "Factures",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    name: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
