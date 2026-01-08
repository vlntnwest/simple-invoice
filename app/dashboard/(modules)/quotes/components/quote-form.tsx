"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateQuoteValues,
  createQuoteSchema,
} from "@/app/dashboard/(modules)/quotes/lib/schemas/quote";
import {
  ActionState,
  createQuote,
  updateQuote,
} from "@/app/dashboard/(modules)/quotes/actions/quote";
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
import { CheckCircle, FileText, Plus, Receipt, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Quote, QuoteItem } from "@prisma/client";

type Props = {
  quote?: Quote & { items: QuoteItem[] };
  customers: { id: string; name: string }[];
};

const VAT_RATES = [
  { value: "20", label: "20%" },
  { value: "10", label: "10%" },
  { value: "5.5", label: "5.5%" },
  { value: "2.1", label: "2.1%" },
  { value: "0", label: "0%" },
];

export function QuoteForm({ quote, customers }: Props) {
  const searchParams = useSearchParams();
  const preFetchedCustomerId = searchParams.get("customerId");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditMode = !!quote;

  const [submitAction, setSubmitAction] = useState<"save" | "generate">("save");

  // Préparation des valeurs par défaut
  const defaultValues: Partial<CreateQuoteValues> = {
    number: quote?.number ?? "",
    customerId: quote?.customerId ?? preFetchedCustomerId ?? "",
    date: quote?.date ? new Date(quote.date) : new Date(),
    validUntil: quote?.validUntil ? new Date(quote.validUntil) : undefined,
    status: quote?.status ?? "DRAFT",
    note: quote?.note ?? "",
    items: quote?.items
      ? quote.items.map((item) => ({
          description: item.description,
          details: item.details ?? "",
          quantity: item.quantity,
          unite: item.unite ?? "unité",
          price: item.price / 100,
          taxRate: Number(item.taxRate),
          discount: item.discount ?? 0,
        }))
      : [
          {
            description: "",
            details: "",
            quantity: 1,
            unite: "unité",
            price: 0,
            taxRate: 20,
            discount: 0,
          },
        ],
  };

  const form = useForm<CreateQuoteValues>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");

  // Calcul du total en temps réel (basé sur les valeurs du formulaire en Euros)
  const estimatedTotal = items?.reduce((acc, item) => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.taxRate || 0;
    const discount = item.discount || 0;
    return acc + price * quantity * (1 + tax / 100) * (1 - discount / 100);
  }, 0);

  function onSubmit(data: CreateQuoteValues) {
    startTransition(async () => {
      try {
        if (submitAction === "generate") {
          data.status = "SENT";
        } else {
          if (data.status !== "ACCEPTED") {
            data.status = "DRAFT";
          }
        }

        let result: ActionState;

        if (isEditMode) {
          result = await updateQuote(quote.id, data);
        } else {
          result = await createQuote(data);
        }

        if (result.success) {
          if (submitAction === "generate") {
            toast.success("Devis validée ! PDF prêt.");
            // TODO Phase 6: Ici on redirigera vers la vue PDF ou on ouvrira le fichier
            router.push(`/dashboard/quotes/view/${result.id}`);
          } else {
            toast.success("Brouillon sauvegardé");
            router.push("/dashboard/quotes");
          }
          router.refresh();
        } else {
          toast.error(result.error || "Une erreur est survenue");
        }
      } catch (error) {
        toast.error("Erreur serveur");
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
            Informations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Client */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un client..." />
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

            {/* 2. Numéro de devis */}
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Auto (ex: 26303)"
                      // On désactive souvent l'édition du numéro en mode update pour éviter les trous de séquence
                      disabled={isEditMode && !!field.value}
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
                        // Logique auto update validUntil si nécessaire
                        const currentDueDate = form.getValues("validUntil");
                        if (
                          date &&
                          (!currentDueDate || date > currentDueDate)
                        ) {
                          // Par défaut +30 jours par exemple
                          const newDue = new Date(date);
                          newDue.setDate(newDue.getDate() + 30);
                          form.setValue("validUntil", newDue);
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
              name="validUntil"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Validité</FormLabel>
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

          <div className="space-y-4 md:gap-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-xl h-full flex flex-col justify-between"
              >
                <div className="relative flex flex-col gap-4">
                  {/* Ligne 1 : Nom */}
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Prestation..." />
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
                            Détails
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
                  <div className="grid grid-cols-2 gap-3">
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
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
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
                            TVA (%)
                          </FormLabel>
                          <Select
                            onValueChange={(val) =>
                              field.onChange(parseFloat(val))
                            }
                            value={field.value?.toString()}
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

                  {/* Ligne 6 : Quantité & Unité */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Quantité
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
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
                            <Input {...field} placeholder="Jours, Hrs..." />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ligne 7 : Discount */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.discount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                            Remise (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
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

            {/* Carte d'ajout */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2"
              onClick={() =>
                append({
                  description: "",
                  details: "",
                  quantity: 1,
                  unite: "unité",
                  price: 0,
                  discount: 0,
                  taxRate: 20,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> <span>Ajouter un article</span>
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name={`note`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase text-slate-500">
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notes..."
                  className="h-20 resize-none text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* BOTTOM BAR */}
        <div className="p-4 bg-white border-t dark:bg-slate-950 z-10 md:relative md:bg-transparent md:border-t-0 md:p-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Total TTC
              </span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* BOUTON 1 : Sauvegarder (Brouillon) */}
              <Button
                type="submit"
                variant="outline"
                className="flex-1 sm:flex-none gap-2 border-slate-300"
                onClick={() => setSubmitAction("save")}
                disabled={isPending}
              >
                <Save className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only">
                  {isEditMode ? "Sauver" : "Brouillon"}
                </span>
                <span className="sm:hidden">Sauver</span>
              </Button>

              {/* BOUTON 2 : Valider & PDF */}
              <Button
                type="submit"
                className="flex-1 sm:flex-none gap-2 min-w-[140px]"
                onClick={() => setSubmitAction("generate")}
                disabled={isPending}
              >
                {isEditMode ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isEditMode ? "Générer PDF" : "Créer & PDF"}</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
