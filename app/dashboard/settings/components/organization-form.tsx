"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assure-toi d'avoir ce composant
import { updateOrganization } from "@/app/actions/organization";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Building2 } from "lucide-react";
import { Organization } from "@prisma/client"; // Import du type si disponible

export function OrganizationForm({
  organization,
}: {
  organization: Organization;
}) {
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization.logoLink);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!organization) return <p>Aucune organisation sélectionnée.</p>;

  // --- Gestion de l'Upload Logo (Client-Side) ---
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${organization.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(fileName);

      setLogoUrl(publicUrl); // Met à jour l'état local (et l'input caché)
      toast.success("Logo téléchargé (pensez à enregistrer !)");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  // --- Soumission du formulaire ---
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (logoUrl) {
        formData.set("logoLink", logoUrl);
      }

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
    <form action={handleSubmit} className="space-y-8 max-w-3xl">
      <input type="hidden" name="logoLink" value={logoUrl || ""} />
      {/* --- Section Identité & Logo --- */}
      <div className="flex flex-col gap-6 items-start">
        <div className="flex flex-col justify-center w-full items-center gap-3">
          <Avatar
            className="h-24 w-24 border cursor-pointer hover:opacity-80 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <AvatarImage src={logoUrl || ""} className="object-contain" />
            <AvatarFallback className="bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleLogoUpload}
            disabled={loading}
          />
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom commercial *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={organization.email || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={organization.phone || ""}
              />
            </div>
          </div>
        </div>
      </div>

      <hr />

      {/* --- Section Adresse --- */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Adresse Légale</h3>
        <div className="grid gap-2">
          <Label htmlFor="address">Rue / Voie</Label>
          <Input
            id="address"
            name="address"
            defaultValue={organization.address || ""}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <Input
              id="city"
              name="city"
              defaultValue={organization.city || ""}
            />
          </div>
          <div className="grid gap-2 col-span-2 md:col-span-1">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              name="country"
              defaultValue={organization.country || "France"}
            />
          </div>
        </div>
      </div>

      <hr />

      {/* --- Section Informations Légales --- */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Informations Légales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              name="siret"
              defaultValue={organization.siret || ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vatNumber">TVA Intracommunautaire</Label>
            <Input
              id="vatNumber"
              name="vatNumber"
              defaultValue={organization.vatNumber || ""}
            />
          </div>
        </div>
      </div>

      <hr />

      {/* --- Section Bancaire --- */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Coordonnées Bancaires (RIB)</h3>
        <div className="grid gap-2">
          <Label htmlFor="bankName">Nom de la banque</Label>
          <Input
            id="bankName"
            name="bankName"
            placeholder="Ex: Qonto, BNP..."
            defaultValue={organization.bankName || ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input id="iban" name="iban" defaultValue={organization.iban || ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bic">BIC</Label>
          <Input id="bic" name="bic" defaultValue={organization.bic || ""} />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto"
        disabled={loading}
      >
        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
