import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { EditCustomerForm } from "./edit-customer-form";
import ReturnArrow from "@/components/returnArrow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center pt-4">
        <ReturnArrow />
        <h1 className="text-2xl font-bold tracking-tight">Modification</h1>
      </div>

      <EditCustomerForm customer={customer} />
    </div>
  );
}
