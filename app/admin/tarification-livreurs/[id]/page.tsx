import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { commandeService } from "@/lib/service/commandeService";
import { factureService } from "@/lib/service/factureService";
import { TarificationLivreurDetailClient } from "./client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function TarificationLivreurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const livreur = await utilisateurService.get(id);
  const livreurPlain = livreur
    ? {
        nom: livreur.nom ?? null,
        prenom: livreur.prenom ?? null,
        email: livreur.email ?? null,
        telephone: livreur.telephone ?? null,
        image: livreur.image ?? null,
        identifiant: livreur.identifiant ?? null,
      }
    : null;
  const [
    totalRevenue,
    totalEnligne,
    totalHorsEnligne,
    totalFactureEntrepriseVerseLivreur,
    totalFactureLivreurVerseEntreprise,
    factures,
  ] = await Promise.all([
    commandeService.sumPrixByLivreurId(id),
    commandeService.sumPrixLivreeEnligneByTransporteurId(id),
    commandeService.sumPrixLivreeHorsEnligneByTransporteurId(id),
    factureService.sumMontantEntrepriseVerseLivreurByLivreurId(id),
    factureService.sumMontantLivreurVerseEntrepriseByLivreurId(id),
    factureService.listByLivreurId(id),
  ]);
  const commandesLivree = await commandeService.listLivreeByTransporteurId(id);
  const commandesPlain = commandesLivree.map((commande: any) => ({
    _id: commande._id?.toString?.() ?? String(commande._id),
    dateDemande: commande.dateDemande ?? commande.date_demande ?? null,
    destination: commande.destination ?? null,
    prix: commande.prix ?? null,
    prixLivreur: commande.prixLivreur ?? null,
    prixSociete: commande.prixSociete ?? null,
    modePaiement: commande.modePaiement ?? null,
    mode_paiement: commande.mode_paiement ?? null,
    zonePrincipaleDepart: commande.zonePrincipaleDepart ?? commande.zone_principale_depart ?? null,
    sousZoneDepart: commande.sousZoneDepart ?? commande.sous_zone_depart ?? null,
    zonePrincipaleArrivee: commande.zonePrincipaleArrivee ?? commande.zone_principale_arrivee ?? null,
    sousZoneArrivee: commande.sousZoneArrivee ?? commande.sous_zone_arrivee ?? null,
    distanceKm: commande.distanceKm ?? commande.distance_km ?? null,
    vehicule: commande.vehicule ?? null,
  }));
  const facturesPlain = factures.map((facture: any) => ({
    _id: facture._id?.toString?.() ?? String(facture._id),
    dateTimle: facture.dateTimle ?? null,
    montant: facture.montant ?? null,
    type: facture.type ?? null,
    image: facture.image ?? null,
    confirmer: facture.confirmer ?? null,
  }));

  return (
    <TarificationLivreurDetailClient
      payload={payload as JwtPayload}
      id={id}
      livreur={livreurPlain}
      commandes={commandesPlain}
      factures={facturesPlain}
      totalRevenue={totalRevenue}
      totalEnligne={totalEnligne}
      totalHorsEnligne={totalHorsEnligne}
      totalFactureEntrepriseVerseLivreur={totalFactureEntrepriseVerseLivreur}
      totalFactureLivreurVerseEntreprise={totalFactureLivreurVerseEntreprise}
    />
  );
}
