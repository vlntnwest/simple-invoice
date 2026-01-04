import { getInvoices } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const STATEVALUES = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  PAID: "Payé",
  CANCELED: "Annulé",
};

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Factures</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/invoices/new">
            <Plus className="mr-2 h-4 w-4" /> Créer
          </Link>
        </Button>
      </div>

      <ul className="flex flex-col border rounded-2xl bg-card overflow-hidden">
        {invoices.map((invoice, index) => {
          const clientName =
            invoice.customer.companyName ||
            `${invoice.customer.firstName || ""} ${
              invoice.customer.lastName || ""
            }`.trim() ||
            "Client inconnu";

          return (
            <li key={invoice.id}>
              <Link
                href={
                  invoice.status === "DRAFT"
                    ? `/dashboard/invoices/edit/${invoice.id}`
                    : `/dashboard/invoices/${invoice.id}`
                }
                className="flex items-center w-full px-4 py-3 cursor-pointer"
              >
                <div className="flex justify-between w-full">
                  <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                    <div className="flex gap-1">
                      <p className="text-base font-regular">{invoice.number}</p>
                      <p className="text-base font-regular truncate">
                        {clientName}
                      </p>
                    </div>
                    <div className="flex items-center max-w-full">
                      <span className="inline-flex items-center">
                        <span className="text-base font-semibold after:content-['·'] after:mx-1">
                          {
                            STATEVALUES[
                              invoice.status as keyof typeof STATEVALUES
                            ]
                          }
                        </span>
                        <p>{formatDate(invoice.date)}</p>
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col">
                    <div className="flex items-center">
                      <p className="font-semibold">
                        {formatCurrency(invoice.total / 100)}
                      </p>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>

              {index < invoices.length - 1 && (
                <div className="px-4">
                  <Separator />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
