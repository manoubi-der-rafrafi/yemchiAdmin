import mongoose, { Document, Schema } from "mongoose";

export enum FacturePartenaireType {
  ENTREPRISE_VERSE_PARTENAIRE = "ENTREPRISE_VERSE_PARTENAIRE",
  PARTENAIRE_VERSE_ENTREPRISE = "PARTENAIRE_VERSE_ENTREPRISE",
}

export enum FacturePartenaireStatus {
  NON_TRAITER = "NON_TRAITER",
  ACCEPTER = "ACCEPTER",
  REFUSER = "REFUSER",
}

export interface FacturePartenaire extends Document {
  partenaireId: string;
  externalBusinessId?: string | null;
  montant: number;
  dateTimle: string;
  image?: string | null;
  type: FacturePartenaireType;
  confirmer: FacturePartenaireStatus;
}

const facturePartenaireSchema = new Schema<FacturePartenaire>(
  {
    partenaireId: { type: String, required: true, index: true },
    externalBusinessId: { type: String, default: null, index: true },
    montant: { type: Number, required: true, min: 0 },
    dateTimle: { type: String, required: true },
    image: { type: String, default: null },
    type: {
      type: String,
      enum: Object.values(FacturePartenaireType),
      required: true,
    },
    confirmer: {
      type: String,
      enum: Object.values(FacturePartenaireStatus),
      default: FacturePartenaireStatus.ACCEPTER,
    },
  },
  { timestamps: true, collection: "facture_partenaire" }
);

export default mongoose.models.FacturePartenaire ||
  mongoose.model<FacturePartenaire>("FacturePartenaire", facturePartenaireSchema);
