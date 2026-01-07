import { QuoteForm } from "../components/quote-form";
import prisma from "@/lib/prisma";
import { requireUserOrganization } from "@/lib/context/organization";
import ReturnArrow from "@/components/returnArrow";

// 1. Définition du type pour les props de la pa

export default async function NewQuotePage() {
  const organizationId = await requireUserOrganization();
  if (!organizationId) return <div>Erreur: Organisation requise</div>;

  // Récupérer la liste des clients pour le select
  // SECURITY: Multi-tenant filter
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
        <h1 className="text-2xl font-bold tracking-tight">Nouveau devis</h1>
      </div>
      <div className="max-w-4xl mx-auto">
        {/* 3. On passe l'ID en prop au formulaire */}
        <QuoteForm customers={formattedCustomers} />
      </div>
    </div>
  );
}
