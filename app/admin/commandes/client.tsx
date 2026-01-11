'use client';

import { useEffect, useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

type CommandeRow = {
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

export function CommandePageContent({
  payload,
  commandes,
}: {
  payload: JwtPayload;
  commandes: CommandeRow[];
}) {
  const [items, setItems] = useState<CommandeRow[]>(commandes);
  const [statusFilter, setStatusFilter] = useState<string>("Toutes");
  const [search, setSearch] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [searchLivreur, setSearchLivreur] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedClient, setSelectedClient] = useState<CommandeRow["clientInfo"] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingStatut, setPendingStatut] = useState<Record<string, string>>({});

  useEffect(() => {
    setItems(commandes);
  }, [commandes]);

  const statutChoices = useMemo(() => {
    const base = ["EN_ATTENTE", "ENVOYEE", "EN_COURS", "LIVREE", "ANNULEE"];
    const set = new Set<string>(base);
    items.forEach((c) => {
      if (c.statut) set.add(c.statut);
    });
    return Array.from(set);
  }, [items]);

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((c) => unique.add(c.statut ?? "Sans statut"));
    return ["Toutes", ...Array.from(unique)];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const termClient = searchClient.trim().toLowerCase();
    const termLivreur = searchLivreur.trim().toLowerCase();
    return items.filter((commande) => {
      const statut = commande.statut ?? "Sans statut";
      const matchStatus = statusFilter === "Toutes" ? true : statut === statusFilter;
      const haystack = `${commande.localisation_depart} ${commande.destination}`.toLowerCase();
      const matchSearch = term ? haystack.includes(term) : true;
      const matchClient = termClient
        ? (commande.clientName ?? "").toLowerCase().includes(termClient)
        : true;
      const matchLivreur = termLivreur
        ? (commande.livreurName ?? "").toLowerCase().includes(termLivreur)
        : true;
      return matchStatus && matchSearch && matchClient && matchLivreur;
    });
  }, [items, search, searchClient, searchLivreur, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hideEnvoyeFields = /envoy/i.test(statusFilter);
  const hideLivreur = hideEnvoyeFields || /confirm/i.test(statusFilter);
  const columnCount = 5 + (!hideEnvoyeFields ? 2 : 0) + (!hideLivreur ? 1 : 0);

  const changePage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
  };

  const updateStatut = async (commande: CommandeRow) => {
    const nouveauStatut = (pendingStatut[commande.id] ?? commande.statut)?.trim();
    if (!nouveauStatut) return;
    try {
      setUpdatingId(commande.id);
      await fetch(`/api/commande/${commande.id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut.trim() }),
      });
      setItems((prev) =>
        prev.map((c) => (c.id === commande.id ? { ...c, statut: nouveauStatut.trim() } : c))
      );
    } catch (error) {
      console.error("Erreur lors de la mise a jour du statut", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardShell payload={payload} title="Gestion des commandes" subtitle="Commandes">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex gap-2">
            {statusOptions.map((status) => {
              const active = status === statusFilter;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
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

          <div className="flex flex-1 justify-end">
            <input
              type="text"
              placeholder="Rechercher par depart ou destination"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full max-w-sm rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Rechercher client (nom/prenom)"
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="h-10 w-48 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="text"
              placeholder="Rechercher livreur (nom/prenom)"
              value={searchLivreur}
              onChange={(e) => setSearchLivreur(e.target.value)}
              className="h-10 w-48 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <span className="text-sm text-slate-500">
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} | Page {currentPage}/{totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ minWidth: hideEnvoyeFields ? 820 : 1100 }}
          >
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Depart</th>
                <th className="px-6 py-3 font-semibold">Arriver</th>
                {!hideEnvoyeFields && <th className="px-6 py-3 font-semibold">Date demande</th>}
                <th className="px-6 py-3 font-semibold">Statut</th>
                {!hideEnvoyeFields && <th className="px-6 py-3 font-semibold">Mode paiement</th>}
                <th className="px-6 py-3 font-semibold">Client</th>
                {!hideLivreur && <th className="px-6 py-3 font-semibold">Livreur</th>}
                <th className="px-6 py-3 font-semibold text-right">Prix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((commande) => {
                const statut = commande.statut ?? "Sans statut";
                return (
                  <tr key={commande.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{commande.localisation_depart}</div>
                      <div className="text-xs text-slate-500">
                        Zone: {commande.zoneDepart ?? "-"} | Sous-zone: {commande.sousZoneDepart ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">Num: {commande.telDepart ?? "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="text-xs text-slate-500">
                        Zone: {commande.zoneArrivee ?? "-"} | Sous-zone: {commande.sousZoneArrivee ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">Num: {commande.telArrivee ?? "-"}</div>
                    </td>
                    {!hideEnvoyeFields && (
                      <td className="px-6 py-4 text-slate-700">{commande.date_demande ?? "-"}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        {statut}
                      </span>
                      <div className="mt-2 flex gap-2 items-center">
                        <select
                          value={pendingStatut[commande.id] ?? commande.statut ?? ""}
                          onChange={(e) =>
                            setPendingStatut((prev) => ({
                              ...prev,
                              [commande.id]: e.target.value,
                            }))
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="" disabled>
                            Choisir un statut
                          </option>
                          {statutChoices.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => updateStatut(commande)}
                          disabled={updatingId === commande.id}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {updatingId === commande.id ? "Mise à jour..." : "Enregistrer"}
                        </button>
                      </div>
                    </td>
                    {!hideEnvoyeFields && (
                      <td className="px-6 py-4 text-slate-700">{commande.mode_paiement ?? "-"}</td>
                    )}
                    <td className="px-6 py-4 text-slate-700">
                      {commande.clientName && commande.clientName.trim().length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedClient(commande.clientInfo ?? null)}
                          className="text-sky-700 hover:underline"
                        >
                          {commande.clientName}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    {!hideLivreur && (
                      <td className="px-6 py-4 text-slate-700">
                        {commande.livreurName && commande.livreurName.trim().length > 0 ? commande.livreurName : "-"}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {commande.prix != null ? `${commande.prix} TND` : "-"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={columnCount}>
                    Aucune commande a afficher pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-sm text-slate-600">
          <div>
            Affiche {paginated.length} sur {filtered.length} resultat{filtered.length > 1 ? "s" : ""}
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
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Client</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {`${selectedClient.nom ?? ""} ${selectedClient.prenom ?? ""}`.trim() || "Inconnu"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                    {selectedClient.image ? (
                      <img
                        src={selectedClient.image}
                        alt="Client"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                        N/A
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {`${selectedClient.nom ?? ""} ${selectedClient.prenom ?? ""}`.trim() || "Inconnu"}
                    </p>
                    {selectedClient.telephone && (
                      <p className="text-xs text-slate-500">Tel: {selectedClient.telephone}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold">{selectedClient.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telephone</span>
                  <span className="font-semibold">{selectedClient.telephone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Adresse</span>
                  <span className="font-semibold text-right max-w-[60%]">
                    {selectedClient.adresse || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
