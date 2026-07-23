"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsOverview } from "@/lib/service/analyticsAdminService";

const labels: Record<string, string> = {
  web_client: "Site client",
  web_admin: "Administration",
  mobile_client: "Application client",
  mobile_driver: "Application livreur",
  page_view: "Pages consultées",
  app_open: "Ouvertures d’application",
  login: "Connexions",
  start_checkout: "Commandes commencées",
  place_order: "Commandes validées",
  cancel_order: "Commandes annulées",
  accept_delivery: "Livraisons acceptées",
  start_delivery: "Livraisons démarrées",
  complete_delivery: "Livraisons terminées",
};

const number = new Intl.NumberFormat("fr-FR");
const percent = (value: number) => `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export function AnalyticsClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/analytics?days=${days}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Erreur de chargement");
      setData(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const cards = data ? [
    ["Visiteurs uniques", number.format(data.uniqueVisitors)],
    ["Sessions", number.format(data.sessions)],
    ["Commandes validées", number.format(data.orders)],
    ["Conversion", percent(data.conversionRate)],
    ["Abandon après démarrage", percent(data.checkoutAbandonmentRate)],
    ["Événements collectés", number.format(data.totalEvents)],
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" aria-label="Période d’analyse">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`min-w-20 rounded-md px-4 py-2 text-sm font-semibold ${days === value ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {value} jours
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Actualiser
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Chargement des statistiques…</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {data ? <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value]) => (
            <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Breakdown title="Actions suivies" values={data.eventsByName} />
          <Breakdown title="Plateformes" values={data.eventsByPlatform} />
        </div>
      </> : null}
    </div>
  );
}

function Breakdown({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {entries.length ? entries.map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between gap-4 text-sm">
              <span className="text-slate-600">{labels[key] ?? key}</span>
              <strong className="text-slate-900">{number.format(value)}</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${(value / maximum) * 100}%` }} />
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Aucune donnée sur cette période.</p>}
      </div>
    </section>
  );
}
