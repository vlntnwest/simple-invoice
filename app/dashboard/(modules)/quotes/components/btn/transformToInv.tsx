"use client";
import { Button } from "@/components/ui/button";
import { useTransformQuote } from "../../hooks/use-transform-quote";

interface TransformToInvProps {
  id: string;
}

export function TransformToInv({ id }: TransformToInvProps) {
  const { transform, isPending } = useTransformQuote();
  return (
    <Button
      variant="hided"
      className="p-0 font-normal h-auto"
      onClick={(e) => {
        e.preventDefault();
        transform(id);
      }}
      disabled={isPending}
    >
      Transformer en facture
    </Button>
  );
}
