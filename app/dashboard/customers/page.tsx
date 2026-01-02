import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { CustomerList } from "./customer-list";
import { CustomerForm } from "./customer-form";

export default async function CustomersPage() {
  const { organization } = await getUserContext();

  // SECURITY: Multi-tenant filter
  const customers = await prisma.customer.findMany({
    where: {
      organizationId: organization?.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <CustomerForm />
      </div>

      <CustomerList customers={customers} />
    </div>
  );
}
