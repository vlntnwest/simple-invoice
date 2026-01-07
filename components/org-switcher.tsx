"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrganization,
  switchOrganization,
} from "@/app/actions/organization";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Org = {
  id: string;
  name: string;
};

interface OrgSwitcherProps {
  organizations: Org[];
  currentOrgId: string | null;
}

export function OrgSwitcher({ organizations, currentOrgId }: OrgSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between sm:w-[250px]"
    >
      <div className="flex items-center gap-2 truncate">
        <Building2 className="h-4 w-4 shrink-0 opacity-50" />
        <span className="truncate">
          {currentOrg ? currentOrg.name : "Sélectionner une entreprise"}
        </span>
      </div>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mes Entreprises</DialogTitle>
            <DialogDescription>
              Changez d'organisation ou créez-en une nouvelle.
            </DialogDescription>
          </DialogHeader>
          <OrgForm
            organizations={organizations}
            currentOrgId={currentOrgId}
            setOpen={setOpen}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Mes Entreprises</DrawerTitle>
          <DrawerDescription>
            Changez d'organisation ou créez-en une nouvelle.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <OrgForm
            organizations={organizations}
            currentOrgId={currentOrgId}
            setOpen={setOpen}
          />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// --- Sous-composant Formulaire (partagé) ---
function OrgForm({
  organizations,
  currentOrgId,
  setOpen,
}: {
  organizations: Org[];
  currentOrgId: string | null;
  setOpen: (open: boolean) => void;
}) {
  const [isCreating, setIsCreating] = React.useState(false);
  const router = useRouter();

  async function onSelectOrg(orgId: string) {
    if (orgId === currentOrgId) return;
    try {
      await switchOrganization(orgId);
      router.refresh();
      toast.success("Organisation changée");
      setOpen(false);
    } catch (error) {
      toast.error("Impossible de changer d'organisation");
    }
  }

  async function onCreateOrg(formData: FormData) {
    setIsCreating(true);
    try {
      await createOrganization(formData);
      router.refresh();
      toast.success("Nouvelle entreprise créée !");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid items-start gap-4">
      {/* Sélecteur */}
      <div className="grid gap-2">
        <Label>Changer d'entreprise</Label>
        <Select defaultValue={currentOrgId || ""} onValueChange={onSelectOrg}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Séparateur */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou créer
          </span>
        </div>
      </div>

      {/* Création */}
      <form action={onCreateOrg} className="grid gap-2">
        <Label htmlFor="name">Nouvelle entreprise</Label>
        <div className="flex gap-2">
          <Input id="name" name="name" placeholder="Nom" required />
          <Button type="submit" size="icon" disabled={isCreating}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
