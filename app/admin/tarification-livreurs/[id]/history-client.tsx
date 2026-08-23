'use client';

import { useMemo, useState } from "react";

type CommandeRow = {
  _id?: unknown;
  dateDemande?: string | null;
  localisationDepart?: string | null;
  localisation_depart?: string | null;
  destination?: string | null;
  prix?: number | string | null;
  prixLivreur?: number | string | null;
  prixSociete?: number | string | null;
  prixProduitsPartenaire?: number | string | null;
  sourceCommande?: string | null;
  partenaireId?: string | null;
  modePaiement?: string | null;
  mode_paiement?: string | null;
  zonePrincipaleDepart?: string | null;
  zone_principale_depart?: string | null;
  sousZoneDepart?: string | null;
  sous_zone_depart?: string | null;
  zonePrincipaleArrivee?: string | null;
  zone_principale_arrivee?: string | null;
  sousZoneArrivee?: string | null;
  sous_zone_arrivee?: string | null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeMode = (value: string) => value.replace(/\s+/g, "_").toLowerCase();

export function CommandesHistoryTable({ commandes }: { commandes: CommandeRow[] }) {
  const [modeFilter, setModeFilter] = useState<"en_ligne" | "autre">("en_ligne");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const toDateKey = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const normalizeRange = () => {
    if (startDate && endDate) return { start: startDate, end: endDate };
    if (startDate) return { start: startDate, end: startDate };
    if (endDate) return { start: endDate, end: endDate };
    return null;
  };

  const filtered = useMemo(() => {
    const range = normalizeRange();
    return commandes.filter((commande) => {
      const raw = String(commande.modePaiement ?? commande.mode_paiement ?? "");
      const normalized = normalizeMode(raw);
      const isEnLigne = normalized === "en_ligne";
      if (modeFilter === "en_ligne" ? !isEnLigne : isEnLigne) return false;
      if (!range) return true;
      const key = toDateKey(commande.dateDemande);
      if (!key) return false;
      return key >= range.start && key <= range.end;
    });
  }, [commandes, modeFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setFilter = (value: "en_ligne" | "autre") => {
    setModeFilter(value);
    setPage(1);
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Historique des commandes livrees</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("en_ligne")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              modeFilter === "en_ligne"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            EN_LIGNE
          </button>
          <button
            type="button"
            onClick={() => setFilter("autre")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              modeFilter === "autre"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Autres
          </button>
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset dates
            </button>
          )}
        </div>
        <span className="text-sm text-slate-500">
          {filtered.length} commande{filtered.length > 1 ? "s" : ""} | Page {currentPage}/{totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 1020 }}>
          <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Date</th>
              <th className="px-5 py-2.5 font-semibold">Depart</th>
              <th className="px-5 py-2.5 font-semibold">Destination</th>
              <th className="px-5 py-2.5 font-semibold text-right">Prix</th>
              <th className="px-5 py-2.5 font-semibold text-right">Livreur</th>
              <th className="px-5 py-2.5 font-semibold text-right">Societe</th>
              <th className="px-5 py-2.5 font-semibold text-right">Produits B2C</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((commande) => {
              const zoneDepart = commande.zonePrincipaleDepart ?? commande.zone_principale_depart ?? "-";
              const sousZoneDepart = commande.sousZoneDepart ?? commande.sous_zone_depart ?? "-";
              const zoneArrivee = commande.zonePrincipaleArrivee ?? commande.zone_principale_arrivee ?? "-";
              const sousZoneArrivee = commande.sousZoneArrivee ?? commande.sous_zone_arrivee ?? "-";
              const prix = typeof commande.prix === "string" ? Number(commande.prix) : commande.prix ?? 0;
              const prixLivreur = Number(commande.prixLivreur ?? prix / 2);
              const prixSociete = Number(commande.prixSociete ?? prix - prixLivreur);
              const isB2c =
                (commande.sourceCommande ?? "").toUpperCase() === "B2C" ||
                Boolean(commande.partenaireId);
              const prixProduitsB2c = Number(commande.prixProduitsPartenaire ?? 0);

              return (
                <tr key={String(commande._id ?? Math.random())} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-700">{formatDate(commande.dateDemande)}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {zoneDepart} / {sousZoneDepart}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {zoneArrivee} / {sousZoneArrivee}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatMoney(prix)} DT</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatMoney(prixLivreur)} DT</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatMoney(prixSociete)} DT</td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {isB2c ? `${formatMoney(prixProduitsB2c)} DT` : "-"}
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td className="px-5 py-5 text-center text-slate-500" colSpan={7}>
                  Aucune commande livree pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm text-slate-600">
        <div>
          Affiche {paginated.length} sur {filtered.length} resultat{filtered.length > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
