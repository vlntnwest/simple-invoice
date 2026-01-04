"use client";

import { useState } from "react";
import { Check, Copy, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DetailRowProps {
  icon: LucideIcon;
  value: string | null | undefined;
  label?: string;
  fallback?: string;
  copyValue?: string;
  isMultiLine?: boolean;
}

export function DetailRow({
  icon: Icon,
  value,
  label,
  fallback = "-",
  copyValue,
  isMultiLine = false,
}: DetailRowProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const displayValue = value || fallback;
  const textToCopy = copyValue || value || "";
  const isClickable = !!value;

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      toast.success("Copié dans le presse-papier");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!isClickable}
      className={cn(
        "flex w-full items-center py-3 px-4 gap-4 text-left transition-colors group rounded-xl",
        isClickable
          ? "hover:bg-muted/50 cursor-pointer active:bg-muted"
          : "cursor-default opacity-80"
      )}
      type="button"
    >
      <div className="h-10 w-10 flex items-center justify-center shrink-0">
        {hasCopied ? (
          <Check className="h-6 w-6 text-black animate-in zoom-in" />
        ) : (
          <Icon className="h-8 w-8 text-foreground/80 group-hover:text-foreground transition-colors" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium",
            isMultiLine && "leading-snug whitespace-pre-line"
          )}
        >
          {displayValue}
        </div>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>

      {isClickable && !hasCopied && (
        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
