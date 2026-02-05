'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";
import { FactureHistoryTable } from "./facture-history-client";

type LivreurTarifRow = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  identifiant?: string | null;
  image?: string | null;
  valPaye: number;
};

type FactureRow = {
  _id?: unknown;
  dateTimle?: string | null;
  montant?: number | string | null;
  type?: string | null;
  confirmer?: string | null;
  livreur?: {
    nom?: string | null;
    prenom?: string | null;
    email?: string | null;
    telephone?: string | null;
    image?: string | null;
  } | null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function TarificationLivreursPageContent({
  payload,
  livreurs,
  factures,
}: {
  payload: JwtPayload;
  livreurs: LivreurTarifRow[];
  factures: FactureRow[];
}) {
  const epsilon = 0.005;
  const [identifiantQuery, setIdentifiantQuery] = useState("");
  const [soldeFilter, setSoldeFilter] = useState<"dette" | "credit" | "equilibre">("dette");
  const filteredLivreurs = useMemo(() => {
    const query = identifiantQuery.trim().toLowerCase();
    return livreurs.filter((livreur) => {
      const matchIdentifiant = query
        ? (livreur.identifiant ?? "").toLowerCase().includes(query)
        : true;
      if (!matchIdentifiant) return false;
      if (soldeFilter === "dette") return livreur.valPaye < -epsilon;
      if (soldeFilter === "credit") return livreur.valPaye > epsilon;
      return Math.abs(livreur.valPaye) <= epsilon;
    });
  }, [identifiantQuery, livreurs, soldeFilter, epsilon]);
  const acceptedFactures = useMemo(
    () => factures.filter((facture) => (facture.confirmer ?? "").toUpperCase() === "ACCEPTER"),
    [factures]
  );
  const pendingFactures = useMemo(
    () =>
      factures.filter((facture) => {
        const status = (facture.confirmer ?? "").toUpperCase();
        return status !== "ACCEPTER" && status !== "REFUSER";
      }),
    [factures]
  );

  return (
    <DashboardShell payload={payload} title="Gestion financière" subtitle="Tarification livreurs">
      <div className="grid gap-6">

        <section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "dette", label: "Dette" },
                { key: "credit", label: "Credit" },
                { key: "equilibre", label: "Equilibre" },
              ].map((option) => {
                const active = soldeFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSoldeFilter(option.key as typeof soldeFilter)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
              <span className="ml-2 text-xs text-slate-500">
                {filteredLivreurs.length} livreur{filteredLivreurs.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={identifiantQuery}
                onChange={(event) => setIdentifiantQuery(event.target.value)}
                placeholder="Recherche identifiant"
                className="h-8 w-52 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
              {identifiantQuery && (
                <button
                  type="button"
                  onClick={() => setIdentifiantQuery("")}
                  className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ minWidth: 780 }}>
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Livreur</th>
                <th className="px-4 py-2 font-semibold">Identifiant</th>
                {soldeFilter !== "equilibre" && (
                  <th className="px-4 py-2 font-semibold text-right">
                    {soldeFilter === "dette" ? "Dette" : "Credit"}
                  </th>
                )}
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLivreurs.map((livreur) => (
                <tr key={livreur.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-[11px] text-slate-500">
                        {livreur.image ? (
                          <img src={livreur.image} alt="Livreur" className="h-full w-full object-cover" />
                        ) : (
                          <span>{livreur.nom.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div>{`${livreur.nom} ${livreur.prenom}`}</div>
                        <div className="text-[11px] font-normal text-slate-500">{livreur.email}</div>
                        <div className="text-[11px] font-normal text-slate-500">{livreur.telephone ?? "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{livreur.identifiant ?? "-"}</td>
                  {soldeFilter !== "equilibre" && (
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {soldeFilter === "dette"
                        ? `${formatMoney(Math.abs(livreur.valPaye))} DT`
                        : `${formatMoney(livreur.valPaye)} DT`}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/tarification-livreurs/${livreur.id}`}
                      className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredLivreurs.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={soldeFilter === "equilibre" ? 3 : 4}>
                    Aucun livreur a afficher pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

        <FactureHistoryTable
          factures={acceptedFactures}
          title="Factures acceptees"
          subtitle="Factures confirmees (confirmer = ACCEPTER)."
        />
        <FactureHistoryTable
          factures={pendingFactures}
          title="Factures non traitees"
          subtitle="Factures en attente de traitement."
          allowDecision
        />
      </div>
    </DashboardShell>
  );
}
