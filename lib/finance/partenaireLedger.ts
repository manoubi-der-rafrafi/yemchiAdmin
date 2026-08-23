export type PartnerLedgerProductInput = {
  id: string;
  commandeId: string;
  externalProductId?: string | null;
  nom?: string | null;
  quantite?: number | null;
  prix?: number | null;
  prixTotalLigne?: number | null;
};

export type PartnerLedgerOrderInput = {
  id: string;
  externalOrderId?: string | null;
  date?: string | null;
  statut?: string | null;
  modePaiement?: string | null;
  prixProduitsPartenaire?: number | string | null;
  prixLivraison?: number | string | null;
  prix?: number | string | null;
};

export type PartnerLedgerInvoiceInput = {
  id: string;
  montant: number;
  date?: string | null;
  type: "ENTREPRISE_VERSE_PARTENAIRE" | "PARTENAIRE_VERSE_ENTREPRISE";
  confirmer?: string | null;
};

export type PartnerProductSettlementLine = {
  ligneId: string;
  produitId?: string | null;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  montantInitial: number;
  montantPaye: number;
  resteAPayer: number;
  statut: "NON_PAYE" | "PARTIEL" | "PAYE" | "PAYE_DIRECTEMENT";
};

export type PartnerOrderSettlement = {
  commandeId: string;
  externalOrderId?: string | null;
  date?: string | null;
  modePaiement: "EN_LIGNE" | "HORS_LIGNE";
  montantInitial: number;
  montantPaye: number;
  resteAPayer: number;
  statut: "NON_PAYE" | "PARTIEL" | "PAYE" | "PAYE_DIRECTEMENT";
  produits: PartnerProductSettlementLine[];
};

export type PartnerInvoiceAllocation = {
  factureId: string;
  type: PartnerLedgerInvoiceInput["type"];
  montant: number;
  montantAffecte: number;
  montantNonAffecte: number;
  affectations: Array<{
    commandeId: string;
    ligneId: string;
    libelle: string;
    montant: number;
  }>;
};

export type PartnerFinancialLedger = {
  produitsHorsLigneInitial: number;
  produitsHorsLignePayes: number;
  produitsHorsLigneRestants: number;
  produitsPayesDirectementEnLigne: number;
  livraisonsEnLigneInitiales: number;
  livraisonsEnLignePayees: number;
  livraisonsEnLigneRestantes: number;
  soldeNet: number;
  commandesProduits: PartnerOrderSettlement[];
  factures: PartnerInvoiceAllocation[];
};

type MutableProductLine = PartnerProductSettlementLine & { commandeId: string };
type MutableDeliveryLine = {
  commandeId: string;
  ligneId: string;
  libelle: string;
  initial: number;
  paye: number;
};

const amount = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const round = (value: number) => Math.round(Math.max(0, value) * 1000) / 1000;
const roundSigned = (value: number) => Math.round(value * 1000) / 1000;
const isDelivered = (status?: string | null) => /^livr/i.test(status ?? "");
const isOnline = (mode?: string | null) => /^en[\s_]*ligne$/i.test(mode ?? "");

const lineStatus = (
  initial: number,
  paid: number,
  direct = false
): PartnerProductSettlementLine["statut"] => {
  if (direct) return "PAYE_DIRECTEMENT";
  if (paid <= 0.0005) return "NON_PAYE";
  if (paid + 0.0005 >= initial) return "PAYE";
  return "PARTIEL";
};

export function buildPartnerFinancialLedger(
  ordersInput: PartnerLedgerOrderInput[],
  products: PartnerLedgerProductInput[],
  invoicesInput: PartnerLedgerInvoiceInput[]
): PartnerFinancialLedger {
  const orders = ordersInput
    .filter((order) => isDelivered(order.statut))
    .sort((a, b) => `${a.date ?? ""}|${a.id}`.localeCompare(`${b.date ?? ""}|${b.id}`));
  const productsByOrder = new Map<string, PartnerLedgerProductInput[]>();
  for (const product of products) {
    const current = productsByOrder.get(product.commandeId) ?? [];
    current.push(product);
    productsByOrder.set(product.commandeId, current);
  }

  const productLines: MutableProductLine[] = [];
  const deliveryLines: MutableDeliveryLine[] = [];
  const directOrderIds = new Set<string>();

  for (const order of orders) {
    const online = isOnline(order.modePaiement);
    const orderProducts = productsByOrder.get(order.id) ?? [];
    let detailedTotal = 0;
    for (const product of orderProducts) {
      const quantity = product.quantite && product.quantite > 0 ? product.quantite : 1;
      const unitPrice = amount(product.prix);
      const lineTotal = amount(product.prixTotalLigne) || unitPrice * quantity;
      if (lineTotal <= 0) continue;
      productLines.push({
        commandeId: order.id,
        ligneId: `produit:${product.id}`,
        produitId: product.externalProductId || product.id,
        nom: product.nom || "Produit B2C",
        quantite: quantity,
        prixUnitaire: round(unitPrice),
        montantInitial: round(lineTotal),
        montantPaye: online ? round(lineTotal) : 0,
        resteAPayer: online ? 0 : round(lineTotal),
        statut: online ? "PAYE_DIRECTEMENT" : "NON_PAYE",
      });
      detailedTotal += lineTotal;
    }
    const orderProductTotal = amount(order.prixProduitsPartenaire);
    const fallback = orderProductTotal - detailedTotal;
    if (fallback > 0.0005) {
      productLines.push({
        commandeId: order.id,
        ligneId: `reprise:${order.id}`,
        produitId: null,
        nom: "Produits B2C (reprise du total)",
        quantite: 1,
        prixUnitaire: round(fallback),
        montantInitial: round(fallback),
        montantPaye: online ? round(fallback) : 0,
        resteAPayer: online ? 0 : round(fallback),
        statut: online ? "PAYE_DIRECTEMENT" : "NON_PAYE",
      });
    }
    if (online) {
      directOrderIds.add(order.id);
      const delivery = amount(order.prixLivraison ?? order.prix);
      if (delivery > 0) {
        deliveryLines.push({
          commandeId: order.id,
          ligneId: `livraison:${order.id}`,
          libelle: `Livraison commande ${order.externalOrderId || order.id}`,
          initial: round(delivery),
          paye: 0,
        });
      }
    }
  }

  const invoices = invoicesInput
    .filter((invoice) => !invoice.confirmer || invoice.confirmer === "ACCEPTER")
    .sort((a, b) => `${a.date ?? ""}|${a.id}`.localeCompare(`${b.date ?? ""}|${b.id}`));
  const allocations: PartnerInvoiceAllocation[] = [];
  let companyOverpayment = 0;
  let partnerOverpayment = 0;

  for (const invoice of invoices) {
    let remaining = amount(invoice.montant);
    const affectations: PartnerInvoiceAllocation["affectations"] = [];
    if (invoice.type === "ENTREPRISE_VERSE_PARTENAIRE") {
      for (const line of productLines.filter((item) => !directOrderIds.has(item.commandeId))) {
        if (remaining <= 0.0005) break;
        const applied = Math.min(remaining, line.resteAPayer);
        if (applied <= 0) continue;
        line.montantPaye = round(line.montantPaye + applied);
        line.resteAPayer = round(line.montantInitial - line.montantPaye);
        line.statut = lineStatus(line.montantInitial, line.montantPaye);
        remaining = round(remaining - applied);
        affectations.push({
          commandeId: line.commandeId,
          ligneId: line.ligneId,
          libelle: line.nom,
          montant: round(applied),
        });
      }
      companyOverpayment += remaining;
    } else {
      for (const line of deliveryLines) {
        if (remaining <= 0.0005) break;
        const outstanding = round(line.initial - line.paye);
        const applied = Math.min(remaining, outstanding);
        if (applied <= 0) continue;
        line.paye = round(line.paye + applied);
        remaining = round(remaining - applied);
        affectations.push({
          commandeId: line.commandeId,
          ligneId: line.ligneId,
          libelle: line.libelle,
          montant: round(applied),
        });
      }
      partnerOverpayment += remaining;
    }
    allocations.push({
      factureId: invoice.id,
      type: invoice.type,
      montant: round(amount(invoice.montant)),
      montantAffecte: round(amount(invoice.montant) - remaining),
      montantNonAffecte: round(remaining),
      affectations,
    });
  }

  const commandesProduits = orders
    .map((order) => {
      const lines = productLines.filter((line) => line.commandeId === order.id);
      const initial = lines.reduce((sum, line) => sum + line.montantInitial, 0);
      const paid = lines.reduce((sum, line) => sum + line.montantPaye, 0);
      const remaining = lines.reduce((sum, line) => sum + line.resteAPayer, 0);
      const direct = directOrderIds.has(order.id);
      return {
        commandeId: order.id,
        externalOrderId: order.externalOrderId,
        date: order.date,
        modePaiement: direct ? "EN_LIGNE" : "HORS_LIGNE",
        montantInitial: round(initial),
        montantPaye: round(paid),
        resteAPayer: round(remaining),
        statut: lineStatus(initial, paid, direct),
        produits: lines.map(({ commandeId: _, ...line }) => line),
      } satisfies PartnerOrderSettlement;
    })
    .filter((order) => order.montantInitial > 0);

  const offlineOrders = commandesProduits.filter((order) => order.modePaiement === "HORS_LIGNE");
  const onlineOrders = commandesProduits.filter((order) => order.modePaiement === "EN_LIGNE");
  const productInitial = offlineOrders.reduce((sum, order) => sum + order.montantInitial, 0);
  const productPaid = offlineOrders.reduce((sum, order) => sum + order.montantPaye, 0);
  const productRemaining = offlineOrders.reduce((sum, order) => sum + order.resteAPayer, 0);
  const directPaid = onlineOrders.reduce((sum, order) => sum + order.montantInitial, 0);
  const deliveryInitial = deliveryLines.reduce((sum, line) => sum + line.initial, 0);
  const deliveryPaid = deliveryLines.reduce((sum, line) => sum + line.paye, 0);
  const deliveryRemaining = deliveryLines.reduce((sum, line) => sum + line.initial - line.paye, 0);

  return {
    produitsHorsLigneInitial: round(productInitial),
    produitsHorsLignePayes: round(productPaid),
    produitsHorsLigneRestants: round(productRemaining),
    produitsPayesDirectementEnLigne: round(directPaid),
    livraisonsEnLigneInitiales: round(deliveryInitial),
    livraisonsEnLignePayees: round(deliveryPaid),
    livraisonsEnLigneRestantes: round(deliveryRemaining),
    soldeNet: roundSigned(productRemaining - deliveryRemaining - companyOverpayment + partnerOverpayment),
    commandesProduits,
    factures: allocations,
  };
}
