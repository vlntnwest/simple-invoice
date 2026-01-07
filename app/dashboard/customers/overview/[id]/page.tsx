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
      <ul className="flex flex-col border rounded-2xl bg-card overflow-hidden">
        {invoices && invoices.length > 0 ? (
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
                        : `/dashboard/invoices/view/${invoice.id}`
                    }
                    className="flex items-center w-full px-4 py-3 cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                        <div className="flex gap-1">
                          <p className="text-base font-regular">
                            {invoice.number}
                          </p>
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
        ) : (
          <p className="text-center py-10 text-muted-foreground">
            Aucune facture disponible
          </p>
        )}
      </ul>
    </div>
  );
}
