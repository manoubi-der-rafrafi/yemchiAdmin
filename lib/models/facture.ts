import mongoose, { Schema, Document } from "mongoose";

export enum FactureType {
  ENTREPRISE_VERSE_LIVREUR = "ENTREPRISE_VERSE_LIVREUR",
  LIVREUR_VERSE_ENTREPRISE = "LIVREUR_VERSE_ENTREPRISE",
}

export enum FactureStatus {
  NON_TRAITER = "NON_TRAITER",
  ACCEPTER = "ACCEPTER",
  REFUSER = "REFUSER",
}

export interface Facture extends Document {
  montant: number;
  dateTimle: string;
  image?: string | null;
  id_livreur: string;
  type: FactureType;
  confirmer: FactureStatus;
}

const factureSchema = new Schema<Facture>(
  {
    montant: { type: Number, required: true },
    dateTimle: { type: String, required: true },
    image: { type: String, default: null },
    id_livreur: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(FactureType),
      required: true,
    },
    confirmer: {
      type: String,
      enum: Object.values(FactureStatus),
      default: FactureStatus.NON_TRAITER,
      set: (value: string) => (typeof value === "string" ? value.toUpperCase() : value),
    },
  },
  { timestamps: true, collection: "facture" }
);

const existing = mongoose.models.Facture as mongoose.Model<Facture> | undefined;
const existingEnums = (existing as any)?.schema?.path("confirmer")?.enumValues as string[] | undefined;
if (existing && existingEnums && existingEnums.includes("non_traiter")) {
  delete mongoose.models.Facture;
}

export default mongoose.models.Facture ||
  mongoose.model<Facture>("Facture", factureSchema);
