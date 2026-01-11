import mongoose, { Schema, Document } from "mongoose";

export enum TypeVehicule {
  DEUX_ROUES_MOTORISES = "DEUX_ROUES_MOTORISES",
  VEHICULE_PARTICULIER = "VEHICULE_PARTICULIER",
  VEHICULE_UTILITAIRE_LEGER = "VEHICULE_UTILITAIRE_LEGER",
  FOURGON_MINIBUS = "FOURGON_MINIBUS",
  GROS_UTILITAIRE = "GROS_UTILITAIRE",
}

export enum ReponseDemande {
  ACCEPTER = "accepter",
  REFUSER = "refuser",
  NON_TRAITER = "non traiter",
}

export interface Demande extends Document {
  nom: string;
  prenom: string;
  numero: string;
  typeVehicule: TypeVehicule;

  imageCarteIdentiteFace: string;
  imageCarteIdentiteArriere: string;
  imagePermis: string;
  imageCarteGrise: string;
  imageAssurance: string;

  dateDemande?: string;
  dateReponse?: string | null;
  reponse?: ReponseDemande;
}

const demandeSchema = new Schema<Demande>(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    numero: { type: String, required: true },

    typeVehicule: {
      type: String,
      enum: Object.values(TypeVehicule),
      required: true,
    },

    imageCarteIdentiteFace: { type: String, required: true },
    imageCarteIdentiteArriere: { type: String, required: true },
    imagePermis: { type: String, required: true },
    imageCarteGrise: { type: String, required: true },
    imageAssurance: { type: String, required: true },

    dateDemande: { type: String },
    dateReponse: { type: String, default: null },
    reponse: {
      type: String,
      enum: Object.values(ReponseDemande),
      default: ReponseDemande.NON_TRAITER,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Demande ||
  mongoose.model<Demande>("Demande", demandeSchema, "demande");
