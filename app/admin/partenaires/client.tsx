'use client';

import { useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { COMMANDE_STATUTS } from "@/lib/constants/commande-statut";
import { DashboardShell } from "../dashboard/shell";

export type PartenaireRow = {
  id: string;
  externalBusinessId?: string | null;
  externalOwnerUserId?: string | null;
  businessName: string;
  statut?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CommandeRow = {
  id: string;
  partenaireId?: string | null;
  externalBusinessId?: string | null;
  externalOrderId?: string | null;
  nomDepart?: string | null;
  nomArrivee?: string | null;
  localisation_depart: string;
  destination: string;
  date_demande?: string | null;
  statut?: string | null;
  prix?: number | string | null;
  mode_paiement?: string | null;
  telDepart?: number | string | null;
  telArrivee?: number | string | null;
  livreurName?: string | null;
  zoneDepart?: string | null;
  sousZoneDepart?: string | null;
  zoneArrivee?: string | null;
  sousZoneArrivee?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function PartenairesPageContent({
  payload,
  partenaires,
  commandes,
}: {
  payload: JwtPayload;
  partenaires: PartenaireRow[];
  commandes: CommandeRow[];
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(partenaires[0]?.id ?? null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingStatut, setPendingStatut] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<CommandeRow[]>(commandes);
  const pageSize = 10;

  const selectedPartner = useMemo(
    () => partenaires.find((partner) => partner.id === selectedPartnerId) ?? null,
    [partenaires, selectedPartnerId]
  );

  const filteredPartners = useMemo(() => {
    const term = partnerSearch.trim().toLowerCase();
    if (!term) return partenaires;
    return partenaires.filter((partner) => {
      const haystack = `${partner.businessName} ${partner.externalBusinessId ?? ""} ${partner.externalOwnerUserId ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [partenaires, partnerSearch]);

  const partnerCommandes = useMemo(() => {
    if (!selectedPartner) return [];
    return rows.filter((commande) => {
      return (
        commande.partenaireId === selectedPartner.id ||
        (!!selectedPartner.externalBusinessId &&
          commande.externalBusinessId === selectedPartner.externalBusinessId)
      );
    });
  }, [rows, selectedPartner]);

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    partnerCommandes.forEach((commande) => unique.add(commande.statut ?? "Sans statut"));
    return ["Toutes", ...Array.from(unique)];
  }, [partnerCommandes]);

  const statutChoices = useMemo(() => Array.from(COMMANDE_STATUTS), []);

  const filteredCommandes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return partnerCommandes.filter((commande) => {
      const statut = commande.statut ?? "Sans statut";
      const matchStatus = statusFilter === "Toutes" ? true : statut === statusFilter;
      const haystack = `${commande.localisation_depart} ${commande.destination} ${commande.externalOrderId ?? ""} ${commande.nomDepart ?? ""} ${commande.nomArrivee ?? ""}`.toLowerCase();
      const matchSearch = term ? haystack.includes(term) : true;
      return matchStatus && matchSearch;
    });
  }, [partnerCommandes, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCommandes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredCommandes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hideEnvoyeFields = /envoy/i.test(statusFilter);
  const hideLivreur = hideEnvoyeFields || /confirm/i.test(statusFilter);
  const columnCount = 7 + (!hideLivreur ? 1 : 0);

  const selectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setStatusFilter("Toutes");
    setSearch("");
    setPage(1);
  };

  const changePage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  const updateStatut = async (commande: CommandeRow) => {
    const nouveauStatut = (pendingStatut[commande.id] ?? commande.statut)?.trim();
    if (!nouveauStatut) return;
    try {
      setUpdatingId(commande.id);
      const response = await fetch(`/api/commande/${commande.id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise a jour du statut");
      }
      setRows((current) =>
        current.map((commandeItem) =>
          commandeItem.id === commande.id ? { ...commandeItem, statut: nouveauStatut } : commandeItem
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise a jour du statut", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardShell payload={payload} title="Gestion des partenaires" subtitle="Partenaires">
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Liste des partenaires</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cliquez sur un partenaire pour afficher ses commandes.
            </p>
            <input
              type="text"
              placeholder="Rechercher partenaire"
              value={partnerSearch}
              onChange={(event) => setPartnerSearch(event.target.value)}
              className="mt-3 h-9 w-full rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {filteredPartners.map((partner) => {
              const selected = partner.id === selectedPartnerId;
              const count = rows.filter(
                (commande) =>
                  commande.partenaireId === partner.id ||
                  (!!partner.externalBusinessId && commande.externalBusinessId === partner.externalBusinessId)
              ).length;

              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => selectPartner(partner.id)}
                  className={`w-full px-5 py-4 text-left transition-colors ${
                    selected ? "bg-sky-50/80" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{partner.businessName}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {partner.externalBusinessId ?? "Sans external business ID"}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full text-[11px] font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {partner.statut ?? "ACTIF"}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(partner.createdAt)}</span>
                  </div>
                </button>
              );
            })}

            {filteredPartners.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-slate-500">
                Aucun partenaire a afficher.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
          <div className="flex flex-wrap items-center gap-3 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {selectedPartner?.businessName ?? "Commandes partenaire"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedPartner?.externalBusinessId ?? "Selectionnez un partenaire"}
              </p>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <input
                type="text"
                placeholder="Rechercher commande"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-56 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
              <span className="text-xs text-slate-500">
                {filteredCommandes.length} commande{filteredCommandes.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {statusOptions.map((status) => {
              const active = status === statusFilter;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_8px_24px_rgba(14,165,233,0.16)]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: hideLivreur ? 980 : 1120 }}>
              <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Commande</th>
                  <th className="px-6 py-3 font-semibold">Depart</th>
                  <th className="px-6 py-3 font-semibold">Arrivee</th>
                  <th className="px-6 py-3 font-semibold">Date demande</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold">Paiement</th>
                  {!hideLivreur && <th className="px-6 py-3 font-semibold">Livreur</th>}
                  <th className="px-6 py-3 font-semibold text-right">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((commande) => {
                  const statut = commande.statut ?? "Sans statut";
                  return (
                    <tr key={commande.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold text-slate-900">{commande.externalOrderId ?? commande.id}</div>
                        <div className="text-xs text-slate-500">{commande.id}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div>{commande.localisation_depart}</div>
                        <div className="text-xs font-normal text-slate-500">
                          {commande.nomDepart ? `Nom: ${commande.nomDepart}` : null}
                        </div>
                        <div className="text-xs font-normal text-slate-500">
                          Zone: {commande.zoneDepart ?? "-"} | Sous-zone: {commande.sousZoneDepart ?? "-"}
                        </div>
                        <div className="text-xs font-normal text-slate-500">Num: {commande.telDepart ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div>{commande.destination}</div>
                        <div className="text-xs text-slate-500">
                          {commande.nomArrivee ? `Nom: ${commande.nomArrivee}` : null}
                        </div>
                        <div className="text-xs text-slate-500">
                          Zone: {commande.zoneArrivee ?? "-"} | Sous-zone: {commande.sousZoneArrivee ?? "-"}
                        </div>
                        <div className="text-xs text-slate-500">Num: {commande.telArrivee ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(commande.date_demande)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          {statut}
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            value={pendingStatut[commande.id] ?? commande.statut ?? ""}
                            onChange={(event) =>
                              setPendingStatut((current) => ({
                                ...current,
                                [commande.id]: event.target.value,
                              }))
                            }
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                          >
                            <option value="" disabled>
                              Choisir un statut
                            </option>
                            {statutChoices.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateStatut(commande)}
                            disabled={updatingId === commande.id}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {updatingId === commande.id ? "Mise a jour..." : "Enregistrer"}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{commande.mode_paiement ?? "-"}</td>
                      {!hideLivreur && (
                        <td className="px-6 py-4 text-slate-700">{commande.livreurName ?? "-"}</td>
                      )}
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {commande.prix != null ? `${commande.prix} TND` : "-"}
                      </td>
                    </tr>
                  );
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-slate-500" colSpan={columnCount}>
                      Aucune commande a afficher pour ce partenaire.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
            <div>
              Affiche {paginated.length} sur {filteredCommandes.length} resultat
              {filteredCommandes.length > 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-2 text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
