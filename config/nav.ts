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
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Factures",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
