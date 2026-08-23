'use client';

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type FactureRow = {
  _id?: unknown;
  dateTimle?: string | null;
  montant?: number | string | null;
  type?: string | null;
  image?: string | null;
  confirmer?: "NON_TRAITER" | "ACCEPTER" | "REFUSER" | null;
};

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
type DecisionStep = "initial" | "accept";

export function FactureHistoryTable({
  factures,
  title,
  subtitle,
  livreur,
  showTypeColumn = true,
  allowDecision = false,
  onDecision,
}: {
  factures: FactureRow[];
  title?: string;
  subtitle?: string;
  livreur?: {
    nom?: string | null;
    prenom?: string | null;
    email?: string | null;
    telephone?: string | null;
    image?: string | null;
  } | null;
  showTypeColumn?: boolean;
  allowDecision?: boolean;
  onDecision?: () => void;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("tous");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [detailFacture, setDetailFacture] = useState<FactureRow | null>(null);
  const [decisionStep, setDecisionStep] = useState<DecisionStep>("initial");
  const [montant, setMontant] = useState<string>("");
  const [dateValue, setDateValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<FactureRow[]>(factures);
  const pageSize = 8;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setRows(factures);
  }, [factures]);

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
    return rows.filter((facture) => {
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
  const showType = showTypeColumn && typeFilter === "tous";

  const setFilter = (value: TypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  };
  const heading = title ?? "Historique des factures";
  const description = subtitle ?? "Versements par livreur avec filtre par type et date.";

  const openDetail = (facture: FactureRow) => {
    setDetailFacture(facture);
    setDecisionStep("initial");
    setError(null);
    const initialMontant =
      typeof facture.montant === "number"
        ? String(facture.montant)
        : typeof facture.montant === "string"
          ? facture.montant
          : "";
    setMontant(initialMontant);
    setDateValue(toDateKey(facture.dateTimle) ?? "");
  };

  const closeDetail = () => {
    setDetailFacture(null);
    setDecisionStep("initial");
    setError(null);
    setIsSaving(false);
  };

  const handleDecision = async (status: "ACCEPTER" | "REFUSER") => {
    if (!detailFacture?._id) return;
    if (status === "ACCEPTER") {
      if (!montant || !Number.isFinite(Number(montant))) {
        setError("Veuillez saisir un montant valide.");
        return;
      }
      if (!dateValue) {
        setError("Veuillez saisir une date valide.");
        return;
      }
    }
    setError(null);
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = { confirmer: status };
      if (status === "ACCEPTER") {
        body.montant = Number(montant);
        body.dateTimle = new Date(dateValue).toISOString();
      }
      const response = await fetch(`/api/facture/${detailFacture._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise a jour.");
      }
      setRows((prev) => prev.filter((facture) => String(facture._id) !== String(detailFacture._id)));
      closeDetail();
      onDecision?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
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
        <table className="w-full text-[13px]" style={{ minWidth: showType ? 660 : 560 }}>
          <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Livreur</th>
              <th className="px-5 py-2.5 font-semibold">Date</th>
              {showType && <th className="px-5 py-2.5 font-semibold">Type</th>}
              <th className="px-5 py-2.5 font-semibold text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((facture) => {
              const fullName = `${livreur?.nom ?? ""} ${livreur?.prenom ?? ""}`.trim();
              return (
                <tr key={String(facture._id ?? Math.random())} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-[11px] text-slate-500">
                        {livreur?.image ? (
                          <img src={livreur.image} alt="Livreur" className="h-full w-full object-cover" />
                        ) : (
                          <span>{(livreur?.nom ?? "-").charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{fullName || "-"}</div>
                        <div className="text-[11px] text-slate-500">{livreur?.email ?? "-"}</div>
                        <div className="text-[11px] text-slate-500">{livreur?.telephone ?? "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{formatDate(facture.dateTimle)}</td>
                  {showType && <td className="px-5 py-3 text-slate-700">{typeLabel(facture.type)}</td>}
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={!facture.image}
                      onClick={() => openDetail(facture)}
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
        detailFacture?.image &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Facture</p>
                  <p className="text-sm font-semibold text-slate-900">Detail de la facture</p>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <img
                      src={detailFacture.image}
                      alt="Facture"
                      className="max-h-[70vh] w-full object-contain"
                    />
                  </div>
                  <div className="space-y-4">
                    {allowDecision ? (
                      <>
                        {decisionStep === "initial" && (
                          <p className="text-sm text-slate-600">Choisissez une action pour traiter la facture.</p>
                        )}
                        {decisionStep === "accept" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Montant</label>
                              <input
                                type="number"
                                step="0.01"
                                value={montant}
                                onChange={(event) => setMontant(event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                placeholder="0.00"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Date</label>
                              <input
                                type="date"
                                value={dateValue}
                                onChange={(event) => setDateValue(event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">Detail de la facture.</p>
                    )}
                    {error && <p className="text-xs text-rose-600">{error}</p>}
                  </div>
                </div>
              </div>
              {allowDecision && (
                <div className="border-t border-slate-100 bg-white/95 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {decisionStep === "initial" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision("REFUSER")}
                          disabled={isSaving}
                          className="w-full sm:w-auto rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Refuser
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStep("accept")}
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Accepter
                        </button>
                      </>
                    )}
                    {decisionStep === "accept" && (
                      <button
                        type="button"
                        onClick={() => handleDecision("ACCEPTER")}
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {isSaving ? "Confirmation..." : "Confirmer"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
