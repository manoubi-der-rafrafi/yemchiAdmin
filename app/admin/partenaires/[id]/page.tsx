import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { commandeService } from "@/lib/service/commandeService";
import { partenaireService } from "@/lib/service/partenaireService";
import { facturePartenaireService } from "@/lib/service/facturePartenaireService";
import { type Commande } from "@/lib/models/commande";
import { PartenaireCommandesPageContent, type PartenaireDetail, type PartnerCommandeRow } from "./client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminPartenaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  const partenaire = await partenaireService.get(id);

  if (!partenaire) {
    notFound();
  }

  const partenaireDto: PartenaireDetail = {
    id: partenaire._id.toString(),
    externalBusinessId: partenaire.externalBusinessId ?? null,
    externalOwnerUserId: partenaire.externalOwnerUserId ?? null,
    businessName: partenaire.businessName,
    statut: partenaire.statut ?? "ACTIF",
  };

  const filter = partenaireDto.externalBusinessId
    ? {
        $or: [
          { partenaireId: partenaireDto.id },
          { externalBusinessId: partenaireDto.externalBusinessId },
        ],
      }
    : { partenaireId: partenaireDto.id };

  const [commandes, factures, totalEntrepriseVersePartenaire, totalPartenaireVerseEntreprise] =
    await Promise.all([
      commandeService.list(filter as any),
      facturePartenaireService.list(partenaireDto.id, partenaireDto.externalBusinessId),
      facturePartenaireService.sumEntrepriseVerse(partenaireDto.id),
      facturePartenaireService.sumPartenaireVerse(partenaireDto.id),
    ]);

  const commandesDto: PartnerCommandeRow[] = commandes.map((commande: Commande) => {
    const data = commande as any;
    return {
      id: commande._id.toString(),
      externalOrderId: data.externalOrderId ?? null,
      nomDepart: data.nomDepart ?? null,
      nomArrivee: data.nomArrivee ?? null,
      localisation_depart: data.localisation_depart ?? data.localisationDepart ?? "-",
      destination: data.destination ?? "-",
      date_demande: data.date_demande ?? data.dateDemande ?? null,
      statut: data.statut ?? null,
      prix: data.prix ?? null,
      prixLivreur: data.prixLivreur ?? null,
      prixSociete: data.prixSociete ?? null,
      prixProduitsPartenaire: data.prixProduitsPartenaire ?? null,
      prixLivraison: data.prixLivraison ?? data.prix ?? null,
      prixTotalClient: data.prixTotalClient ?? null,
      encaisseurInitial: data.encaisseurInitial ?? null,
      statutEncaissementSociete: data.statutEncaissementSociete ?? null,
      dateEncaissementSociete: data.dateEncaissementSociete ?? null,
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
    <PartenaireCommandesPageContent
      payload={payload as JwtPayload}
      partenaire={partenaireDto}
      commandes={commandesDto}
      factures={factures.map((facture) => ({
        _id: facture._id.toString(),
        montant: Number(facture.montant),
        dateTimle: facture.dateTimle,
        type: facture.type,
        confirmer: facture.confirmer,
      }))}
      totalEntrepriseVersePartenaire={Number(totalEntrepriseVersePartenaire)}
      totalPartenaireVerseEntreprise={Number(totalPartenaireVerseEntreprise)}
    />
  );
}
