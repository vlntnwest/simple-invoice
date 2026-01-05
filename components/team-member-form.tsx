"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Loader2, Mail, Shield } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addTeamMember } from "@/app/actions/team";

export function TeamMemberForm({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Si aucun enfant n'est passé, on utilise le bouton par défaut
  const Trigger = children ? (
    // Important : Si c'est un composant custom comme une Card, il faut qu'il puisse recevoir les props de Trigger
    <span className="cursor-pointer h-full block">{children}</span>
  ) : (
    <Button size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Ajouter un membre</span>
      <span className="sm:hidden">Ajouter</span>
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{Trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Inviter un collaborateur</DialogTitle>
          </DialogHeader>
          <MemberFormContent setOpen={setOpen} isDrawer={false} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{Trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Inviter un collaborateur</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <MemberFormContent setOpen={setOpen} isDrawer={true} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ... Le reste du fichier (MemberFormContent) reste inchangé
function MemberFormContent({
  setOpen,
  isDrawer,
}: {
  setOpen: (o: boolean) => void;
  isDrawer: boolean;
}) {
  // ... (Garde le même code que je t'ai donné précédemment pour le contenu du formulaire)
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const res = await addTeamMember(formData);
      if (res?.success) {
        toast.success("Membre ajouté avec succès !");
        setOpen(false);
      } else {
        toast.error(
          typeof res?.error === "string" ? res.error : "Erreur de validation"
        );
      }
    } catch (e) {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="collegue@entreprise.com"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label>
        <div className="relative">
          <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
          <Select name="role" defaultValue="MEMBER">
            <SelectTrigger className="pl-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Membre (Accès standard)</SelectItem>
              <SelectItem value="ADMIN">Admin (Accès complet)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={isDrawer ? "pt-4" : "flex justify-end pt-4"}>
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Inviter
        </Button>
      </div>

      {isDrawer && (
        <DrawerFooter className="px-0">
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
        </DrawerFooter>
      )}
    </form>
  );
}
