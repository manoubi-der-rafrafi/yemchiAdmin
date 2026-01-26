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
  destination: string;

  date_debut: string | null;
  date_fin: string | null;
  date_demande: string;

  statut?: string; // à faire matcher avec ton enum Java (EN_ATTENTE, EN_COURS, etc.)
  prix?: number | null;
  mode_paiement?: string | null;
  modePaiement?: string | null;
  instructions?: string | null;

  telDepart?: number | null;
  telArrivee?: number | null;

  clientId?: Types.ObjectId | null;
  transporteurId?: Types.ObjectId | null;
  idAmie?: Types.ObjectId | null;

  latitude_depart?: number | null;
  longitude_depart?: number | null;
  latitude_destination?: number | null;
  longitude_destination?: number | null;

  distance_km?: number | null;
  sous_zone_depart?: SousZone | null;
  sous_zone_arrivee?: SousZone | null;
  zone_principale_depart: Zone;
  zone_principale_arrivee: Zone;

  qrCodeDepartScanne?: boolean;
  dateScanDepart?: string | null;
  qrCodeReceptionScanne?: boolean;
  dateScanReception?: string | null;

  maj_le?: string;
}

const commandeSchema = new Schema<Commande>(
  {
    localisation_depart: { type: String, required: true },
    destination: { type: String, required: true },

    date_debut: { type: String, default: null },
    date_fin: { type: String, default: null },
    date_demande: { type: String, required: true },

    statut: { type: String },

    prix: { type: Number, default: null },
    mode_paiement: { type: String, default: null },
    modePaiement: { type: String, default: null },
    instructions: { type: String, default: null },

    telDepart: { type: Number, default: null },
    telArrivee: { type: Number, default: null },

    clientId: { type: Schema.Types.ObjectId, ref: "Utilisateur", default: null },
    transporteurId: {
      type: Schema.Types.ObjectId,
      ref: "Utilisateur",
      default: null,
    },
    idAmie: { type: Schema.Types.ObjectId, ref: "Ami", default: null },

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
    zone_principale_arrivee: {
      type: String,
      enum: ["GRAND_TUNIS", "COTIER_NORD", "CENTRE_EST", "SFAX", "SUD_EST", "INTERIEUR"],
      required: true,
    },

    qrCodeDepartScanne: { type: Boolean, default: false },
    dateScanDepart: { type: String, default: null },

    qrCodeReceptionScanne: { type: Boolean, default: false },
    dateScanReception: { type: String, default: null },

    maj_le: { type: String },
  },
  { timestamps: true, collection: "commande" }
);

export default mongoose.models.Commande ||
  mongoose.model<Commande>("Commande", commandeSchema);
