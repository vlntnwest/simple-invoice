"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateOrganization } from "@/app/actions/organization";
import { toast } from "sonner";
import { useState } from "react";

export function OrganizationForm({ organization }: { organization: any }) {
  const [loading, setLoading] = useState(false);

  if (!organization)
    return (
      <p className="text-muted-foreground">Aucune organisation sélectionnée.</p>
    );

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      // On passe l'ID manuellement ou via bind dans l'action,
      // ici on appelle l'action importée wrapper
      await updateOrganization(organization.id, formData);
      toast.success("Entreprise mise à jour !");
    } catch (error) {
      toast.error("Impossible de mettre à jour");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nom de l'entreprise</Label>
        <Input
          id="name"
          name="name"
          defaultValue={organization.name}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="siret">SIRET</Label>
          <Input
            id="siret"
            name="siret"
            defaultValue={organization.siret || ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vatNumber">TVA Intra</Label>
          <Input
            id="vatNumber"
            name="vatNumber"
            defaultValue={organization.vatNumber || ""}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          name="address"
          defaultValue={organization.address || ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="zipCode">Code Postal</Label>
          <Input
            id="zipCode"
            name="zipCode"
            defaultValue={organization.zipCode || ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={organization.city || ""} />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-2">Coordonnées Bancaires</h3>
        <div className="grid gap-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input id="iban" name="iban" defaultValue={organization.iban || ""} />
        </div>
        <div className="grid gap-2 mt-2">
          <Label htmlFor="bic">BIC</Label>
          <Input id="bic" name="bic" defaultValue={organization.bic || ""} />
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
