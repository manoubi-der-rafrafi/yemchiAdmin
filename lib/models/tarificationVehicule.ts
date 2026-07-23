import mongoose, { Document, Schema, Types } from "mongoose";

export const TYPES_VEHICULE = [
  "DEUX_ROUES_MOTORISES",
  "VEHICULE_PARTICULIER",
  "VEHICULE_UTILITAIRE_LEGER",
  "FOURGON_MINIBUS",
  "GROS_UTILITAIRE",
] as const;

export type TypeVehicule = (typeof TYPES_VEHICULE)[number];

export interface TarificationVehicule extends Document {
  typeVehicule: TypeVehicule;
  dateDebut: Date;
  dateFin?: Date | null;
  prixCommencement: Types.Decimal128;
  prixCommencementLivreur: Types.Decimal128;
  prixCommencementSociete: Types.Decimal128;
  prixParKilometre: Types.Decimal128;
  prixParKilometreLivreur: Types.Decimal128;
  prixParKilometreSociete: Types.Decimal128;
  createdAt: Date;
  createdByAdminId: string;
}

const tarificationVehiculeSchema = new Schema<TarificationVehicule>(
  {
    typeVehicule: { type: String, enum: TYPES_VEHICULE, required: true },
    dateDebut: { type: Date, required: true, index: true },
    dateFin: { type: Date, default: null, index: true },
    prixCommencement: { type: Schema.Types.Decimal128, required: true },
    prixCommencementLivreur: { type: Schema.Types.Decimal128, required: true },
    prixCommencementSociete: { type: Schema.Types.Decimal128, required: true },
    prixParKilometre: { type: Schema.Types.Decimal128, required: true },
    prixParKilometreLivreur: { type: Schema.Types.Decimal128, required: true },
    prixParKilometreSociete: { type: Schema.Types.Decimal128, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    createdByAdminId: { type: String, required: true },
  },
  { collection: "tarification_vehicule", versionKey: false }
);

export default mongoose.models.TarificationVehicule ||
  mongoose.model<TarificationVehicule>(
    "TarificationVehicule",
    tarificationVehiculeSchema,
    "tarification_vehicule"
  );
