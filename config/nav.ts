import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  HomeIcon,
} from "lucide-react";

export const navItems = [
  {
    name: "Accueil",
    href: "/",
    icon: HomeIcon,
  },
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
