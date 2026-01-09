import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import ReturnArrow from "@/components/returnArrow";
import { QuoteForm } from "../../components/quote-form";
import { DeleteBtn } from "../../components/deleteBtn";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: PageProps) {
  const { organization } = await getUserContext();
  if (!organization) redirect("/login");
  const { id } = await params;

  // 1. Récupération de le devis AVEC les items
  // SECURITY: Multi-tenant filter
  const rawQuote = await prisma.quote.findFirst({
    where: {
      id: id,
      organizationId: organization.id,
    },
    include: {
      items: true,
    },
  });

  if (!rawQuote) {
    notFound();
  }

  const quote = {
    ...rawQuote,
    items: rawQuote.items?.map((item) => ({
      ...item,
      taxRate: item.taxRate ? item.taxRate.toNumber() : 0,
    })),
  };

  // 2. Récupération des clients pour le select
  // SECURITY: Multi-tenant filter
  const customers = await prisma.customer.findMany({
    where: { organizationId: organization.id },
    select: { id: true, firstName: true, lastName: true, companyName: true },
  });

  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    name:
      c.companyName ||
      `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
      "Sans nom",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-4 mb-4">
        <div className="flex items-center space-x-2">
          <ReturnArrow />
          <h1 className="text-2xl font-bold tracking-tight">Modification</h1>
        </div>
        <DeleteBtn quoteId={id} />
      </div>
      <div className="max-w-4xl mx-auto">
        <QuoteForm quote={quote} customers={formattedCustomers} />
      </div>
    </div>
  );
}
