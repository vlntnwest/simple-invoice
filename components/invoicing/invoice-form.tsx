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
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";

type Props = {
  customers: { id: string; name: string }[];
};

export function InvoiceForm({ customers }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateInvoiceValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      date: new Date(),
      dueDate: new Date(), // Idéalement J+30
      status: "DRAFT",
      items: [{ description: "", quantity: 1, price: 0, taxRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calcul du total en temps réel pour l'affichage (UX)
  const items = form.watch("items");
  const estimatedTotal = items.reduce((acc, item) => {
    return (
      acc +
      (item.price || 0) * (item.quantity || 0) * (1 + (item.taxRate || 0) / 100)
    );
  }, 0);

  function onSubmit(data: CreateInvoiceValues) {
    startTransition(async () => {
      try {
        await createInvoice(data);
        toast.success("Facture créée avec succès");
      } catch (error) {
        toast.error("Erreur lors de la création");
        console.error(error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        {/* En-tête : Client et Dates */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
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
          {/* Ajoute ici les DatePicker pour date et dueDate si tu as le composant, sinon Inputs type="date" simplifiés */}
        </div>

        {/* Lignes de facture */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Articles</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unite: "",
                  price: 0,
                  discount: 0,
                  taxRate: 20,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="col-span-12 sm:col-span-5">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Prestation..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Qté</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Prix (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 flex justify-end pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux & Action */}
        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Estimé TTC</span>
            <span>{formatCurrency(estimatedTotal)}</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Création..." : "Créer la facture"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
