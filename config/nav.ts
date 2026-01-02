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
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Factures",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
