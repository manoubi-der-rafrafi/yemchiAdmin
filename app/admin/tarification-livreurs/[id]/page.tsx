import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { commandeService } from "@/lib/service/commandeService";
import { factureService } from "@/lib/service/factureService";
import { DashboardShell } from "../../dashboard/shell";
import { CommandesHistoryTable } from "./history-client";
import { FactureModal } from "./facture-modal";
import { FactureHistoryTable } from "./facture-history-client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

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
    modePaiement: commande.modePaiement ?? null,
    mode_paiement: commande.mode_paiement ?? null,
    zonePrincipaleDepart: commande.zonePrincipaleDepart ?? commande.zone_principale_depart ?? null,
    sousZoneDepart: commande.sousZoneDepart ?? commande.sous_zone_depart ?? null,
    zonePrincipaleArrivee: commande.zonePrincipaleArrivee ?? commande.zone_principale_arrivee ?? null,
    sousZoneArrivee: commande.sousZoneArrivee ?? commande.sous_zone_arrivee ?? null,
  }));
  const facturesPlain = factures.map((facture: any) => ({
    _id: facture._id?.toString?.() ?? String(facture._id),
    dateTimle: facture.dateTimle ?? null,
    montant: facture.montant ?? null,
    type: facture.type ?? null,
    image: facture.image ?? null,
  }));

  const diffRevenue = (totalEnligne - totalHorsEnligne) * 0.5;
  const diffFacture = totalFactureEntrepriseVerseLivreur - totalFactureLivreurVerseEntreprise;
  const valPaye = diffFacture - diffRevenue;
  const showDette = valPaye < 0;
  const specialLabel = showDette ? "Dette livreur" : "Credit livreur";
  const specialValue = showDette ? Math.abs(valPaye) : valPaye;
  const epsilon = 0.005;
  const showEncaissement = valPaye > epsilon;
  const showDecaissement = valPaye < -epsilon;
  const showFactureAction = showEncaissement || showDecaissement;

  return (
    <DashboardShell
      payload={payload as JwtPayload}
      title="Gestion financière"
      subtitle="Tarification livreurs"
      headerAction={
        <Link
          href="/admin/tarification-livreurs"
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Retour
        </Link>
      }
    >
      <div className="grid gap-6">
        <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur p-6 shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Details livreur</h2>
            {showFactureAction && (
              <FactureModal
                label={showEncaissement ? "Encaissement" : "Decaissement"}
                variant={showEncaissement ? "encaissement" : "decaissement"}
                livreurId={id}
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-sm text-slate-500">
              {livreur?.image ? (
                <img src={livreur.image} alt="Livreur" className="h-full w-full object-cover" />
              ) : (
                <span>{livreur?.nom?.charAt(0) ?? "-"}</span>
              )}
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                {livreur ? `${livreur.nom} ${livreur.prenom}` : "Livreur introuvable"}
              </div>
              <div className="text-sm text-slate-500">Identifiant: {livreur?.identifiant ?? "-"}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total revenue", value: `${formatMoney(totalRevenue)} DT` },
            { label: "Total enligne", value: `${formatMoney(totalEnligne)} DT` },
            { label: "Total non enligne", value: `${formatMoney(totalHorsEnligne)} DT` },
            { label: specialLabel, value: `${formatMoney(specialValue)} DT` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <CommandesHistoryTable commandes={commandesPlain} />
        <FactureHistoryTable factures={facturesPlain} />
      </div>
    </DashboardShell>
  );
}
