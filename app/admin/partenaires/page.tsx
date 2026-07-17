import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { commandeService } from "@/lib/service/commandeService";
import { partenaireService } from "@/lib/service/partenaireService";
import { type Commande } from "@/lib/models/commande";
import { type Partenaire } from "@/lib/models/partenaire";
import { PartenairesPageContent, type CommandeRow, type PartenaireRow } from "./client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const toIso = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export default async function AdminPartenairesPage() {
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

  const partenaires = await partenaireService.list();
  const commandes = await commandeService.list({
    $or: [
      { partenaireId: { $exists: true, $ne: null } },
      { externalBusinessId: { $exists: true, $ne: null } },
    ],
  } as any);

  const partenairesDto: PartenaireRow[] = partenaires.map((partenaire: Partenaire) => ({
    id: partenaire._id.toString(),
    externalBusinessId: partenaire.externalBusinessId ?? null,
    externalOwnerUserId: partenaire.externalOwnerUserId ?? null,
    businessName: partenaire.businessName,
    statut: partenaire.statut ?? "ACTIF",
    createdAt: toIso(partenaire.createdAt),
    updatedAt: toIso(partenaire.updatedAt),
  }));

  const commandesDto: CommandeRow[] = commandes.map((commande: Commande) => {
    const data = commande as any;
    return {
      id: commande._id.toString(),
      partenaireId: data.partenaireId ?? null,
      externalBusinessId: data.externalBusinessId ?? null,
      externalOrderId: data.externalOrderId ?? null,
      nomDepart: data.nomDepart ?? null,
      nomArrivee: data.nomArrivee ?? null,
      localisation_depart: data.localisation_depart ?? data.localisationDepart ?? "-",
      destination: data.destination ?? "-",
      date_demande: data.date_demande ?? data.dateDemande ?? null,
      statut: data.statut ?? null,
      prix: data.prix ?? null,
      mode_paiement: data.modePaiement ?? data.mode_paiement ?? null,
      telDepart: data.telDepart ?? null,
      telArrivee: data.telArrivee ?? null,
      zoneDepart: data.zone_principale_depart ?? data.zonePrincipaleDepart ?? null,
      sousZoneDepart: data.sous_zone_depart ?? data.sousZoneDepart ?? null,
      zoneArrivee: data.zone_principale_arrivee ?? data.zonePrincipaleArrivee ?? null,
      sousZoneArrivee: data.sous_zone_arrivee ?? data.sousZoneArrivee ?? null,
      livreurName:
        typeof data.transporteurId === "object" && data.transporteurId
          ? `${data.transporteurId.nom ?? ""} ${data.transporteurId.prenom ?? ""}`.trim() || null
          : null,
    };
  });

  return (
    <PartenairesPageContent
      payload={payload as JwtPayload}
      partenaires={partenairesDto}
      commandes={commandesDto}
    />
  );
}
