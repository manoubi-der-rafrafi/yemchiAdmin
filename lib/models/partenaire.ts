import mongoose, { Schema, Document } from "mongoose";

export type PartenaireStatut = "ACTIF" | "INACTIF" | "REVOQUE";

export interface Partenaire extends Document {
  externalBusinessId?: string | null;
  externalOwnerUserId?: string | null;
  businessName: string;
  statut?: PartenaireStatut;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

const partenaireSchema = new Schema<Partenaire>(
  {
    externalBusinessId: { type: String, unique: true, sparse: true },
    externalOwnerUserId: { type: String, default: null },
    businessName: { type: String, required: true },
    statut: {
      type: String,
      enum: ["ACTIF", "INACTIF", "REVOQUE"],
      default: "ACTIF",
    },
  },
  { timestamps: true, collection: "partenaire" }
);

export default mongoose.models.Partenaire ||
  mongoose.model<Partenaire>("Partenaire", partenaireSchema, "partenaire");
