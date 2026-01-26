import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/config/db";
import { demandeService } from "@/lib/service/demandeService";
import UtilisateurModel from "@/lib/models/utilisateur";

const normalizeIdentifierPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const buildEmail = (prenom: string, nom: string) => {
  const safePrenom = normalizeIdentifierPart(prenom);
  const safeNom = normalizeIdentifierPart(nom);
  if (!safePrenom || !safeNom) return null;
  return `${safePrenom}.${safeNom}@yemchiwyji.tn`;
};

const getNextIdentifiant = async (year: number, startAt = 1) => {
  const prefix = `LIV-${year}-`;
  const regex = new RegExp(`^${prefix}`);
  let nextNumber = startAt;

  if (startAt === 1) {
    const last = await UtilisateurModel.findOne({
      role: "transporteur",
      identifiant: regex,
    })
      .sort({ identifiant: -1 })
      .select({ identifiant: 1 })
      .lean()
      .exec();

    if (last?.identifiant) {
      const lastPart = last.identifiant.split("-").pop();
      const parsed = Number(lastPart);
      if (!Number.isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }
  }

  const identifiant = `${prefix}${String(nextNumber).padStart(4, "0")}`;
  return { identifiant, nextNumber };
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const demande = await demandeService.get(id);
    if (!demande) {
      return NextResponse.json(
        { message: "Demande introuvable" },
        { status: 404 }
      );
    }

    const email = buildEmail(demande.prenom, demande.nom);
    if (!email) {
      return NextResponse.json(
        { message: "Email automatique invalide" },
        { status: 400 }
      );
    }

    const existing = await UtilisateurModel.findOne({
      email: new RegExp(`^${email}$`, "i"),
    }).exec();
    if (existing) {
      return NextResponse.json(
        { message: "Utilisateur deja cree pour cette demande" },
        { status: 409 }
      );
    }

    const year = new Date().getFullYear();
    let nextNumber = 1;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await getNextIdentifiant(year, nextNumber);
      const identifiant = result.identifiant;
      nextNumber = result.nextNumber + 1;
      const hashedPassword = await bcrypt.hash(identifiant, 10);

      try {
        const createdAt = new Date().toISOString();
        const utilisateur = new UtilisateurModel({
          nom: demande.nom,
          prenom: demande.prenom,
          email,
          telephone: demande.numero,
          role: "transporteur",
          identifiant,
          typeVehicule: demande.typeVehicule,
          mot_de_passe: hashedPassword,
          motDePasse: hashedPassword,
          statut: "actif",
          dateCreation: createdAt,
          imageCarteIdentiteFace: demande.imageCarteIdentiteFace,
          imageCarteIdentiteArriere: demande.imageCarteIdentiteArriere,
          imagePermis: demande.imagePermis,
          imageCarteGrise: demande.imageCarteGrise,
          imageAssurance: demande.imageAssurance,
        });

        await utilisateur.save();
        await UtilisateurModel.updateOne(
          { _id: utilisateur._id },
          { $unset: { createdAt: "", updatedAt: "" } },
          { timestamps: false }
        ).exec();
        await demandeService.markDossierPhysique(id, true);

        return NextResponse.json({
          message: "Utilisateur cree",
          identifiant,
          email,
        });
      } catch (error: unknown) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000) {
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json(
      { message: "Impossible de generer un identifiant unique" },
      { status: 409 }
    );
  } catch (error) {
    console.error("Error while creating transporteur", error);
    return NextResponse.json(
      { message: "Erreur lors de la creation du livreur" },
      { status: 500 }
    );
  }
}
