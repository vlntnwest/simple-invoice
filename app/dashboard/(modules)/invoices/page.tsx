import { getInvoices } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-500",
  SENT: "bg-blue-500",
  PAID: "bg-green-500",
  OVERDUE: "bg-red-500",
  CANCELLED: "bg-slate-300",
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Aucune facture pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                // Logique d'affichage du nom client (Entreprise ou Particulier)
                const clientName =
                  invoice.customer.companyName ||
                  `${invoice.customer.firstName || ""} ${
                    invoice.customer.lastName || ""
                  }`.trim() ||
                  "Client inconnu";

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm truncate max-w-[120px]">
                      {clientName}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs sm:text-sm">
                      {formatCurrency(invoice.total / 100)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
