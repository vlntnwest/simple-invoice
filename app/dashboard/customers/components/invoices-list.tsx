import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice, Customer } from "@prisma/client";
import { STATEVALUES } from "@/app/dashboard/(modules)/invoices/config/states";

// On définit un type léger pour ce dont la liste a besoin
type InvoiceListProps = {
  invoices: Array<
    Pick<Invoice, "id" | "number" | "status" | "date" | "total"> & {
      customer: Pick<Customer, "companyName" | "firstName" | "lastName">;
    }
  >;
};

export function InvoiceList({ invoices }: InvoiceListProps) {
  console.log("invoices", invoices);
  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-2xl bg-card border-dashed">
        <p>Aucune facture disponible</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col border rounded-2xl bg-card overflow-hidden">
      {invoices.map((invoice, index) => {
        const clientName =
          invoice.customer.companyName ||
          `${invoice.customer.firstName || ""} ${
            invoice.customer.lastName || ""
          }`.trim() ||
          "Client inconnu";

        const isDraft = invoice.status === "DRAFT";

        return (
          <li key={invoice.id}>
            <Link
              href={
                isDraft
                  ? `/dashboard/invoices/edit/${invoice.id}`
                  : `/dashboard/invoices/view/${invoice.id}`
              }
              className="flex items-center w-full px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between w-full">
                {/* Colonne Gauche : Infos */}
                <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                  <div className="flex gap-2 items-center">
                    <span className="text-base font-medium text-foreground">
                      {invoice.number}
                    </span>
                    <span className="text-base text-muted-foreground truncate max-w-[150px] md:max-w-[300px]">
                      {clientName}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium text-primary">
                      {STATEVALUES[invoice.status as keyof typeof STATEVALUES]}
                    </span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(invoice.date)}</span>
                  </div>
                </div>

                {/* Colonne Droite : Montant & Action */}
                <div className="ml-4 flex items-center gap-2">
                  <span className="font-semibold text-base">
                    {formatCurrency(invoice.total / 100)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>

            {index < invoices.length - 1 && <Separator />}
          </li>
        );
      })}
    </ul>
  );
}
