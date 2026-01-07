import prisma from "@/lib/prisma";

// --- LISTENERS ---

const generatePdfListener = async (invoiceId: string) => {
  console.log(`[PDF GENERATION] Demande reçue pour la facture ${invoiceId}`);
  console.log(`[PDF GENERATION] Génération en cours...`);
  // await generatePdf(invoiceId);
};

// --- DISPATCHER ---

export const invoiceEvents = {
  onValidate: async (invoiceId: string) => {
    console.log(`EVENT: invoice.validated déclenché pour l'ID: ${invoiceId}`);

    const results = await Promise.allSettled([generatePdfListener(invoiceId)]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Erreur sur le listener ${index}:`, result.reason);
      }
    });
  },
};
