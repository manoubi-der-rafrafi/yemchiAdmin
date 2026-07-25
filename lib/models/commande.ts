import mongoose, { Schema, Document, Types } from "mongoose";

export type Zone =
  | "GRAND_TUNIS"
  | "COTIER_NORD"
  | "CENTRE_EST"
  | "SFAX"
  | "SUD_EST"
  | "INTERIEUR";

export type SousZone =
  | "TUNIS_CENTRE"
  | "ARIANA_NORD"
  | "ARIANA_SUD"
  | "LA_MARSA"
  | "BEN_AROUS"
  | "MANOUBA"
  | "BIZERTE"
  | "NABEUL"
  | "SOUSSE"
  | "MONASTIR"
  | "MAHDIA"
  | "SFAX"
  | "GABES"
  | "DJERBA_ZARZIS"
  | "KAIROUAN";

export interface Commande extends Document {
  localisation_depart: string;
  localisationDepart?: string | null;
  destination: string;

  date_debut: string | null;
  date_fin: string | null;
  date_demande: string;
  dateDemande?: string | null;

  statut?: string; // à faire matcher avec ton enum Java (EN_ATTENTE, EN_COURS, etc.)
  prix?: number | null;
  prixLivreur?: number | null;
  prixSociete?: number | null;
  prixProduitsPartenaire?: number | null;
  prixLivraison?: number | null;
  prixTotalClient?: number | null;
  sourceCommande?: "C2C" | "B2C" | null;
  encaisseurInitial?: "PARTENAIRE" | "LIVREUR" | "SOCIETE" | null;
  statutReglement?: "NON_REGLE" | "PARTIELLEMENT_REGLE" | "REGLE" | null;
  statutEncaissementSociete?: "NON_APPLICABLE" | "EN_ATTENTE" | "RECU" | null;
  dateEncaissementSociete?: string | null;
  tarificationVehiculeId?: string | null;
  majorationTarifId?: string | null;
  mode_paiement?: string | null;
  modePaiement?: string | null;
  instructions?: string | null;

  telDepart?: number | string | null;
  telArrivee?: number | string | null;

  clientId?: Types.ObjectId | null;
  transporteurId?: Types.ObjectId | null;
  idAmie?: Types.ObjectId | null;
  partenaireId?: string | null;
  externalBusinessId?: string | null;
  externalOrderId?: string | null;
  nomDepart?: string | null;
  nomArrivee?: string | null;

  latitude_depart?: number | null;
  longitude_depart?: number | null;
  latitude_destination?: number | null;
  longitude_destination?: number | null;

  distance_km?: number | null;
  sous_zone_depart?: SousZone | null;
  sous_zone_arrivee?: SousZone | null;
  zone_principale_depart: Zone;
  zone_principale_arrivee: Zone;
  zonePrincipaleDepart?: Zone | null;
  zonePrincipaleArrivee?: Zone | null;

  qrCodeDepart?: string | null;
  qrCodeDepartScanne?: boolean;
  dateScanDepart?: string | null;
  qrCodeArrivee?: string | null;
  qrCodeReceptionScanne?: boolean;
  dateScanReception?: string | null;

  maj_le?: string;
}

const commandeSchema = new Schema<Commande>(
  {
    localisation_depart: { type: String, required: true },
    localisationDepart: { type: String },
    destination: { type: String, required: true },

    date_debut: { type: String, default: null },
    date_fin: { type: String, default: null },
    date_demande: { type: String, required: true },
    dateDemande: { type: String },

    statut: { type: String },

    prix: { type: Number, default: null },
    prixLivreur: { type: Number, default: null },
    prixSociete: { type: Number, default: null },
    prixProduitsPartenaire: { type: Number, default: null },
    prixLivraison: { type: Number, default: null },
    prixTotalClient: { type: Number, default: null },
    sourceCommande: { type: String, enum: ["C2C", "B2C"], default: null },
    encaisseurInitial: {
      type: String,
      enum: ["PARTENAIRE", "LIVREUR", "SOCIETE"],
      default: null,
    },
    statutReglement: {
      type: String,
      enum: ["NON_REGLE", "PARTIELLEMENT_REGLE", "REGLE"],
      default: null,
    },
    statutEncaissementSociete: {
      type: String,
      enum: ["NON_APPLICABLE", "EN_ATTENTE", "RECU"],
      default: null,
    },
    dateEncaissementSociete: { type: String, default: null },
    tarificationVehiculeId: { type: String, default: null },
    majorationTarifId: { type: String, default: null },
    mode_paiement: { type: String, default: null },
    modePaiement: { type: String, default: null },
    instructions: { type: String, default: null },

    telDepart: { type: Schema.Types.Mixed, default: null },
    telArrivee: { type: Schema.Types.Mixed, default: null },

    clientId: { type: Schema.Types.ObjectId, ref: "Utilisateur", default: null },
    transporteurId: {
      type: Schema.Types.ObjectId,
      ref: "Utilisateur",
      default: null,
    },
    idAmie: { type: Schema.Types.ObjectId, ref: "Ami", default: null },
    partenaireId: { type: String, default: null },
    externalBusinessId: { type: String, default: null },
    externalOrderId: { type: String, default: null },
    nomDepart: { type: String, default: null },
    nomArrivee: { type: String, default: null },

    latitude_depart: { type: Number, default: null },
    longitude_depart: { type: Number, default: null },
    latitude_destination: { type: Number, default: null },
    longitude_destination: { type: Number, default: null },

    distance_km: { type: Number, default: null },

    sous_zone_depart: {
      type: String,
      enum: [
        "TUNIS_CENTRE",
        "ARIANA_NORD",
        "ARIANA_SUD",
        "LA_MARSA",
        "BEN_AROUS",
        "MANOUBA",
        "BIZERTE",
        "NABEUL",
        "SOUSSE",
        "MONASTIR",
        "MAHDIA",
        "SFAX",
        "GABES",
        "DJERBA_ZARZIS",
        "KAIROUAN",
      ],
      default: null,
    },
    sous_zone_arrivee: {
      type: String,
      enum: [
        "TUNIS_CENTRE",
        "ARIANA_NORD",
        "ARIANA_SUD",
        "LA_MARSA",
        "BEN_AROUS",
        "MANOUBA",
        "BIZERTE",
        "NABEUL",
        "SOUSSE",
        "MONASTIR",
        "MAHDIA",
        "SFAX",
        "GABES",
        "DJERBA_ZARZIS",
        "KAIROUAN",
      ],
      default: null,
    },

    zone_principale_depart: {
      type: String,
      enum: ["GRAND_TUNIS", "COTIER_NORD", "CENTRE_EST", "SFAX", "SUD_EST", "INTERIEUR"],
      required: true,
    },
    zonePrincipaleDepart: { type: String, default: null },
    zone_principale_arrivee: {
      type: String,
      enum: ["GRAND_TUNIS", "COTIER_NORD", "CENTRE_EST", "SFAX", "SUD_EST", "INTERIEUR"],
      required: true,
    },
    zonePrincipaleArrivee: { type: String, default: null },

    qrCodeDepart: { type: String, default: null },
    qrCodeDepartScanne: { type: Boolean, default: false },
    dateScanDepart: { type: String, default: null },

    qrCodeArrivee: { type: String, default: null },
    qrCodeReceptionScanne: { type: Boolean, default: false },
    dateScanReception: { type: String, default: null },

    maj_le: { type: String },
  },
  { timestamps: true, collection: "commande" }
);

export default mongoose.models.Commande ||
  mongoose.model<Commande>("Commande", commandeSchema);
