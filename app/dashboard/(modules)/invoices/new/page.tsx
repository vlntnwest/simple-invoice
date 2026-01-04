import { InvoiceForm } from "@/components/invoicing/invoice-form";
import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";

export default async function NewInvoicePage() {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return <div>Erreur: Organisation requise</div>;

  // Récupérer la liste des clients pour le select
  const customers = await prisma.customer.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyName: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Formatter les noms pour l'affichage
  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    name:
      c.companyName ||
      `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
      "Sans nom",
  }));

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Facture</h1>
      <InvoiceForm customers={formattedCustomers} />
    </div>
  );
}
