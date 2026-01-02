"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Hash,
  Calendar,
  PenLine,
  Eye,
  Mail,
  Building2,
  PhoneIcon,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailRow } from "./components/detail-row";
import { DetailGroup } from "./components/detail-group";

interface CustomerDetailsProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetails({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsProps) {
  if (!customer) return null;

  const displayName =
    customer.companyName || `${customer.firstName} ${customer.lastName}`;
  const initials = displayName.slice(0, 2).toUpperCase();

  const formattedAddress = [
    customer.address,
    [customer.zipCode, customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto bg-background"
      >
        <SheetHeader className="border-b px-6 py-4 sticky top-0">
          <SheetTitle className="text-lg font-semibold truncate pr-8">
            {displayName}
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-8">
          {/* HEADER AVATAR */}
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 text-2xl font-medium bg-muted text-primary border-4 border-background">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-center gap-6">
            <ActionButton icon={PenLine} label="Modifier" onClick={() => {}} />
            <ActionButton
              icon={Eye}
              label="Aperçu"
              onClick={() => {}}
              highlight
            />
          </div>

          {/* GROUPE 1 : INFOS CLES */}
          <DetailGroup title="Informations clés">
            <DetailRow
              icon={Mail}
              value={customer.email}
              label="Email principal"
            />
            <DetailRow
              icon={PhoneIcon}
              value={customer.phone}
              label="Téléphone"
            />
            <DetailRow icon={MapPin} value={formattedAddress} isMultiLine />
          </DetailGroup>

          {/* GROUPE 2 : DETAILS */}
          <DetailGroup title="Plus de détails">
            {customer.vatNumber && (
              <DetailRow
                icon={Building2}
                value={customer.vatNumber}
                fallback="Non renseigné"
                label="Numéro de TVA"
              />
            )}
            <DetailRow
              icon={Calendar}
              value={new Date(customer.createdAt).toLocaleDateString("fr-FR")}
              label="Client depuis le"
              copyValue={new Date(customer.createdAt).toISOString()}
            />
          </DetailGroup>

          <div className="h-10" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Petit composant local pour les boutons d'action
function ActionButton({
  icon: Icon,
  label,
  onClick,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center shadow-sm transition-all group-hover:scale-105",
          highlight
            ? "bg-primary text-primary-foreground shadow-primary/25"
            : "bg-background border hover:bg-muted"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </div>
  );
}
