import mongoose, { Schema, Document } from "mongoose";

export enum FactureType {
  ENTREPRISE_VERSE_LIVREUR = "ENTREPRISE_VERSE_LIVREUR",
  LIVREUR_VERSE_ENTREPRISE = "LIVREUR_VERSE_ENTREPRISE",
}

export interface Facture extends Document {
  montant: number;
  dateTimle: string;
  image?: string | null;
  id_livreur: string;
  type: FactureType;
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
  },
  { timestamps: true, collection: "facture" }
);

export default mongoose.models.Facture ||
  mongoose.model<Facture>("Facture", factureSchema);
