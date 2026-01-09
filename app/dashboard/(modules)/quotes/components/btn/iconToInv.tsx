"use client";
import { Button } from "@/components/ui/button";
import { useTransformQuote } from "../../hooks/use-transform-quote";
import { ReceiptEuro } from "lucide-react";

interface IconToInvProps {
  id: string;
}

export function IconToInv({ id }: IconToInvProps) {
  const { transform, isPending } = useTransformQuote();
  return (
    <Button
      size="icon-xl"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        transform(id);
      }}
      disabled={isPending}
      aria-label="Transformer en facture"
    >
      <ReceiptEuro className="size-6" />
    </Button>
  );
}
