import mongoose, { Schema, Document } from "mongoose";

export type Role = 'client' | 'transporteur' | 'admin';
export type Statut = 'actif' | 'inactif' | 'banni';

export interface Utilisateur extends Document {
  nom: string;
  prenom: string;
  dateNaissance?: string;
  email: string;
  mot_de_passe?: string;
  telephone?: string;
  role?: Role;
  adresse?: string;

  image?: string | null;
  imageCarteIdentiteFace?: string | null;
  imageCarteIdentiteArriere?: string | null;
  imagePermis?: string | null;
  imageCarteGrise?: string | null;
  imageAssurance?: string | null;

  statut?: Statut;
  date_creation?: string;
}

const utilisateurSchema = new Schema<Utilisateur>(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    dateNaissance: { type: String },
    email: { type: String, required: true, unique: true },
    mot_de_passe: { type: String },
    telephone: { type: String },
    role: { type: String, enum: ['client', 'transporteur', 'admin'], default: 'client' },
    adresse: { type: String },

    image: { type: String, default: null },
    imageCarteIdentiteFace: { type: String, default: null },
    imageCarteIdentiteArriere: { type: String, default: null },
    imagePermis: { type: String, default: null },
    imageCarteGrise: { type: String, default: null },
    imageAssurance: { type: String, default: null },

    statut: { type: String, enum: ['actif', 'inactif', 'banni'], default: 'actif' },
    date_creation: { type: String },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js (Hot Reload)
export default mongoose.models.Utilisateur || mongoose.model<Utilisateur>("Utilisateur", utilisateurSchema);
