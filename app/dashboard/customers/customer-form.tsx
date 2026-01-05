"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Actions
import { createCustomer } from "./actions";

// --- COMPOSANT PRINCIPAL (WRAPPER) ---
export function CustomerForm() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Bouton déclencheur (Identique pour les deux vues)
  const TriggerButton = (
    <Button className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:static md:h-auto md:w-auto md:rounded-md md:shadow-none">
      <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
      <span className="hidden md:inline">Nouveau Client</span>
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
          </DialogHeader>
          {/* On passe setOpen pour fermer après succès */}
          <CustomerFormContent setOpen={setOpen} isDrawer={false} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Ajouter un client</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto max-h-[80vh]">
          <CustomerFormContent setOpen={setOpen} isDrawer={true} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// --- COMPOSANT DE CONTENU (LOGIQUE DU FORMULAIRE) ---
interface FormContentProps {
  setOpen: (open: boolean) => void;
  isDrawer: boolean;
}

function CustomerFormContent({ setOpen, isDrawer }: FormContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsLoading(true);
    setFieldErrors({});
    setGlobalError("");

    try {
      const res = await createCustomer(formData);

      if (res?.error) {
        if (typeof res.error === "string") {
          setGlobalError(res.error);
        } else {
          setFieldErrors(res.error);
        }
      } else {
        // Succès
        setOpen(false);
        setIsCompany(false);
      }
    } catch (err) {
      setGlobalError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  const ErrorMessage = ({ field }: { field: string }) => {
    if (!fieldErrors[field]) return null;
    return (
      <p className="text-[0.8rem] font-medium text-destructive mt-1">
        {fieldErrors[field][0]}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* CONTACT */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="firstName"
            className={fieldErrors.firstName ? "text-destructive" : ""}
          >
            Prénom
          </Label>
          <Input
            name="firstName"
            id="firstName"
            placeholder="John"
            className={cn(fieldErrors.firstName && "border-destructive")}
          />
          <ErrorMessage field="firstName" />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="lastName"
            className={fieldErrors.lastName ? "text-destructive" : ""}
          >
            Nom {isCompany ? "" : "*"}
          </Label>
          <Input
            name="lastName"
            id="lastName"
            placeholder="Doe"
            className={cn(fieldErrors.lastName && "border-destructive")}
          />
          <ErrorMessage field="lastName" />
        </div>
      </div>

      {/* TOGGLE */}
      <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
        <Checkbox
          id="isCompany"
          checked={isCompany}
          onCheckedChange={(c) => setIsCompany(c as boolean)}
        />
        <input
          type="hidden"
          name="isCompany"
          value={isCompany ? "true" : "false"}
        />
        <Label htmlFor="isCompany" className="cursor-pointer font-medium">
          Ce client est une entreprise
        </Label>
      </div>

      {/* ENTREPRISE FIELDS */}
      {isCompany && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label
              htmlFor="companyName"
              className={fieldErrors.companyName ? "text-destructive" : ""}
            >
              Entreprise *
            </Label>
            <Input
              name="companyName"
              id="companyName"
              placeholder="Acme Corp"
              className={cn(fieldErrors.companyName && "border-destructive")}
            />
            <ErrorMessage field="companyName" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNumber">TVA Intra</Label>
            <Input name="vatNumber" id="vatNumber" placeholder="FR..." />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className={fieldErrors.email ? "text-destructive" : ""}
          >
            Email *
          </Label>
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="email@..."
            className={cn(fieldErrors.email && "border-destructive")}
          />
          <ErrorMessage field="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input name="phone" id="phone" type="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input name="address" id="address" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">Code Postal</Label>
          <Input name="zipCode" id="zipCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input name="city" id="city" />
        </div>
      </div>

      {/* FOOTER ADAPTATIF */}
      {isDrawer ? (
        <DrawerFooter className="px-0 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
        </DrawerFooter>
      ) : (
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      )}
    </form>
  );
}
