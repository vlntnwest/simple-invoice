import { getUserContext } from "@/lib/context/context";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Download,
  Mail,
  Printer,
  MoreVertical,
  ReceiptText,
  UserRound,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReturnArrow from "@/components/returnArrow";
import { STATEVALUES } from "../../config/states";
import { DynamicInvoiceViewer } from "../../components/pdf/dynamic-invoice-viewer";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await getUserContext();

  if (!organization) redirect("/auth/login");

  // 1. Récupération de la facture (Sécurisée par organizationId)
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      organizationId: organization.id,
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) notFound();

  // URL de l'API que nous avons créée juste avant
  // On ajoute un timestamp pour éviter le cache navigateur agressif si on vient de modifier
  const pdfUrl = `/dashboard/invoices/api/pdf/${invoice.id}?t=${Date.now()}`;

  return (
    <div className="flex flex-col h-full md:flex-row overflow-hidden">
      {/* --- ZONE GAUCHE (Main) : PDF Viewer --- */}
      <div className="flex-1 flex flex-col min-w-0 px-4 relative transition-all duration-300 ease-in-out">
        {/* Header de navigation */}
        <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center overflow-hidden space-x-2">
            <ReturnArrow />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="font-bold text-2xl leading-none">
                  Facture {invoice.number}
                </h1>
              </div>
            </div>
          </div>

          {/* Actions Mobile (Menu déroulant pour gagner de la place) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" /> Envoyer par email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/dashboard/invoices/edit/${invoice.id}`}
                    className="flex items-center w-full"
                  >
                    Éditer
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Viewer PDF */}
        <div className="flex-1 overflow-hidden flex items-center justify-center relative">
          <DynamicInvoiceViewer url={pdfUrl} />
        </div>
      </div>

      {/* --- ZONE DROITE (Sidebar) : Actions & Détails --- */}
      <div className="w-full md:w-96 md:h-full md:border-l bg-white dark:bg-slate-900 flex flex-col z-20 overflow-y-auto">
        <div className="py-4 pl-6 pr-6 md:pr-4 space-y-8">
          {/* Bloc Actions Principales */}
          <div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-200 rounded-full">
                <ReceiptText className="w shrink-0 text-black" size={24} />
                <p className="text-base text-black font-regular">Facture</p>
              </div>
              <p className="text-[3rem] font-semibold my-2">
                {formatCurrency(invoice.total / 100)}
              </p>
              <p className="text-base font-semibold">
                {STATEVALUES[invoice.status as keyof typeof STATEVALUES]}
              </p>
              <p className="mt-2">
                le{" "}
                {format(new Date(invoice.date), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <div className="grid gap-3 mt-4 mb-6">
              <div className="flex wrap justify-center items-start gap-4">
                <Button size="icon-xl" variant="outline" asChild>
                  <a href={pdfUrl} target="_blank" download>
                    <Download className="size-6" />
                  </a>
                </Button>
                <Button size="icon-xl" variant="outline">
                  <Mail className="size-6" />
                </Button>
                <Button size="icon-xl" variant="outline">
                  <Printer className="size-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bloc Détails Clés */}
          <div>
            <h3 className="text-base font-semibold tracking-wider mb-4">
              Détails du document
            </h3>

            <Button
              variant="outline"
              size="custom"
              className="w-full justify-start px-4 py-3 rounded-2xl mb-4"
              asChild
            >
              <a href={`/dashboard/customers/${invoice.customer.id}`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center justify-start">
                    <UserRound className="mr-4 size-6" />
                    <p className="text-base font-regular">
                      {invoice.customer.companyName ||
                        invoice.customer.firstName}
                    </p>
                  </div>
                  <ChevronRight className="ml-auto size-6" />
                </div>
              </a>
            </Button>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start py-2 border-b border-slate-50">
                <span className="text-slate-500">Date d'émission</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {format(new Date(invoice.date), "dd MMMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-start py-2 border-b border-slate-50">
                <span className="text-slate-500">Échéance</span>
                <div className="text-right">
                  <span
                    className={`font-medium block ${
                      new Date() > new Date(invoice.dueDate) &&
                      invoice.status !== "PAID"
                        ? "text-red-600"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {format(new Date(invoice.dueDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                  {new Date() > new Date(invoice.dueDate) &&
                    invoice.status !== "PAID" && (
                      <span className="text-[10px] text-red-500 font-bold uppercase">
                        En retard
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Button
              variant="link"
              className="text-slate-400 h-auto p-0 text-xs "
            >
              Supprimer cette facture (Irreversible)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
