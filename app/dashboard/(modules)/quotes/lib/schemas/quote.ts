import { z } from "zod";

export const quoteStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

// Schema pour une ligne de devis (création/édition)
export const quoteItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  details: z.string().optional(),
  quantity: z.number().min(1).default(1),
  unite: z.string().default("unité"),
  price: z.number().min(0), // En centimes
  discount: z.number().min(0).default(0), // En pourcentage
  taxRate: z.number().min(0).max(100).default(20), // En pourcentage
});

// Schema complet pour la création
export const createQuoteSchema = z
  .object({
    number: z.string().optional().or(z.literal("")),
    status: quoteStatusSchema.default("DRAFT"),
    date: z.date(),
    validUntil: z.date(),
    customerId: z.string().min(1, "Client requis"),
    note: z.string().optional(),
    items: z.array(quoteItemSchema).min(1, "Ajoutez au moins une ligne"),
  })
  .refine((data) => data.validUntil >= data.date, {
    message:
      "La date d'échéance doit être postérieure à la date de facturation",
    path: ["validUntil"],
  });

export type CreateQuoteValues = z.infer<typeof createQuoteSchema>;
