import { InvoiceForm } from "../components/invoice-form";
import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";
import ReturnArrow from "@/components/returnArrow";

// 1. Définition du type pour les props de la page

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
    <div className="w-full p-4">
      <div className="flex items-center space-x-2 mb-4">
        <ReturnArrow />
        <h1 className="text-2xl font-bold tracking-tight">Nouvelle facture</h1>
      </div>
      <div className="max-w-4xl mx-auto">
        <InvoiceForm customers={formattedCustomers} />
      </div>
    </div>
  );
}
