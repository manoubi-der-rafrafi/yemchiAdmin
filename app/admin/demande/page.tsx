import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { DemandePageContent } from "./client";
import { demandeService } from "@/lib/service/demandeService";
import { ReponseDemande, type Demande } from "@/lib/models/demande";

type DemandeDto = {
  id: string;
  nom: string;
  prenom: string;
  numero: string;
  typeVehicule: string;
  dateDemande?: string;
  dateReponse?: string | null;
  reponse: ReponseDemande;
  dossierPhysique?: boolean;
  causesRefus?: Record<string, string[]>;
  imageCarteIdentiteFace: string;
  imageCarteIdentiteArriere: string;
  imagePermis: string;
  imageCarteGrise: string;
  imageAssurance: string;
};

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const normalizeReponse = (reponse: unknown): ReponseDemande => {
  if (reponse === false || reponse == null || reponse === "") {
    return ReponseDemande.NON_TRAITER;
  }

  if (reponse === true) {
    return ReponseDemande.ACCEPTER;
  }

  const normalized = String(reponse).trim().toLowerCase().replace(/[-_]+/g, " ");
  if (normalized === "false") return ReponseDemande.NON_TRAITER;
  if (normalized === "true") return ReponseDemande.ACCEPTER;
  if (normalized === ReponseDemande.ACCEPTER) return ReponseDemande.ACCEPTER;
  if (normalized === ReponseDemande.REFUSER) return ReponseDemande.REFUSER;
  return ReponseDemande.NON_TRAITER;
};

export default async function AdminDemandePage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/auth");
  }

  const payload = await verifyJwt(token, secret);
  const role = payload ? extractRole(payload) : null;

  if (!payload || role !== "admin") {
    redirect("/auth");
  }

  const demandes = await demandeService.list({ dossierPhysique: { $ne: true } });

  const demandesDto: DemandeDto[] = demandes.map((demande: Demande) => ({
    id: demande._id.toString(),
    nom: demande.nom,
    prenom: demande.prenom,
    numero: demande.numero,
    typeVehicule: demande.typeVehicule,
    dateDemande: demande.dateDemande ?? undefined,
    dateReponse: demande.dateReponse ?? null,
    reponse: normalizeReponse(demande.reponse),
    dossierPhysique: demande.dossierPhysique ?? false,
    causesRefus:
      demande.causesRefus instanceof Map
        ? Object.fromEntries(demande.causesRefus.entries())
        : demande.causesRefus ?? undefined,
    imageCarteIdentiteFace: demande.imageCarteIdentiteFace,
    imageCarteIdentiteArriere: demande.imageCarteIdentiteArriere,
    imagePermis: demande.imagePermis,
    imageCarteGrise: demande.imageCarteGrise,
    imageAssurance: demande.imageAssurance,
  }));

  return <DemandePageContent payload={payload as JwtPayload} demandes={demandesDto} />;
}
