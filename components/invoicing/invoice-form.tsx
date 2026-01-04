"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateInvoiceValues,
  createInvoiceSchema,
} from "@/lib/schemas/invoice";
import { createInvoice } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter } from "next/navigation";

type Props = {
  customers: { id: string; name: string }[];
};

const VAT_RATES = [
  { value: "20", label: "20%" },
  { value: "10", label: "10%" },
  { value: "5.5", label: "5.5%" },
  { value: "2.1", label: "2.1%" },
  { value: "0", label: "0% (Exo)" },
];

export function InvoiceForm({ customers }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateInvoiceValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      number: "",
      date: new Date(),
      status: "DRAFT",
      items: [
        {
          description: "",
          details: "",
          quantity: 1,
          unite: "unité",
          price: 0,
          taxRate: 20,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const estimatedTotal = items?.reduce((acc, item) => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.taxRate || 0;
    return acc + price * quantity * (1 + tax / 100);
  }, 0);

  function onSubmit(data: CreateInvoiceValues) {
    startTransition(async () => {
      try {
        const result = await createInvoice(data);

        if (result.success) {
          toast.success("Facture créée avec succès");
          router.push("/dashboard/invoices");
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors de la création");
        console.error(error);
      }
    });
  }

  const startDate = form.watch("date");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-32">
        {/* SECTION 1 : INFOS GÉNÉRALES */}
        <div className="space-y-4 bg-white p-4 rounded-xl border dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-700 dark:text-slate-200">
            <Receipt className="w-4 h-4" />
            Informations
          </div>

          {/* GRILLE 2 COLONNES FORCEE (Même sur mobile) */}
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Client */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Client..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Numéro de facture */}
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      // Si la valeur est undefined, on met une chaine vide pour éviter le warning React
                      value={field.value || ""}
                      placeholder="Laisser vide pour auto (ex: INV-005)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Date de facturation */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Émission</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => {
                        field.onChange(date);
                        const currentDueDate = form.getValues("dueDate");
                        if (date && currentDueDate && date > currentDueDate) {
                          form.setValue("dueDate", date);
                        }
                      }}
                      label="Date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Date d'échéance */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Échéance</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      label="Date"
                      minDate={startDate}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 2 : ARTICLES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold">Articles</h3>
          </div>

          {/* Correction layout : Ajout de md:grid md:grid-cols-2 */}
          <div className="space-y-4 md:gap-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-xl h-full flex flex-col justify-between"
              >
                <div className="relative flex flex-col gap-4">
                  {/* Ligne 1 : Nom */}
                  <div className="pr-10">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Nom
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Article..."
                              className="font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ligne 2 : Details */}
                  <div>
                    <FormField
                      control={form.control}
                      name={`items.${index}.details`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Détails..."
                              className="h-20 resize-none text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ligne 3 : Prix & TVA */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            P.U. HT (€)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.taxRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            TVA
                          </FormLabel>
                          <Select
                            onValueChange={(val) =>
                              field.onChange(parseFloat(val))
                            }
                            value={field.value.toString()} // Correction : Value contrôlée
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="%" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {VAT_RATES.map((rate) => (
                                <SelectItem key={rate.value} value={rate.value}>
                                  {rate.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ligne 4 : Quantité & Unité */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Qté
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unite`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Unité
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Jours..." />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Bouton supprimer */}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 mt-4 self-start"
                  onClick={() => remove(index)}
                >
                  <span>Supprimer l'article</span>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-2"
            onClick={() =>
              append({
                description: "",
                details: "",
                quantity: 1,
                unite: "Jours",
                price: 0,
                discount: 0,
                taxRate: 20,
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un article
          </Button>
        </div>

        {/* BOTTOM BAR / TOTAUX */}
        <div className="p-4 bg-white border-t dark:bg-slate-950 z-10 md:relative md:bg-transparent md:border-t-0 md:p-0">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            <div className="flex justify-between items-center text-lg font-bold px-1">
              <span>Total Estimé TTC</span>
              <span className="text-primary">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
            <Button
              type="submit"
              className="w-full font-bold"
              size="lg"
              disabled={isPending}
            >
              {isPending ? "Création..." : "Valider la facture"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
