"use client";

import { deleteQuote } from "../actions/quote";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteBtnProps {
  quoteId: string;
}

export function DeleteBtn({ quoteId }: DeleteBtnProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteQuote(quoteId);
    if (result.success) {
      toast.success("Devis supprimé");
      router.push("/dashboard/quotes");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  return (
    <Button
      variant="link"
      onClick={handleDelete}
      aria-label="Supprimer le devis"
    >
      Supprimer le devis
    </Button>
  );
}
