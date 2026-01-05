import { getUserContext } from "@/lib/context/context";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Mail,
  Printer,
  CreditCard,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceViewer } from "../../components/pdf/invoice-viewer";
import ReturnArrow from "@/components/returnArrow";

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
    <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row overflow-hidden">
      {/* --- ZONE GAUCHE (Main) : PDF Viewer --- */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300 ease-in-out">
        {/* Header de navigation */}
        <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4 overflow-hidden">
            <ReturnArrow />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="font-bold text-lg leading-none tracking-tight">
                  {invoice.number}
                </h1>
                <Badge
                  className={`rounded-md border-0 px-2 py-0.5 text-xs font-medium `}
                >
                  {invoice.status}
                </Badge>
              </div>
              <span className="text-xs text-slate-500 truncate mt-1">
                {invoice.customer.companyName ||
                  `${invoice.customer.firstName} ${invoice.customer.lastName}`}
              </span>
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
          <InvoiceViewer url={pdfUrl} />
        </div>
      </div>

      {/* --- ZONE DROITE (Sidebar) : Actions & Détails --- */}
      <div className="w-full md:w-96 border-l bg-white dark:bg-slate-900 flex flex-col h-[40vh] md:h-full z-20 shadow-xl overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Bloc Actions Principales */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              Actions rapides
            </h2>
            <div className="grid gap-3">
              <Button
                className="w-full justify-start shadow-sm"
                variant="default"
              >
                <Mail className="w-4 h-4 mr-2" />
                Envoyer la facture
              </Button>

              <div className="grid grid-cols-2 gap-3">
                {/* Le bouton Télécharger ouvre le PDF dans un nouvel onglet pour dl natif */}
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <a href={pdfUrl} target="_blank" download>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              </div>

              {invoice.status !== "PAID" && (
                <Button
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Enregistrer un paiement
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Bloc Détails Clés */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-4 tracking-wider">
              Détails du document
            </h3>

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
                  {/* Petit indicateur de retard si nécessaire */}
                  {new Date() > new Date(invoice.dueDate) &&
                    invoice.status !== "PAID" && (
                      <span className="text-[10px] text-red-500 font-bold uppercase">
                        En retard
                      </span>
                    )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Total HT</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>TVA</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <Separator className="bg-slate-200 dark:bg-slate-600" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Net à payer
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="link"
              className="text-slate-400 h-auto p-0 text-xs hover:text-red-500 transition-colors"
            >
              Supprimer cette facture (Irreversible)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
