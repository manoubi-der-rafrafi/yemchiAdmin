import mongoose, { Schema, Document, Types } from "mongoose";

export interface Produit extends Document {
  nom: string | null;
  type: string | null;

  largeur: number | null;
  profondeur: number | null;
  hauteur: number | null;
  poids: number | null;

  quantite: number | null;

  facade: string | null;
  description: string | null;

  image1: string | null;
  image2: string | null;
  image3: string | null;

  prix: number | null;

  commandeId?: Types.ObjectId; // référence vers Commande
}

const produitSchema = new Schema<Produit>(
  {
    nom: { type: String, default: null },
    type: { type: String, default: null },

    largeur: { type: Number, default: null },
    profondeur: { type: Number, default: null },
    hauteur: { type: Number, default: null },
    poids: { type: Number, default: null },

    quantite: { type: Number, default: null },

    facade: { type: String, default: null },
    description: { type: String, default: null },

    image1: { type: String, default: null },
    image2: { type: String, default: null },
    image3: { type: String, default: null },

    prix: { type: Number, default: null },

    commandeId: {
      type: Schema.Types.ObjectId,
      ref: "Commande",
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Produit ||
  mongoose.model<Produit>("Produit", produitSchema);
