'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

export type PartenaireRow = {
  id: string;
  externalBusinessId?: string | null;
  externalOwnerUserId?: string | null;
  businessName: string;
  statut?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  solde: number;
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
}: {
  payload: JwtPayload;
  partenaires: PartenaireRow[];
}) {
  const [search, setSearch] = useState("");

  const filteredPartners = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return partenaires;
    return partenaires.filter((partner) => {
      const haystack = `${partner.businessName} ${partner.externalBusinessId ?? ""} ${partner.externalOwnerUserId ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [partenaires, search]);

  return (
    <DashboardShell payload={payload} title="Gestion des partenaires" subtitle="Partenaires">
      <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Liste des partenaires</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cliquez sur un business pour ouvrir sa page commandes.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Rechercher partenaire"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-72 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <span className="text-sm text-slate-500">
              {filteredPartners.length} partenaire{filteredPartners.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Partenaire</th>
                <th className="px-6 py-3 font-semibold">External business ID</th>
                <th className="px-6 py-3 font-semibold">Owner</th>
                <th className="px-6 py-3 font-semibold">Statut</th>
                <th className="px-6 py-3 font-semibold">Creation</th>
                <th className="px-6 py-3 font-semibold text-right">Solde</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{partner.businessName}</td>
                  <td className="px-6 py-4 text-slate-700">{partner.externalBusinessId ?? "-"}</td>
                  <td className="px-6 py-4 text-slate-700">{partner.externalOwnerUserId ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {partner.statut ?? "ACTIF"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(partner.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-semibold ${partner.solde >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {Math.abs(partner.solde).toFixed(3)} TND
                    </div>
                    <div className="text-xs text-slate-500">
                      {partner.solde > 0
                        ? "Societe doit partenaire"
                        : partner.solde < 0
                          ? "Partenaire doit societe"
                          : "Equilibre"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/partenaires/${partner.id}`}
                      className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Voir commandes
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredPartners.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>
                    Aucun partenaire a afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
