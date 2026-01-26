'use client';

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type FactureRow = {
  _id?: unknown;
  dateTimle?: string | null;
  montant?: number | string | null;
  type?: string | null;
  image?: string | null;
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

const typeLabel = (value?: string | null) => {
  if (value === "ENTREPRISE_VERSE_LIVREUR") return "Verse livreur";
  if (value === "LIVREUR_VERSE_ENTREPRISE") return "Verse entreprise";
  return "-";
};

type TypeFilter = "tous" | "verse_livreur" | "verse_entreprise";

export function FactureHistoryTable({ factures }: { factures: FactureRow[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("tous");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [detailImage, setDetailImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return factures.filter((facture) => {
      const matchType =
        typeFilter === "tous"
          ? true
          : typeFilter === "verse_livreur"
            ? facture.type === "ENTREPRISE_VERSE_LIVREUR"
            : facture.type === "LIVREUR_VERSE_ENTREPRISE";
      if (!matchType) return false;
      if (!range) return true;
      const key = toDateKey(facture.dateTimle);
      if (!key) return false;
      return key >= range.start && key <= range.end;
    });
  }, [factures, typeFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showType = typeFilter === "tous";

  const setFilter = (value: TypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Historique des factures</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("tous")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "tous"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFilter("verse_livreur")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "verse_livreur"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Verse livreur
          </button>
          <button
            type="button"
            onClick={() => setFilter("verse_entreprise")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              typeFilter === "verse_entreprise"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Verse entreprise
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
          {filtered.length} facture{filtered.length > 1 ? "s" : ""} | Page {currentPage}/{totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: showType ? 620 : 520 }}>
          <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Date</th>
              {showType && <th className="px-5 py-2.5 font-semibold">Type</th>}
              <th className="px-5 py-2.5 font-semibold text-right">Montant</th>
              <th className="px-5 py-2.5 font-semibold text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((facture) => {
              const montant = typeof facture.montant === "string" ? Number(facture.montant) : facture.montant ?? 0;
              return (
                <tr key={String(facture._id ?? Math.random())} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-700">{formatDate(facture.dateTimle)}</td>
                  {showType && <td className="px-5 py-3 text-slate-700">{typeLabel(facture.type)}</td>}
                  <td className="px-5 py-3 text-right text-slate-700">{formatMoney(montant)} DT</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={!facture.image}
                      onClick={() => setDetailImage(facture.image ?? null)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        facture.image
                          ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td className="px-5 py-5 text-center text-slate-500" colSpan={showType ? 4 : 3}>
                  Aucune facture a afficher pour le moment.
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

      {mounted &&
        detailImage &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setDetailImage(null)}
              className="absolute right-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
            >
              Fermer
            </button>
            <img
              src={detailImage}
              alt="Facture"
              className="max-h-[90vh] w-auto max-w-[90vw] object-contain"
            />
          </div>,
          document.body
        )}
    </section>
  );
}
