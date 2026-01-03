"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import { updateCustomer, ActionState } from "../../actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteCustomerDialog } from "../../components/delete-customer-dialog";

interface EditCustomerFormProps {
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zipCode?: string | null;
    country?: string | null;
    vatNumber?: string | null;
    type: "INDIVIDUAL" | "COMPANY";
  };
}

export function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // On initialise l'état avec les données existantes
  const [isCompany, setIsCompany] = useState(customer.type === "COMPANY");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});
    setGlobalError("");

    const formData = new FormData(e.currentTarget);
    const res: ActionState = await updateCustomer(formData);

    setIsLoading(false);

    if (res.success) {
      toast.success("Client modifié avec succès");
      router.push("/dashboard/customers");
    } else if (res.fieldErrors) {
      setFieldErrors(res.fieldErrors);
    } else if (res.error) {
      setGlobalError(res.error);
    }
  }

  const InputError = ({ name }: { name: string }) => {
    const errors = fieldErrors[name];
    if (!errors || errors.length === 0) return null;
    return (
      <p className="text-sm font-medium text-destructive mt-1">{errors[0]}</p>
    );
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto shadow-none">
        <CardHeader>
          <CardTitle>Modifier le client</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* ID CACHÉ IMPORTANT */}
            <input type="hidden" name="id" value={customer.id} />

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
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  name="firstName"
                  id="firstName"
                  defaultValue={customer.firstName || ""}
                />
                <InputError name="firstName" />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className={cn(fieldErrors.lastName && "text-destructive")}
                >
                  Nom {isCompany ? "" : "*"}
                </Label>
                <Input
                  name="lastName"
                  id="lastName"
                  defaultValue={customer.lastName || ""}
                  className={cn(fieldErrors.lastName && "border-destructive")}
                />
                <InputError name="lastName" />
              </div>
            </div>

            {/* TOGGLE */}
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <Checkbox
                id="isCompany"
                checked={isCompany}
                onCheckedChange={(c: boolean) => setIsCompany(c)}
              />
              <input type="hidden" name="isCompany" value={String(isCompany)} />
              <Label htmlFor="isCompany" className="cursor-pointer font-medium">
                Ce client est une entreprise
              </Label>
            </div>

            {/* ENTREPRISE */}
            {isCompany && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className={cn(
                      fieldErrors.companyName && "text-destructive"
                    )}
                  >
                    Nom de l'entreprise *
                  </Label>
                  <Input
                    name="companyName"
                    id="companyName"
                    defaultValue={customer.companyName || ""}
                    className={cn(
                      fieldErrors.companyName && "border-destructive"
                    )}
                  />
                  <InputError name="companyName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">Numéro de TVA</Label>
                  <Input
                    name="vatNumber"
                    id="vatNumber"
                    defaultValue={customer.vatNumber || ""}
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn(fieldErrors.email && "text-destructive")}
                >
                  Email *
                </Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  defaultValue={customer.email || ""}
                  className={cn(fieldErrors.email && "border-destructive")}
                />
                <InputError name="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  name="phone"
                  id="phone"
                  type="tel"
                  defaultValue={customer.phone || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                name="address"
                id="address"
                defaultValue={customer.address || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Code Postal</Label>
                <Input
                  name="zipCode"
                  id="zipCode"
                  defaultValue={customer.zipCode || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  name="city"
                  id="city"
                  defaultValue={customer.city || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                name="country"
                id="country"
                defaultValue={customer.country || "France"}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between mt-4">
            <Button variant="hided" type="button" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Sauvegarde..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Enregistrer
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="mt-4 border-t pt-4 flex justify-center">
        <DeleteCustomerDialog customerId={customer.id} />
      </div>
    </>
  );
}
