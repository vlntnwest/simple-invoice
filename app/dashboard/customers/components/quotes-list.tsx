import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Quote, Customer } from "@prisma/client";
import { STATEVALUES } from "@/app/dashboard/(modules)/quotes/config/states";

type QuoteListProps = {
  quotes: Array<
    Pick<Quote, "id" | "number" | "status" | "date" | "total"> & {
      customer: Pick<Customer, "companyName" | "firstName" | "lastName">;
    }
  >;
};

export function QuoteList({ quotes }: QuoteListProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-2xl bg-card border-dashed">
        <p>Aucun devis disponible</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col border rounded-2xl bg-card overflow-hidden">
      {quotes.map((quote, index) => {
        const clientName =
          quote.customer.companyName ||
          `${quote.customer.firstName || ""} ${
            quote.customer.lastName || ""
          }`.trim() ||
          "Client inconnu";

        const isDraft = quote.status === "DRAFT";

        return (
          <li key={quote.id}>
            <Link
              href={
                isDraft
                  ? `/dashboard/quotes/edit/${quote.id}`
                  : `/dashboard/quotes/view/${quote.id}`
              }
              className="flex items-center w-full px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between w-full">
                {/* Infos */}
                <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                  <div className="flex gap-2 items-center">
                    <span className="text-base font-medium text-foreground">
                      {quote.number}
                    </span>
                    <span className="text-base text-muted-foreground truncate max-w-[150px] md:max-w-[300px]">
                      {clientName}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium text-primary">
                      {STATEVALUES[quote.status as keyof typeof STATEVALUES]}
                    </span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(quote.date)}</span>
                  </div>
                </div>

                {/* Montant */}
                <div className="ml-4 flex items-center gap-2">
                  <span className="font-semibold text-base">
                    {formatCurrency(quote.total / 100)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>

            {index < quotes.length - 1 && <Separator />}
          </li>
        );
      })}
    </ul>
  );
}
