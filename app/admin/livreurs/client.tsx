'use client';

import { useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

type LivreurRow = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  statut?: string | null;
  adresse?: string | null;
  image?: string | null;
  date_creation?: string | null;
};

export function LivreursPageContent({
  payload,
  livreurs,
}: {
  payload: JwtPayload;
  livreurs: LivreurRow[];
}) {
  const [items] = useState<LivreurRow[]>(livreurs);
  const [statusFilter, setStatusFilter] = useState<string>("Tous");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((l) => unique.add(l.statut ?? "Sans statut"));
    return ["Tous", ...Array.from(unique)];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((livreur) => {
      const statut = livreur.statut ?? "Sans statut";
      const matchStatus = statusFilter === "Tous" ? true : statut === statusFilter;
      const haystack = `${livreur.nom} ${livreur.prenom} ${livreur.email} ${livreur.telephone ?? ""}`.toLowerCase();
      const matchSearch = term ? haystack.includes(term) : true;
      return matchStatus && matchSearch;
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const changePage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
  };

  return (
    <DashboardShell payload={payload} title="Gestion des livreurs" subtitle="Livreurs">
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
              placeholder="Rechercher (nom, email, tel)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full max-w-md rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <span className="text-sm text-slate-500">
            {filtered.length} livreur{filtered.length > 1 ? "s" : ""} | Page {currentPage}/{totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 960 }}>
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Livreur</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Telephone</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
                <th className="px-6 py-3 font-semibold">Adresse</th>
                <th className="px-6 py-3 font-semibold text-right">Date creation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((livreur) => (
                <tr key={livreur.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xs text-slate-500">
                        {livreur.image ? (
                          <img src={livreur.image} alt="Livreur" className="h-full w-full object-cover" />
                        ) : (
                          <span>{livreur.nom.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div>{`${livreur.nom} ${livreur.prenom}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{livreur.email}</td>
                  <td className="px-6 py-4 text-slate-700">{livreur.telephone ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      {livreur.statut ?? "Sans statut"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{livreur.adresse ?? "-"}</td>
                  <td className="px-6 py-4 text-right text-slate-700">
                    {livreur.date_creation ?? "-"}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={6}>
                    Aucun livreur à afficher pour ces filtres.
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
    </DashboardShell>
  );
}
