"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assure-toi d'avoir ce composant
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

export function CustomerForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await createCustomer(formData);
    setIsLoading(false);

    if (res?.error) {
      alert(typeof res.error === "string" ? res.error : "Erreur de validation");
    } else {
      setOpen(false);
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
        {/* max-h-[85vh] et overflow-y-auto sont vitaux pour le mobile */}
        <div className="mx-auto w-full max-w-sm max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Ajouter un client</DrawerTitle>
          </DrawerHeader>

          <form action={onSubmit} className="p-4 space-y-4">
            {/* ENTREPRISE */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise *</Label>
              <Input
                name="companyName"
                id="companyName"
                required
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

            {/* CONTACT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input name="lastName" id="lastName" placeholder="Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input name="firstName" id="firstName" placeholder="John" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="contact@acme.com"
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

            {/* NOTE */}
            <div className="space-y-2">
              <Label htmlFor="note">Note interne</Label>
              <Textarea name="note" id="note" placeholder="Infos diverses..." />
            </div>

            <DrawerFooter className="px-0 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Enregistrer"}
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
