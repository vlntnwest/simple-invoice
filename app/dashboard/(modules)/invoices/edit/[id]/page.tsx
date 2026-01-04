import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import ReturnArrow from "@/components/returnArrow";
import { InvoiceForm } from "../../components/invoice-form";
import { DeleteBtn } from "../../components/deleteBtn";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { organization } = await getUserContext();
  if (!organization) redirect("/login");
  const { id } = await params;

  // 1. Récupération de la facture AVEC les items
  // SECURITY: Multi-tenant filter
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: id,
      organizationId: organization.id,
    },
    include: {
      items: true, // CRITIQUE: Nécessaire pour pré-remplir le formulaire
    },
  });

  if (!invoice) {
    notFound();
  }

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
        <DeleteBtn invoiceId={id} />
      </div>
      {/* On passe la facture et les clients au formulaire */}
      <InvoiceForm invoice={invoice} customers={formattedCustomers} />
    </div>
  );
}
