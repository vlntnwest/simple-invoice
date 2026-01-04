import { z } from "zod";

export const invoiceStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

// Schema pour une ligne de facture (création/édition)
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  details: z.string().optional(),
  quantity: z.number().min(1).default(1),
  unite: z.string().default("unité"),
  price: z.number().min(0), // En centimes
  discount: z.number().min(0).default(0), // En pourcentage
  taxRate: z.number().min(0).default(20), // En pourcentage
});

// Schema complet pour la création
export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Client requis"),
  date: z.date(),
  dueDate: z.date(),
  status: invoiceStatusSchema.default("DRAFT"),
  items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins une ligne"),
  note: z.string().optional(),
});

export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;
