// --- LISTENERS ---

const generatePdfListener = async (quoteId: string) => {
  console.log(`[PDF GENERATION] Demande reçue pour le devis ${quoteId}`);
  console.log(`[PDF GENERATION] Génération en cours...`);
  // await generatePdf(quoteId);
};

// --- DISPATCHER ---

export const quoteEvents = {
  onValidate: async (quoteId: string) => {
    console.log(`EVENT: quote.validated déclenché pour l'ID: ${quoteId}`);

    const results = await Promise.allSettled([generatePdfListener(quoteId)]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Erreur sur le listener ${index}:`, result.reason);
      }
    });
  },
};
