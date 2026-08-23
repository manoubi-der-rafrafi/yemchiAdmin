export type LigneDetteLivreur = {
  ligneId: string;
  type: "PRODUIT_B2C" | "PART_SOCIETE_COURSE";
  produitId?: string | null;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  montantInitial: number;
  montantPaye: number;
  resteAPayer: number;
  statutFinancier: "NON_PAYEE" | "PARTIELLE" | "SOLDEE";
};

export type CommandeDetteLivreur = {
  commandeId: string;
  externalOrderId?: string | null;
  sourceCommande: string;
  dateLivraison?: string | null;
  montantInitial: number;
  montantPaye: number;
  resteAPayer: number;
  statutFinancier: "NON_PAYEE" | "PARTIELLE" | "SOLDEE";
  lignes: LigneDetteLivreur[];
};

export type AffectationPaiementLivreur = {
  commandeId: string;
  ligneId: string;
  type: string;
  libelle: string;
  montant: number;
};

export type PaiementDetailLivreur = {
  factureId: string;
  montant: number;
  statut: string;
  date?: string | null;
  montantAffecte: number;
  montantNonAffecte: number;
  affectations: AffectationPaiementLivreur[];
};

export type LivreurDebtDetails = {
  livreurId: string;
  produitsB2cAPayer: number;
  coursesAPayer: number;
  detteBrute: number;
  creditEnLigneDisponible: number;
  detteNette: number;
  creditLivreur: number;
  paiementsEnAttente: number;
  commandes: CommandeDetteLivreur[];
  paiements: PaiementDetailLivreur[];
};

export const livreurDebtService = {
  async getDetails(livreurId: string): Promise<LivreurDebtDetails | null> {
    const apiUrl = process.env.AUTH_API_URL || "http://localhost:8081";
    const secret =
      process.env.INTERNAL_PROVISIONING_SECRET ||
      process.env.PARTNER_PROVISIONING_SECRET ||
      "transport-static-secret";
    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/api/internal/finance-livreurs/${encodeURIComponent(livreurId)}/details`,
        { headers: { "X-Internal-Secret": secret }, cache: "no-store" }
      );
      if (!response.ok) {
        console.error("Impossible de charger le registre financier livreur", response.status);
        return null;
      }
      return (await response.json()) as LivreurDebtDetails;
    } catch (error) {
      console.error("API du registre financier indisponible", error);
      return null;
    }
  },
};
