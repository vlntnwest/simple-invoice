"use client";

import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react"; // Ajout icône erreur
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Optionnel: pour l'erreur globale
import { createCustomer } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils"; // Utilitaire pour fusionner les classes

export function CustomerForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompany, setIsCompany] = useState(false);

  // Nouveaux états pour la gestion d'erreur
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsLoading(true);
    // On reset les erreurs avant la nouvelle tentative
    setFieldErrors({});
    setGlobalError("");

    const res = await createCustomer(formData);
    setIsLoading(false);

    if (res?.error) {
      if (typeof res.error === "string") {
        // Cas 1: Erreur globale (ex: DB crash)
        setGlobalError(res.error);
      } else {
        // Cas 2: Erreur de validation Zod (ex: email invalide)
        setFieldErrors(res.error);
      }
    } else {
      // Succès
      setOpen(false);
      setIsCompany(false);
      setFieldErrors({});
      setGlobalError("");
    }
  }

  // Petit helper pour afficher l'erreur sous le champ
  const ErrorMessage = ({ field }: { field: string }) => {
    if (!fieldErrors[field]) return null;
    return (
      <p className="text-[0.8rem] font-medium text-destructive mt-1">
        {fieldErrors[field][0]}
      </p>
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:static md:h-auto md:w-auto md:rounded-md md:shadow-none">
          <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
          <span className="hidden md:inline">Nouveau Client</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Ajouter un client</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
            {/* Bloc d'erreur Globale */}
            {globalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}

            {/* CONTACT */}
            <div className="grid md:grid-cols-2 gap-4">
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
                  className={cn(
                    fieldErrors.firstName &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
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
                  className={cn(
                    fieldErrors.lastName &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <ErrorMessage field="lastName" />
              </div>
            </div>

            {/* TOGGLE TYPE CLIENT */}
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <Checkbox
                id="isCompany"
                checked={isCompany}
                onCheckedChange={(checked: boolean) => setIsCompany(checked)}
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

            {/* ENTREPRISE (Conditionnel) */}
            {isCompany && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className={
                      fieldErrors.companyName ? "text-destructive" : ""
                    }
                  >
                    Nom de l'entreprise *
                  </Label>
                  <Input
                    name="companyName"
                    id="companyName"
                    placeholder="Acme Corp"
                    className={cn(
                      fieldErrors.companyName &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <ErrorMessage field="companyName" />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="vatNumber"
                    className={fieldErrors.vatNumber ? "text-destructive" : ""}
                  >
                    Numéro de TVA
                  </Label>
                  <Input
                    name="vatNumber"
                    id="vatNumber"
                    placeholder="FR1234567890"
                    className={cn(
                      fieldErrors.vatNumber &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <ErrorMessage field="vatNumber" />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
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
                  placeholder="contact@exemple.com"
                  className={cn(
                    fieldErrors.email &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <ErrorMessage field="email" />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className={fieldErrors.phone ? "text-destructive" : ""}
                >
                  Téléphone
                </Label>
                <Input
                  name="phone"
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  className={cn(
                    fieldErrors.phone &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <ErrorMessage field="phone" />
              </div>
            </div>

            {/* ADRESSE */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                name="address"
                id="address"
                placeholder="123 Rue de la Tech..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Code Postal</Label>
                <Input name="zipCode" id="zipCode" placeholder="75001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input name="city" id="city" placeholder="Paris" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                name="country"
                id="country"
                defaultValue="France"
                placeholder="France"
              />
            </div>

            <DrawerFooter className="px-0 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer le client"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Annuler</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
