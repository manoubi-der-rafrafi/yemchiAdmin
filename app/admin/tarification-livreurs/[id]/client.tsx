'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JwtPayload } from "@/lib/utils/jwt";
import type { LivreurDebtDetails } from "@/lib/service/livreurDebtService";
import { DashboardShell } from "../../dashboard/shell";
import { CommandesHistoryTable } from "./history-client";
import { FactureModal } from "./facture-modal";
import { FactureHistoryTable, type FactureRow } from "./facture-history-client";

type LivreurPlain = {
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  image?: string | null;
  identifiant?: string | null;
} | null;

type CommandeRow = {
  _id: string;
  dateDemande?: string | null;
  destination?: string | null;
  prix?: number | string | null;
  prixLivreur?: number | string | null;
  prixSociete?: number | string | null;
  prixProduitsPartenaire?: number | string | null;
  sourceCommande?: string | null;
  partenaireId?: string | null;
  distanceKm?: number | null;
  vehicule?: string | null;
  modePaiement?: string | null;
  mode_paiement?: string | null;
  zonePrincipaleDepart?: string | null;
  sousZoneDepart?: string | null;
  zonePrincipaleArrivee?: string | null;
  sousZoneArrivee?: string | null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function TarificationLivreurDetailClient({
  payload,
  id,
  livreur,
  commandes,
  factures,
  totalRevenue,
  totalEnligne,
  totalHorsEnligne,
  totalPartSocieteHorsLigne,
  totalProduitsB2c,
  totalFactureEntrepriseVerseLivreur,
  totalFactureLivreurVerseEntreprise,
  debtDetails,
}: {
  payload: JwtPayload;
  id: string;
  livreur: LivreurPlain;
  commandes: CommandeRow[];
  factures: FactureRow[];
  totalRevenue: number;
  totalEnligne: number;
  totalHorsEnligne: number;
  totalPartSocieteHorsLigne: number;
  totalProduitsB2c: number;
  totalFactureEntrepriseVerseLivreur: number;
  totalFactureLivreurVerseEntreprise: number;
  debtDetails: LivreurDebtDetails | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FactureRow[]>(factures);
  const [totalEntrepriseVerse, setTotalEntrepriseVerse] = useState<number>(
    totalFactureEntrepriseVerseLivreur
  );
  const [totalLivreurVerse, setTotalLivreurVerse] = useState<number>(
    totalFactureLivreurVerseEntreprise
  );

  const acceptedFactures = useMemo(
    () => rows.filter((facture) => (facture.confirmer ?? "").toUpperCase() === "ACCEPTER"),
    [rows]
  );
  const pendingFactures = useMemo(() => {
    return rows.filter((facture) => {
      const status = (facture.confirmer ?? "").toUpperCase();
      return status !== "ACCEPTER" && status !== "REFUSER";
    });
  }, [rows]);

  const diffRevenue = totalEnligne - totalHorsEnligne;
  const diffFacture = totalEntrepriseVerse - totalLivreurVerse;
  const valPaye = diffRevenue - diffFacture;
  const showDette = valPaye < 0;
  const registreDette = debtDetails?.detteNette ?? (showDette ? Math.abs(valPaye) : 0);
  const registreCredit = debtDetails?.creditLivreur ?? (showDette ? 0 : valPaye);
  const specialLabel = registreDette > 0 ? "Dette livreur" : "Credit livreur";
  const specialValue = registreDette > 0 ? registreDette : registreCredit;
  const epsilon = 0.005;
  const showEncaissement = registreDette > epsilon;
  const showDecaissement = registreCredit > epsilon;
  const showFactureAction = showEncaissement || showDecaissement;

  const handleFactureCreated = (facture: {
    _id?: unknown;
    dateTimle: string;
    montant: number;
    type: string;
    image?: string | null;
    confirmer?: FactureRow["confirmer"];
  }) => {
    setRows((prev) => [{ ...facture }, ...prev]);
    if (facture.type === "ENTREPRISE_VERSE_LIVREUR") {
      setTotalEntrepriseVerse((prev) => prev + facture.montant);
    }
    if (facture.type === "LIVREUR_VERSE_ENTREPRISE") {
      setTotalLivreurVerse((prev) => prev + facture.montant);
    }
  };

  return (
    <DashboardShell
      payload={payload}
      title="Gestion financiÃ¨re"
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
                onCreated={handleFactureCreated}
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Gains livreur", value: `${formatMoney(totalRevenue)} DT` },
            { label: "Gains a verser (en ligne)", value: `${formatMoney(totalEnligne)} DT` },
            { label: "Courses a payer", value: `${formatMoney(debtDetails?.coursesAPayer ?? totalPartSocieteHorsLigne)} DT` },
            { label: "Produits B2C a payer", value: `${formatMoney(debtDetails?.produitsB2cAPayer ?? totalProduitsB2c)} DT` },
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

        {debtDetails && <DebtRegister details={debtDetails} />}

        <CommandesHistoryTable commandes={commandes} />
        <FactureHistoryTable
          factures={acceptedFactures}
          livreur={livreur}
          title="Factures acceptees"
          subtitle="Factures confirmees (confirmer = ACCEPTER)."
        />
        <FactureHistoryTable
          factures={pendingFactures}
          livreur={livreur}
          title="Factures non traitees"
          subtitle="Factures en attente de traitement."
          showTypeColumn={false}
          allowDecision
          onDecision={() => router.refresh()}
        />
      </div>
    </DashboardShell>
  );
}

function DebtRegister({ details }: { details: LivreurDebtDetails }) {
  const commandesRestantes = details.commandes.filter((commande) => commande.resteAPayer > 0.005);
  const commandesSoldees = details.commandes.filter((commande) => commande.resteAPayer <= 0.005);
  const paiementsAffectes = details.paiements.filter((paiement) => paiement.affectations.length > 0);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Registre des montants a payer</h3>
          <p className="mt-1 text-xs text-slate-500">
            Affectation FIFO : commandes les plus anciennes, produits puis part societe de la course.
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Paiements en attente : <strong>{formatMoney(details.paiementsEnAttente)} DT</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {commandesRestantes.map((commande) => (
          <details key={commande.commandeId} className="rounded-xl border border-slate-200 bg-white" open>
            <summary className="cursor-pointer list-none px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">
                    Commande {commande.externalOrderId || commande.commandeId}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {commande.dateLivraison
                      ? new Intl.DateTimeFormat("fr-FR").format(new Date(commande.dateLivraison))
                      : "Date inconnue"}
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  Paye {formatMoney(commande.montantPaye)} / {formatMoney(commande.montantInitial)} DT ·
                  <strong className="ml-1 text-rose-700">reste {formatMoney(commande.resteAPayer)} DT</strong>
                </div>
              </div>
            </summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Ligne</th><th className="px-4 py-2">Qte</th>
                    <th className="px-4 py-2 text-right">Prix unitaire</th>
                    <th className="px-4 py-2 text-right">Initial</th>
                    <th className="px-4 py-2 text-right">Paye</th>
                    <th className="px-4 py-2 text-right">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commande.lignes.map((ligne) => (
                    <tr key={ligne.ligneId}>
                      <td className="px-4 py-2 text-slate-700">
                        {ligne.nom}<span className="ml-2 text-[10px] text-slate-400">{ligne.type}</span>
                      </td>
                      <td className="px-4 py-2">{ligne.quantite}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(ligne.prixUnitaire)} DT</td>
                      <td className="px-4 py-2 text-right">{formatMoney(ligne.montantInitial)} DT</td>
                      <td className="px-4 py-2 text-right text-emerald-700">{formatMoney(ligne.montantPaye)} DT</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatMoney(ligne.resteAPayer)} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {commandesRestantes.length === 0 && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Aucune commande a payer.</p>
        )}
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
          Commandes soldees ({commandesSoldees.length})
        </summary>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
          {commandesSoldees.length === 0
            ? "Aucune commande soldee."
            : commandesSoldees.map((commande) => (
                <div key={commande.commandeId} className="flex justify-between border-b border-slate-50 py-2 last:border-0">
                  <span>{commande.externalOrderId || commande.commandeId}</span>
                  <span>{formatMoney(commande.montantInitial)} DT payes</span>
                </div>
              ))}
        </div>
      </details>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
          Affectations des factures acceptees ({paiementsAffectes.length})
        </summary>
        <div className="divide-y divide-slate-100 border-t border-slate-100 px-4">
          {paiementsAffectes.map((paiement) => (
            <div key={paiement.factureId} className="py-3 text-xs">
              <div className="font-semibold text-slate-800">
                Facture {paiement.factureId} · {formatMoney(paiement.montantAffecte)} DT affectes
              </div>
              {paiement.affectations.map((affectation) => (
                <div key={`${affectation.ligneId}-${affectation.montant}`} className="mt-1 flex justify-between text-slate-500">
                  <span>{affectation.libelle} · commande {affectation.commandeId}</span>
                  <span>{formatMoney(affectation.montant)} DT</span>
                </div>
              ))}
            </div>
          ))}
          {paiementsAffectes.length === 0 && <p className="py-3 text-xs text-slate-500">Aucune affectation.</p>}
        </div>
      </details>
    </section>
  );
}
