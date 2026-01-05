/* eslint-disable jsx-a11y/alt-text */
import React from "react";
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

// Enregistrement de la police Helvetica (Standard PDF)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v1/1.ttf" }, // Regular
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v1/2.ttf",
      fontWeight: "bold",
    }, // Bold
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000",
    lineHeight: 1.4,
  },
  // --- HEADER ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: "column",
    width: "50%",
  },
  logoPlaceholder: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  headerRight: {
    width: "40%",
    alignItems: "flex-start", // Le modèle aligne le texte à gauche dans le bloc de droite
  },
  titleBlock: {
    marginBottom: 10,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  // --- ADRESSES ---
  addressBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 40,
  },
  senderBlock: {
    width: "45%",
  },
  recipientBlock: {
    width: "45%",
    marginTop: 20, // Léger décalage vers le bas comme sur le modèle
  },
  recipientLabel: {
    fontSize: 10,
    marginBottom: 5,
  },
  recipientName: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // --- TABLEAU ---
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  // Colonnes
  colDesc: { width: "55%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },

  // Font styles pour le tableau
  th: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 10,
  },

  // --- TOTAUX ---
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsBox: {
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
  },

  // --- FOOTER ---
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#444",
    marginBottom: 2,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- EN-TÊTE --- */}
        <View style={styles.header}>
          {/* Bloc Gauche : Logo & Nom Organisation */}
          <View style={styles.headerLeft}>
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
              // Fallback textuel style "Péché d'Alsace"
              <Text style={styles.logoPlaceholder}>{org.name}</Text>
            )}
            <Text
              style={{
                fontSize: 10,
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              ÉPICERIE FINE
            </Text>
          </View>

          {/* Bloc Droite : Infos Facture */}
          <View style={styles.headerRight}>
            <View style={styles.titleBlock}>
              <Text style={styles.invoiceTitle}>
                Facture : {invoice.number}
              </Text>
            </View>
            <Text>Date de facture : {formatDate(invoice.date)}</Text>
            <Text>Date d'échéance : {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* --- ADRESSES --- */}
        <View style={styles.addressBlock}>
          {/* Expéditeur */}
          <View style={styles.senderBlock}>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>
              {org.name}
            </Text>
            <Text>{org.address}</Text>
            <Text>
              {org.zipCode} {org.city}
            </Text>
            {org.country !== "France" && <Text>{org.country}</Text>}
          </View>

          {/* Destinataire */}
          <View style={styles.recipientBlock}>
            <Text style={{ marginBottom: 4 }}>
              {org.city}, le {formatDate(invoice.date)}
            </Text>
            <Text style={styles.recipientLabel}>Facture pour :</Text>
            <Text style={styles.recipientName}>
              {client.companyName || `${client.firstName} ${client.lastName}`}
            </Text>
            <Text>{client.address}</Text>
            <Text>
              {client.zipCode} {client.city}
            </Text>

            <View style={{ marginTop: 8 }}>
              {/* Affichage conditionnel SIRET/TVA Client */}
              {client.vatNumber && (
                <Text style={{ fontSize: 9 }}>N°TVA: {client.vatNumber}</Text>
              )}
            </View>
          </View>
        </View>

        {/* --- INFOS LÉGALES INTERMÉDIAIRES (Optionnel, comme sur ton PDF au milieu) --- */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 9 }}>SIRET: {org.siret}</Text>
          <Text style={{ fontSize: 9 }}>N°TVA: {org.vatNumber}</Text>
        </View>

        {/* --- TABLEAU --- */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.th, styles.colTotal]}>Montant HT</Text>
          </View>

          {/* Lignes */}
          {invoice.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.td}>{item.description}</Text>
                {item.details && (
                  <Text style={{ fontSize: 8, color: "#555", marginTop: 2 }}>
                    {item.details}
                  </Text>
                )}
              </View>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>
                {formatPrice(item.price)}
              </Text>
              <Text style={[styles.td, styles.colTotal]}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* --- TOTAUX --- */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(invoice.subtotal)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              {/* On assume un taux moyen ou on affiche "TVA" générique si plusieurs taux */}
              <Text style={styles.totalLabel}>
                TVA ({((invoice.tax / invoice.subtotal) * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalValue}>{formatPrice(invoice.tax)}</Text>
            </View>

            <View style={styles.totalRowFinal}>
              <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                Total T.T.C
              </Text>
              <Text style={[styles.totalValue, { fontSize: 12 }]}>
                {formatPrice(invoice.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* --- PIED DE PAGE --- */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { textTransform: "uppercase", fontWeight: "bold" },
            ]}
          >
            {org.name} {org.address} - {org.zipCode} {org.city}
          </Text>
          <Text style={styles.footerText}>
            n° SIRET {org.siret} {org.vatNumber && `- TVA ${org.vatNumber}`}
          </Text>
          <Text style={styles.footerText}>
            E-mail {org.email || "..."} - Téléphone {org.phone || "..."}
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            {/* Mention légale banque si présente */}
            {org.iban && `IBAN: ${org.iban} - BIC: ${org.bic}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
