'use client';

import { FormEvent, useMemo, useState } from "react";
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
};

type ProvisionResponse = {
  partnerId: string;
  externalBusinessId: string;
  businessName: string;
  keyPrefix: string;
  apiKey: string;
};

const defaultScopes = ["delivery:create", "driver:read", "tracking:read"];

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
  const [items, setItems] = useState<PartenaireRow[]>(partenaires);
  const [search, setSearch] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [externalBusinessId, setExternalBusinessId] = useState("");
  const [externalOwnerUserId, setExternalOwnerUserId] = useState("");
  const [scopesText, setScopesText] = useState(defaultScopes.join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisioned, setProvisioned] = useState<ProvisionResponse | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((partner) => {
      const haystack = `${partner.businessName} ${partner.externalBusinessId ?? ""} ${partner.externalOwnerUserId ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setProvisioned(null);

    try {
      const scopes = scopesText
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);

      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          externalBusinessId,
          externalOwnerUserId,
          scopes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Creation partenaire echouee");
      }

      const created = data as ProvisionResponse;
      setProvisioned(created);
      setItems((current) => [
        {
          id: created.partnerId,
          externalBusinessId: created.externalBusinessId,
          externalOwnerUserId: externalOwnerUserId || null,
          businessName: created.businessName,
          statut: "ACTIF",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setBusinessName("");
      setExternalBusinessId("");
      setExternalOwnerUserId("");
      setScopesText(defaultScopes.join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = async () => {
    if (!provisioned?.apiKey) return;
    await navigator.clipboard?.writeText(provisioned.apiKey);
  };

  return (
    <DashboardShell payload={payload} title="Gestion des partenaires" subtitle="Partenaires">
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900">Nouveau partenaire</p>
            <p className="text-xs text-slate-500">La cle API est affichee uniquement apres creation.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">
              Nom business
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              External business ID
              <input
                type="text"
                value={externalBusinessId}
                onChange={(e) => setExternalBusinessId(e.target.value)}
                required
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              External owner user ID
              <input
                type="text"
                value={externalOwnerUserId}
                onChange={(e) => setExternalOwnerUserId(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Scopes
              <textarea
                value={scopesText}
                onChange={(e) => setScopesText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 h-10 w-full rounded-xl bg-gradient-to-r from-sky-600 to-orange-500 px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,165,233,0.24)] transition-all hover:from-sky-700 hover:to-orange-600 disabled:opacity-60"
          >
            {loading ? "Creation..." : "Creer partenaire"}
          </button>
        </form>

        <div className="space-y-4">
          {provisioned && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Cle API generee</p>
                  <p className="text-xs text-emerald-700">Copiez-la maintenant, elle ne sera plus visible ensuite.</p>
                </div>
                <button
                  type="button"
                  onClick={copyApiKey}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  Copier
                </button>
              </div>
              <code className="mt-3 block overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs text-slate-800">
                {provisioned.apiKey}
              </code>
            </div>
          )}

          <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3">
              <input
                type="text"
                placeholder="Rechercher partenaire"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full max-w-sm rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
              <span className="ml-auto text-xs text-slate-500">
                {filtered.length} partenaire{filtered.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-xs">
                <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Partenaire</th>
                    <th className="px-5 py-2.5 font-semibold">External business ID</th>
                    <th className="px-5 py-2.5 font-semibold">Owner</th>
                    <th className="px-5 py-2.5 font-semibold">Statut</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Creation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((partner) => (
                    <tr key={partner.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{partner.businessName}</td>
                      <td className="px-5 py-3 text-slate-700">{partner.externalBusinessId ?? "-"}</td>
                      <td className="px-5 py-3 text-slate-700">{partner.externalOwnerUserId ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {partner.statut ?? "ACTIF"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">{formatDate(partner.createdAt)}</td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-5 py-6 text-center text-slate-500" colSpan={5}>
                        Aucun partenaire a afficher.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
