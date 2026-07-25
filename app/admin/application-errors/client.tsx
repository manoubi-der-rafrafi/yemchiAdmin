"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApplicationErrorItem, ApplicationErrorList } from "@/lib/service/applicationErrorAdminService";

const sources: Record<string, string> = {
  web_client: "Site client",
  web_admin: "Administration",
  mobile_client: "Application client",
  mobile_driver: "Application livreur",
  backend: "Serveur",
};

const severities: Record<string, { label: string; className: string }> = {
  info: { label: "Info", className: "bg-sky-50 text-sky-700" },
  warning: { label: "Attention", className: "bg-amber-50 text-amber-800" },
  error: { label: "Erreur", className: "bg-red-50 text-red-700" },
  critical: { label: "Critique", className: "bg-red-700 text-white" },
};

const emptyResult: ApplicationErrorList = { items: [], page: 0, size: 25, total: 0, pages: 1 };

export function ApplicationErrorsClient() {
  const [data, setData] = useState<ApplicationErrorList>(emptyResult);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ApplicationErrorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), size: "25" });
    if (source) params.set("source", source);
    if (severity) params.set("severity", severity);
    if (query) params.set("search", query);
    try {
      const response = await fetch(`/api/application-errors?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Erreur de chargement");
      setData(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, query, severity, source]);

  useEffect(() => { void load(); }, [load]);

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-5">
        <form onSubmit={applySearch} className="flex min-w-64 flex-1 gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Message, utilisateur ou endpoint"
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            Rechercher
          </button>
        </form>
        <FilterSelect label="Plateforme" value={source} onChange={(value) => { setSource(value); setPage(0); }}>
          <option value="">Toutes</option>
          {Object.entries(sources).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FilterSelect>
        <FilterSelect label="Gravite" value={severity} onChange={(value) => { setSeverity(value); setPage(0); }}>
          <option value="">Toutes</option>
          {Object.entries(severities).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </FilterSelect>
        <button type="button" onClick={() => void load()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Actualiser
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{data.total.toLocaleString("fr-FR")} erreur{data.total > 1 ? "s" : ""}</span>
        {loading ? <span>Chargement...</span> : null}
      </div>
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto border-y border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Gravite</th>
              <th className="px-4 py-3 font-semibold">Plateforme</th>
              <th className="px-4 py-3 font-semibold">Erreur</th>
              <th className="px-4 py-3 font-semibold">Utilisateur</th>
              <th className="px-4 py-3 font-semibold">HTTP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((item) => {
              const severityStyle = severities[item.severity] ?? severities.error;
              return (
                <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-sky-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${severityStyle.className}`}>{severityStyle.label}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{sources[item.source] ?? item.source}</td>
                  <td className="max-w-md px-4 py-3">
                    <p className="truncate font-medium text-slate-900" title={item.message}>{item.message}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.type}{item.endpoint ? ` - ${item.endpoint}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.userName || item.userEmail || item.userId || "Anonyme"}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{item.httpStatus ?? "-"}</td>
                </tr>
              );
            })}
            {!loading && !data.items.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Aucune erreur trouvee.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">
          Precedent
        </button>
        <span className="text-sm text-slate-600">Page {page + 1} / {data.pages}</span>
        <button type="button" disabled={page + 1 >= data.pages} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">
          Suivant
        </button>
      </div>

      {selected ? <ErrorDetails item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700">
        {children}
      </select>
    </label>
  );
}

function ErrorDetails({ item, onClose }: { item: ApplicationErrorItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fermer" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm text-slate-500">{formatDate(item.createdAt)}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{item.type}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" title="Fermer" className="h-9 w-9 rounded-md border border-slate-200 text-xl text-slate-600">x</button>
        </div>
        <dl className="grid gap-4 py-5 sm:grid-cols-2">
          <Detail label="Plateforme" value={sources[item.source] ?? item.source} />
          <Detail label="Utilisateur" value={item.userName || item.userEmail || item.userId || "Anonyme"} />
          <Detail label="Page" value={item.page} />
          <Detail label="Endpoint" value={item.endpoint} />
          <Detail label="Statut HTTP" value={item.httpStatus?.toString()} />
          <Detail label="Appareil" value={item.deviceType} />
          <Detail label="Version" value={item.appVersion} />
          <Detail label="Role" value={item.role} />
        </dl>
        <DetailBlock label="Message" value={item.message} />
        <DetailBlock label="Pile technique" value={item.stackTrace} mono />
        {item.metadata && Object.keys(item.metadata).length ? (
          <DetailBlock label="Metadonnees securisees" value={JSON.stringify(item.metadata, null, 2)} mono />
        ) : null}
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{value || "-"}</dd></div>;
}

function DetailBlock({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <section className="border-t border-slate-200 py-5">
      <h3 className="text-xs font-semibold uppercase text-slate-400">{label}</h3>
      <pre className={`mt-2 whitespace-pre-wrap break-words text-sm text-slate-800 ${mono ? "font-mono" : "font-sans"}`}>{value}</pre>
    </section>
  );
}

const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "medium",
}).format(new Date(value));
