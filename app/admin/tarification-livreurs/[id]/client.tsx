'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../../dashboard/shell";
import { CommandesHistoryTable } from "./history-client";
import { FactureModal } from "./facture-modal";
import { FactureHistoryTable } from "./facture-history-client";

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
  modePaiement?: string | null;
  mode_paiement?: string | null;
  zonePrincipaleDepart?: string | null;
  sousZoneDepart?: string | null;
  zonePrincipaleArrivee?: string | null;
  sousZoneArrivee?: string | null;
};

type FactureRow = {
  _id?: unknown;
  dateTimle?: string | null;
  montant?: number | string | null;
  type?: string | null;
  image?: string | null;
  confirmer?: string | null;
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
  totalFactureEntrepriseVerseLivreur,
  totalFactureLivreurVerseEntreprise,
}: {
  payload: JwtPayload;
  id: string;
  livreur: LivreurPlain;
  commandes: CommandeRow[];
  factures: FactureRow[];
  totalRevenue: number;
  totalEnligne: number;
  totalHorsEnligne: number;
  totalFactureEntrepriseVerseLivreur: number;
  totalFactureLivreurVerseEntreprise: number;
}) {
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

  const diffRevenue = (totalEnligne - totalHorsEnligne) * 0.5;
  const diffFacture = totalEntrepriseVerse - totalLivreurVerse;
  const valPaye = diffFacture - diffRevenue;
  const showDette = valPaye < 0;
  const specialLabel = showDette ? "Dette livreur" : "Credit livreur";
  const specialValue = showDette ? Math.abs(valPaye) : valPaye;
  const epsilon = 0.005;
  const showEncaissement = valPaye > epsilon;
  const showDecaissement = valPaye < -epsilon;
  const showFactureAction = showEncaissement || showDecaissement;

  const handleFactureCreated = (facture: {
    _id?: unknown;
    dateTimle: string;
    montant: number;
    type: string;
    image?: string | null;
    confirmer?: string | null;
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
        />
      </div>
    </DashboardShell>
  );
}
