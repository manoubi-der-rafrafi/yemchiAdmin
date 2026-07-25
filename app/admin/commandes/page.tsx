import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { commandeService } from "@/lib/service/commandeService";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { type Commande } from "@/lib/models/commande";
import { type Utilisateur } from "@/lib/models/utilisateur";
import { CommandePageContent } from "./client";

type CommandeDto = {
  id: string;
  localisation_depart: string;
  destination: string;
  date_demande?: string | null;
  statut?: string | null;
  prix?: number | null;
  mode_paiement?: string | null;
  telDepart?: number | string | null;
  telArrivee?: number | string | null;
  clientName?: string | null;
  livreurName?: string | null;
  livreurId?: string | null;
  zoneDepart?: string | null;
  sousZoneDepart?: string | null;
  zoneArrivee?: string | null;
  sousZoneArrivee?: string | null;
  clientInfo?: {
    nom?: string | null;
    prenom?: string | null;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    image?: string | null;
  };
};

type LivreurDto = {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
};

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminCommandesPage() {
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

  const [commandes, livreurs] = await Promise.all([
    commandeService.list(),
    utilisateurService.list({ role: "transporteur" }),
  ]);

  const commandesDto: CommandeDto[] = commandes.map((commande: Commande) => {
    const client = commande.clientId as any;
    const livreur = commande.transporteurId as any;

    return {
      id: commande._id.toString(),
      localisation_depart: commande.localisation_depart,
      destination: commande.destination,
      date_demande: commande.date_demande ?? null,
      statut: commande.statut ?? null,
      prix: commande.prix ?? null,
      mode_paiement: (commande as any).modePaiement ?? commande.mode_paiement ?? null,
      telDepart: commande.telDepart ?? null,
      telArrivee: commande.telArrivee ?? null,
      zoneDepart: (commande as any).zone_principale_depart ?? null,
      sousZoneDepart: (commande as any).sous_zone_depart ?? null,
      zoneArrivee: (commande as any).zone_principale_arrivee ?? null,
      sousZoneArrivee: (commande as any).sous_zone_arrivee ?? null,
      clientName:
        typeof client === "object" && client
          ? `${client.nom ?? ""} ${client.prenom ?? ""}`.trim() || null
          : null,
      clientInfo:
        typeof client === "object" && client
          ? {
              nom: client.nom ?? null,
              prenom: client.prenom ?? null,
              email: client.email ?? null,
              telephone: client.telephone ?? null,
              adresse: client.adresse ?? null,
              image: client.image ?? null,
            }
          : undefined,
      livreurName:
        typeof livreur === "object" && livreur
          ? `${livreur.nom ?? ""} ${livreur.prenom ?? ""}`.trim() || null
          : null,
      livreurId:
        typeof livreur === "object" && livreur
          ? livreur._id?.toString() ?? null
          : livreur
            ? String(livreur)
            : null,
    };
  });

  const livreursDto: LivreurDto[] = livreurs.map((livreur: Utilisateur) => ({
    id: livreur._id.toString(),
    nom: livreur.nom,
    prenom: livreur.prenom,
    email: livreur.email ?? null,
  }));

  return (
    <CommandePageContent
      payload={payload as JwtPayload}
      commandes={commandesDto}
      livreurs={livreursDto}
    />
  );
}
