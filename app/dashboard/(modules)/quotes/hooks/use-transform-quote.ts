"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transformQuoteToInvoice } from "../actions/quote"; // Ton Server Action

export function useTransformQuote() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const transform = (quoteId: string) => {
    startTransition(async () => {
      try {
        const result = await transformQuoteToInvoice(quoteId);

        if (result.success && result.invoiceId) {
          toast.success("Facture créée avec succès !");
          router.push(`/dashboard/invoices/edit/${result.invoiceId}`);
        } else {
          toast.error(result.error || "Impossible de créer la facture");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur de communication avec le serveur");
      }
    });
  };

  return {
    transform,
    isPending,
  };
}
