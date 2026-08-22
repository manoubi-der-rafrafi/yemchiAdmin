import mongoose, { Document, Schema, Types } from "mongoose";

export interface RegleBlocageLivreur extends Document {
  montantBlocage: Types.Decimal128;
  pourcentageReglement: Types.Decimal128;
  dateDebut: Date;
  dateFin?: Date | null;
  createdAt: Date;
  createdByAdminId: string;
}

const schema = new Schema<RegleBlocageLivreur>(
  {
    montantBlocage: { type: Schema.Types.Decimal128, required: true },
    pourcentageReglement: { type: Schema.Types.Decimal128, required: true },
    dateDebut: { type: Date, required: true, index: true },
    dateFin: { type: Date, default: null, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    createdByAdminId: { type: String, required: true },
  },
  { collection: "regle_blocage_livreur", versionKey: false }
);

export default mongoose.models.RegleBlocageLivreur ||
  mongoose.model<RegleBlocageLivreur>("RegleBlocageLivreur", schema);
