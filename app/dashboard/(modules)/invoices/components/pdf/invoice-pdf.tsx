/* eslint-disable jsx-a11y/alt-text */
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice, InvoiceItem, Customer, Organization } from "@prisma/client";

// --- CONSTANTES DE CONFIGURATION ---
const ITEMS_PER_PAGE = 3; // Ajustez ce nombre selon la densité de votre contenu

// --- CONFIGURATION DES POLICES ---
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v1/1.ttf" },
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v1/2.ttf",
      fontWeight: "bold",
    },
  ],
});

// --- STYLES SÉMANTIQUES (VOTRE STYLE EXACT) ---
const styles = StyleSheet.create({
  // Layout Global
  pageLayout: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000",
    lineHeight: 1.4,
  },

  // Section : En-tête (Logo & Émetteur)
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerBrandColumn: {
    flexDirection: "column",
    width: "50%",
  },
  headerIssuerColumn: {
    width: "40%",
    alignItems: "flex-end",
  },
  brandLogoPlaceholder: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  issuerDetailsBlock: {
    marginBottom: 10,
  },
  documentTitle: {
    fontWeight: "bold",
  },

  // Section : Adresses & Meta
  sectionAddresses: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  addressClientColumn: {
    width: "45%",
  },

  // Section : Tableau
  tableContainer: {
    width: "100%",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
    marginBottom: 10,
  },
  tableRowItem: {
    flexDirection: "row",
    paddingVertical: 10,
  },

  // Cellules & Colonnes Tableau
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 10,
  },
  colDescription: { width: "45%" },
  colQuantity: { width: "16,67%", textAlign: "center" },
  colUnit: { width: "16,67%", textAlign: "center" },
  colUnitPrice: { width: "16,67%", textAlign: "center" },
  colDiscount: { width: "16,67%", textAlign: "center" },
  colTax: { width: "16,67%", textAlign: "center" },
  colAmount: { width: "16,67%", textAlign: "right" },

  // Section : Totaux
  sectionSummary: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryBlock: {
    width: "40%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
  },

  // Section : Notes
  sectionNotes: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f7fafc",
  },

  // Section : Pied de page (Legal)
  sectionFooter: {
    position: "absolute",
    bottom: 60,
    left: 40,
    right: 40,
    textAlign: "left",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerLegalText: {
    fontSize: 8,
    marginBottom: 2,
  },

  // Overlay Pagination
  paginationOverlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    width: "50%",
  },
});

type InvoiceData = Invoice & {
  items: InvoiceItem[];
  customer: Customer;
  organization: Organization;
};

interface Props {
  invoice: InvoiceData;
}

export const InvoicePDF = ({ invoice }: Props) => {
  const org = invoice.organization;
  const client = invoice.customer;

  // Helpers de formatage
  const formatPrice = (cents: number) =>
    (cents / 100).toFixed(2).replace(".", ",") + " €";
  const formatDate = (date: Date) =>
    format(new Date(date), "d MMMM yyyy", { locale: fr });

  // --- LOGIQUE MULTI-TVA ---
  const calculateTaxBreakdown = (items: InvoiceItem[]) => {
    const breakdown: Record<string, { base: number; amount: number }> = {};
    items.forEach((item) => {
      const rateKey = item.taxRate.toFixed(1);
      if (!breakdown[rateKey]) breakdown[rateKey] = { base: 0, amount: 0 };

      const itemTotalHT =
        item.price * item.quantity * (1 - item.discount / 100);
      const itemTaxAmount = itemTotalHT * (item.taxRate / 100);

      breakdown[rateKey].base += itemTotalHT;
      breakdown[rateKey].amount += itemTaxAmount;
    });
    return breakdown;
  };

  const taxBreakdown = calculateTaxBreakdown(invoice.items);

  // --- LOGIQUE DE PAGINATION (CHUNKING) ---
  const chunks = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    chunks.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  return (
    <Document language="fr">
      {chunks.map((chunkItems, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;

        // Calcul du sous-total de la page courante (pour le report)
        const pageSubtotal = chunkItems.reduce((acc, item) => {
          return acc + item.price * item.quantity * (1 - item.discount / 100);
        }, 0);

        return (
          <Page key={pageIndex} size="A4" style={styles.pageLayout}>
            {/* --- EN-TÊTE (Identique sur chaque page) --- */}
            <View>
              {/* Bloc Header Principal */}
              <View style={styles.sectionHeader}>
                <View style={styles.headerBrandColumn}>
                  {org.logoLink ? (
                    <Image
                      src={org.logoLink}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "contain",
                        marginBottom: 10,
                      }}
                    />
                  ) : (
                    <Text style={styles.brandLogoPlaceholder}>{org.name}</Text>
                  )}
                </View>

                <View style={styles.headerIssuerColumn}>
                  <View style={styles.issuerDetailsBlock}>
                    {org.logoLink && (
                      <Text style={styles.documentTitle}>{org.name}</Text>
                    )}
                    {org.address && (
                      <Text>
                        {org.address}{" "}
                        {(org.zipCode || org.city) &&
                          ` - ${org.zipCode || ""} ${org.city || ""}`}
                      </Text>
                    )}
                    {org.siret && <Text>n°SIREN / SIRET : {org.siret}</Text>}
                    {org.vatNumber && <Text>n°TVA : {org.vatNumber}</Text>}
                    {org.email && <Text>Email : {org.email}</Text>}
                    {org.phone && <Text>Téléphone : {org.phone}</Text>}
                  </View>
                </View>
              </View>

              {/* Bloc Adresses & Details */}
              <View style={styles.sectionAddresses}>
                <View>
                  <Text>Destinataire :</Text>
                </View>
                <View style={styles.addressClientColumn}>
                  <Text>
                    {client.companyName ||
                      `${client.firstName} ${client.lastName}`}
                  </Text>
                  <Text>{client.address}</Text>
                  <Text>
                    {client.zipCode} {client.city}
                  </Text>
                  <Text>{client.country}</Text>

                  <View style={{ marginTop: 8 }}>
                    {client.vatNumber && (
                      <Text style={{ fontSize: 9 }}>
                        N°TVA: {client.vatNumber}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <Text style={styles.documentTitle}>Facture :</Text>
                  <Text>Date de facture :</Text>
                  <Text>Date d'échéance :</Text>
                </View>
                <View
                  style={{ flexDirection: "column", alignItems: "flex-end" }}
                >
                  <Text>{invoice.number}</Text>
                  <Text>{formatDate(invoice.date)}</Text>
                  <Text>{formatDate(invoice.dueDate)}</Text>
                </View>
              </View>
            </View>

            {/* --- TABLEAU --- */}
            <View style={styles.tableContainer}>
              {/* Header */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableCellHeader, styles.colDescription]}>
                  Description
                </Text>
                <View
                  style={{
                    width: "55%",
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Text style={[styles.tableCellHeader, styles.colQuantity]}>
                    Qté
                  </Text>
                  <Text style={[styles.tableCellHeader, styles.colUnit]}>
                    Unité
                  </Text>
                  <Text style={[styles.tableCellHeader, styles.colUnitPrice]}>
                    Prix
                  </Text>
                  {invoice.items.some((item) => item.discount > 0) && (
                    <Text style={[styles.tableCellHeader, styles.colDiscount]}>
                      Remise
                    </Text>
                  )}
                  <Text style={[styles.tableCellHeader, styles.colTax]}>
                    TVA
                  </Text>
                  <Text style={[styles.tableCellHeader, styles.colAmount]}>
                    Montant
                  </Text>
                </View>
              </View>

              {/* Lignes du chunk courant */}
              {chunkItems.map((item) => (
                <View key={item.id} style={styles.tableRowItem}>
                  <View style={styles.colDescription}>
                    <Text style={styles.tableCell}>{item.description}</Text>
                    {item.details && (
                      <Text
                        style={{ fontSize: 8, color: "#555", marginTop: 2 }}
                      >
                        {item.details}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      width: "55%",
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={[styles.tableCell, styles.colQuantity]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.tableCell, styles.colUnit]}>
                      {item.unite}
                    </Text>
                    <Text style={[styles.tableCell, styles.colUnitPrice]}>
                      {formatPrice(item.price)}
                    </Text>
                    {invoice.items.some((item) => item.discount > 0) && (
                      <Text style={[styles.tableCell, styles.colDiscount]}>
                        {item.discount}%
                      </Text>
                    )}
                    <Text style={[styles.tableCell, styles.colTax]}>
                      {item.taxRate}%
                    </Text>
                    <Text style={[styles.tableCell, styles.colAmount]}>
                      {formatPrice(
                        item.price * item.quantity * (1 - item.discount / 100)
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* --- BAS DE TABLEAU (CONDITIONNEL) --- */}
            <View style={styles.sectionSummary}>
              <View style={styles.summaryBlock}>
                {/* Cas 1: Pas la dernière page -> Affiche "Sous-total page" */}
                {!isLastPage && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontStyle: "italic" }]}
                    >
                      Sous-total de la page (à reporter)
                    </Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(pageSubtotal)}
                    </Text>
                  </View>
                )}

                {/* Cas 2: Dernière page -> Affiche les Totaux finaux */}
                {isLastPage && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Sous-total HT</Text>
                      <Text style={styles.summaryValue}>
                        {formatPrice(invoice.subtotal)}
                      </Text>
                    </View>

                    {/* Ventilation TVA par Taux */}
                    {Object.entries(taxBreakdown).map(([rate, data]) => (
                      <View key={rate} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          TVA {rate}% (sur {formatPrice(data.base)})
                        </Text>
                        <Text style={styles.summaryValue}>
                          {formatPrice(data.amount)}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.summaryRowTotal}>
                      <Text
                        style={[styles.summaryLabel, { fontWeight: "bold" }]}
                      >
                        Montant Total EUR
                      </Text>
                      <Text style={[styles.summaryValue, { fontSize: 12 }]}>
                        {formatPrice(invoice.total)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* --- NOTES (Uniquement dernière page) --- */}
            {isLastPage && invoice.note && (
              <View style={styles.sectionNotes} wrap={false}>
                <Text style={{ fontStyle: "italic", color: "#718096" }}>
                  {invoice.note}
                </Text>
              </View>
            )}

            {/* --- PIED DE PAGE (Avec numérotation explicite) --- */}
            <View style={styles.sectionFooter} fixed>
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "absolute",
                  top: -50,
                  left: 0,
                  right: 0,
                  borderTopWidth: 1,
                  borderTopColor: "#EEE",
                  paddingTop: 10,
                }}
              >
                <View
                  style={[
                    styles.footerLegalText,
                    { display: "flex", flexDirection: "row" },
                  ]}
                >
                  <Text>
                    Banque : {org.bankName} - Titulaire du compte : {org.name}{" "}
                  </Text>
                </View>
                <Text style={styles.footerLegalText}>
                  {org.iban && `IBAN: ${org.iban} - BIC: ${org.bic}`}
                </Text>

                {/* Pagination manuelle car nous utilisons une boucle de <Page> */}
                <Text style={[styles.footerLegalText, { textAlign: "right" }]}>
                  Page {pageIndex + 1} / {chunks.length} de la facture{" "}
                  {invoice.number}
                </Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
