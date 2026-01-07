import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { CustomerList } from "./components/customer-list";
import { CustomerForm } from "./components/customer-form";

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
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <CustomerForm />
      </div>

      <CustomerList customers={customers} />
    </div>
  );
}
