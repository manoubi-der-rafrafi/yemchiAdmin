import mongoose, { Document, Schema, Types } from "mongoose";

export interface MajorationTarif extends Document {
  pourcentageAjout: Types.Decimal128;
  dateDebut: Date;
  dateFin: Date;
  descriptionCause: string;
  createdAt: Date;
  createdByAdminId: string;
}

const majorationTarifSchema = new Schema<MajorationTarif>(
  {
    pourcentageAjout: { type: Schema.Types.Decimal128, required: true },
    dateDebut: { type: Date, required: true, index: true },
    dateFin: { type: Date, required: true, index: true },
    descriptionCause: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
    createdByAdminId: { type: String, required: true },
  },
  { collection: "majoration_tarif", versionKey: false }
);

export default mongoose.models.MajorationTarif ||
  mongoose.model<MajorationTarif>(
    "MajorationTarif",
    majorationTarifSchema,
    "majoration_tarif"
  );
