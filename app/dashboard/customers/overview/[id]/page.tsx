import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import ReturnArrow from "@/components/returnArrow";
import { ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { STATEVALUES } from "@/app/dashboard/(modules)/invoices/config/states";
import { getClientInvoices } from "@/app/dashboard/(modules)/invoices/actions/invoice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceList } from "../../components/invoices-list";
import { QuoteList } from "../../components/quotes-list";
import { getClientQuotes } from "@/app/dashboard/(modules)/quotes/actions/quote";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOverviewPage({ params }: PageProps) {
  const { organization } = await getUserContext();
  if (!organization) redirect("/login");

  const { id } = await params;

  // SECURITY: Multi-tenant filter
  // On ne récupère le client QUE s'il appartient à l'org active
  const customer = await prisma.customer.findFirst({
    where: {
      id: id,
      organizationId: organization.id,
    },
  });

  if (!customer) {
    notFound();
  }

  const invoices = await getClientInvoices(id);

  const quotes = await getClientQuotes(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center">
          <ReturnArrow />
          <h1 className="text-2xl font-bold tracking-tight">
            {customer.companyName ||
              `${customer.firstName} ${customer.lastName}`}
          </h1>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/dashboard/customers/edit/${customer.id}`}>
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/dashboard/invoices/new?customerId=${customer.id}`}
                >
                  Nouvelle facture
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <h2 className="px-4 py-2 text-lg font-semibold">Factures</h2>
      <InvoiceList invoices={invoices} />
      <h2 className="px-4 py-2 text-lg font-semibold">Devis</h2>
      <QuoteList quotes={quotes} />
    </div>
  );
}
