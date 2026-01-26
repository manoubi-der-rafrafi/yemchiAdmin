import mongoose, { Schema, Document } from "mongoose";

export type Role = 'client' | 'transporteur' | 'admin';
export type Statut = 'actif' | 'inactif' | 'banni';

export interface Utilisateur extends Document {
  nom: string;
  prenom: string;
  dateNaissance?: string;
  email: string;
  mot_de_passe?: string;
  motDePasse?: string;
  telephone?: string;
  role?: Role;
  adresse?: string;
  identifiant?: string;
  typeVehicule?: string;

  image?: string | null;
  imageCarteIdentiteFace?: string | null;
  imageCarteIdentiteArriere?: string | null;
  imagePermis?: string | null;
  imageCarteGrise?: string | null;
  imageAssurance?: string | null;

  statut?: Statut;
  dateCreation?: string;
}

const utilisateurSchema = new Schema<Utilisateur>(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    dateNaissance: { type: String },
    email: { type: String, required: true, unique: true },
    mot_de_passe: { type: String },
    motDePasse: { type: String },
    telephone: { type: String },
    role: { type: String, enum: ['client', 'transporteur', 'admin'], default: 'client' },
    adresse: { type: String },
    identifiant: { type: String },
    typeVehicule: { type: String },

    image: { type: String, default: null },
    imageCarteIdentiteFace: { type: String, default: null },
    imageCarteIdentiteArriere: { type: String, default: null },
    imagePermis: { type: String, default: null },
    imageCarteGrise: { type: String, default: null },
    imageAssurance: { type: String, default: null },

    statut: { type: String, enum: ['actif', 'inactif', 'banni'], default: 'actif' },
    dateCreation: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, collection: "utilisateur" }
);

// Unique identifiant only for transporteur users
utilisateurSchema.index(
  { identifiant: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: 'transporteur',
      identifiant: { $exists: true, $type: 'string' },
    },
  }
);

// Prevent model overwrite in Next.js (Hot Reload)
export default mongoose.models.Utilisateur || mongoose.model<Utilisateur>("Utilisateur", utilisateurSchema, "utilisateur");
