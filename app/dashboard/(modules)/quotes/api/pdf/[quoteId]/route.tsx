import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/context/context";
import { QuotePDF } from "@/app/dashboard/(modules)/quotes/components/pdf/quote-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  // 1. Sécurité : On vérifie que l'user est connecté et a une organisation
  const { organization } = await getUserContext();

  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quoteId } = await params;

  // 2. Récupération des données (Scope Multi-tenant)
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      organizationId: organization.id,
    },
    include: {
      items: true,
      customer: true,
      organization: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  // 3. Génération du PDF
  try {
    const stream = await renderToStream(<QuotePDF quote={quote} />);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="devis-${quote.number}.pdf"`,
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
