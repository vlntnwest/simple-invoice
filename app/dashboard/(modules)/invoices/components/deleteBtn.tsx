"use client";

import { deleteInvoice } from "../actions/invoice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteBtnProps {
  invoiceId: string;
}

export function DeleteBtn({ invoiceId }: DeleteBtnProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteInvoice(invoiceId);
    if (result.success) {
      toast.success("Facture supprimée");
      router.push("/dashboard/invoices");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  return (
    <Button
      variant="link"
      onClick={handleDelete}
      aria-label="Supprimer la facture"
    >
      Supprimer la facture
    </Button>
  );
}
