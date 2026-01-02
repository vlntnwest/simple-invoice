"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { createCustomer } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";

export function CustomerForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompany, setIsCompany] = useState(false); // false par défaut = Particulier

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await createCustomer(formData);
    setIsLoading(false);

    if (res?.error) {
      // Gestion simplifiée des erreurs pour l'exemple
      const msg =
        typeof res.error === "string"
          ? res.error
          : Object.values(res.error).flat().join(", ");
      alert(msg);
    } else {
      setOpen(false);
      // Reset form state si besoin
      setIsCompany(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:static md:h-10 md:w-auto md:rounded-md md:shadow-none">
          <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
          <span className="hidden md:inline">Nouveau Client</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Ajouter un client</DrawerTitle>
          </DrawerHeader>

          <form action={onSubmit} className="p-4 space-y-4">
            {/* CONTACT */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input name="firstName" id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom {isCompany ? "" : "*"}</Label>
                <Input name="lastName" id="lastName" placeholder="Doe" />
              </div>
            </div>

            {/* TOGGLE TYPE CLIENT */}
            <div className="flex items-center space-x-2 ">
              <Checkbox
                id="isCompany"
                checked={isCompany}
                onCheckedChange={(checked: boolean) => setIsCompany(checked)}
              />
              {/* TRICK: Input hidden pour envoyer la valeur au Server Action via FormData */}
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
                  <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                  <Input
                    name="companyName"
                    id="companyName"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">Numéro de TVA</Label>
                  <Input
                    name="vatNumber"
                    id="vatNumber"
                    placeholder="FR1234567890"
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="contact@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  name="phone"
                  id="phone"
                  type="tel"
                  placeholder="06 12..."
                />
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
                {isLoading ? "Création..." : "Enregistrer le client"}
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
