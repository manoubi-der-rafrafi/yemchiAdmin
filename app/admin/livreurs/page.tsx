import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { type Utilisateur } from "@/lib/models/utilisateur";
import { LivreursPageContent } from "./client";

type LivreurDto = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  statut?: string | null;
  adresse?: string | null;
  image?: string | null;
  date_creation?: string | null;
};

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminLivreursPage() {
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

  const livreurs = await utilisateurService.list({ role: "transporteur" });

  const livreursDto: LivreurDto[] = livreurs.map((livreur: Utilisateur) => ({
    id: livreur._id.toString(),
    nom: livreur.nom,
    prenom: livreur.prenom,
    email: livreur.email,
    telephone: livreur.telephone ?? null,
    statut: livreur.statut ?? null,
    adresse: livreur.adresse ?? null,
    image: (livreur as any).image ?? null,
    date_creation: (livreur as any).date_creation ?? null,
  }));

  return <LivreursPageContent payload={payload as JwtPayload} livreurs={livreursDto} />;
}
