import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { InvoicePDF } from "@/app/dashboard/(modules)/invoices/components/pdf/invoice-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  // 1. Sécurité : On vérifie que l'user est connecté et a une organisation
  const { organization } = await getUserContext();

  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;

  // 2. Récupération des données (Scope Multi-tenant)
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: organization.id,
    },
    include: {
      items: true,
      customer: true,
      organization: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const serializedInvoice = {
    ...invoice,
    items: invoice.items.map((item) => ({
      ...item,
      taxRate: item.taxRate.toNumber(), // Conversion vitale ici
    })),
  };

  // 3. Génération du PDF
  try {
    const stream = await renderToStream(
      <InvoicePDF invoice={serializedInvoice} />
    );

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
