import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { commandeService } from "@/lib/service/commandeService";
import { type Commande } from "@/lib/models/commande";
import { CommandePageContent } from "./client";

type CommandeDto = {
  id: string;
  localisation_depart: string;
  destination: string;
  date_demande?: string | null;
  statut?: string | null;
  prix?: number | null;
  mode_paiement?: string | null;
  telDepart?: number | null;
  telArrivee?: number | null;
  clientName?: string | null;
  livreurName?: string | null;
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

  const commandes = await commandeService.list();

  const commandesDto: CommandeDto[] = commandes.map((commande: Commande) => ({
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
      typeof commande.clientId === "object" && commande.clientId
        ? `${(commande.clientId as any).nom ?? ""} ${(commande.clientId as any).prenom ?? ""}`.trim() || null
        : null,
    clientInfo:
      typeof commande.clientId === "object" && commande.clientId
        ? {
            nom: (commande.clientId as any).nom ?? null,
            prenom: (commande.clientId as any).prenom ?? null,
            email: (commande.clientId as any).email ?? null,
            telephone: (commande.clientId as any).telephone ?? null,
            adresse: (commande.clientId as any).adresse ?? null,
            image: (commande.clientId as any).image ?? null,
          }
        : undefined,
    livreurName:
      typeof commande.transporteurId === "object" && commande.transporteurId
        ? `${(commande.transporteurId as any).nom ?? ""} ${(commande.transporteurId as any).prenom ?? ""}`.trim() ||
          null
        : null,
  }));

  return <CommandePageContent payload={payload as JwtPayload} commandes={commandesDto} />;
}
