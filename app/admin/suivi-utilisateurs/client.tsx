"use client";

import { FormEvent, useMemo, useState } from "react";

type UserOption = { id: string; label: string; email: string; role: string };
type Position = {
  id: string; latitude: number; longitude: number; accuracyMeters: number | null;
  speedMetersPerSecond: number | null; collectedAt: string;
};
type Connection = {
  id: string; connectedAt: string; lastHeartbeatAt: string; disconnectedAt: string | null;
  endReason: string | null; appType: string | null; durationSeconds: number;
};
type History = { positions: Position[]; connections: Connection[] };

const inputClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400";
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short", timeStyle: "medium",
}).format(new Date(value)) : "Session ouverte";
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
};

function RoutePreview({ positions }: { positions: Position[] }) {
  const points = useMemo(() => {
    if (!positions.length) return "";
    const latitudes = positions.map((p) => p.latitude);
    const longitudes = positions.map((p) => p.longitude);
    const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes), maxLng = Math.max(...longitudes);
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    return positions.map((p) => {
      const x = 20 + ((p.longitude - minLng) / lngRange) * 760;
      const y = 280 - ((p.latitude - minLat) / latRange) * 260;
      return `${x},${y}`;
    }).join(" ");
  }, [positions]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-slate-100">
      <svg viewBox="0 0 800 300" className="h-72 w-full" role="img" aria-label="Aperçu du parcours">
        <path d="M0 70h800M0 150h800M0 230h800M160 0v300M320 0v300M480 0v300M640 0v300" stroke="#cbd5e1" strokeWidth="1" opacity=".55" />
        {points ? <polyline points={points} fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      <p className="border-t border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-500">
        Aperçu relatif du trajet. Les coordonnées exactes figurent dans le tableau.
      </p>
    </div>
  );
}

export function TrackingClient({ users }: { users: UserOption[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [history, setHistory] = useState<History>({ positions: [], connections: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!userId) return;
    setLoading(true); setError("");
    const query = new URLSearchParams({ userId });
    if (from) query.set("from", new Date(from).toISOString());
    if (to) query.set("to", new Date(to).toISOString());
    try {
      const response = await fetch(`/api/tracking?${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erreur de chargement");
      setHistory(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur de chargement");
    } finally { setLoading(false); }
  };

  const totalSeconds = history.connections.reduce((sum, item) => sum + item.durationSeconds, 0);
  return (
    <div className="space-y-6">
      <form onSubmit={load} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]">
        <select className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
          {users.map((user) => <option key={user.id} value={user.id}>{user.label} — {user.role} — {user.email}</option>)}
        </select>
        <input className={inputClass} type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Date de début" />
        <input className={inputClass} type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Date de fin" />
        <button disabled={loading || !userId} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Chargement…" : "Rechercher"}
        </button>
      </form>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {[['Positions', history.positions.length], ['Sessions', history.connections.length], ['Temps connecté', formatDuration(totalSeconds)]].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Parcours de l’utilisateur</h2>
        <RoutePreview positions={history.positions} />
        <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-slate-600"><tr>
            <th className="p-3">Date</th><th className="p-3">Latitude</th><th className="p-3">Longitude</th><th className="p-3">Précision</th>
          </tr></thead><tbody>{history.positions.slice().reverse().map((p) => <tr key={p.id} className="border-t border-slate-100">
            <td className="p-3">{formatDate(p.collectedAt)}</td><td className="p-3 font-mono">{p.latitude.toFixed(6)}</td>
            <td className="p-3 font-mono">{p.longitude.toFixed(6)}</td><td className="p-3">{p.accuracyMeters == null ? "—" : `${p.accuracyMeters.toFixed(1)} m`}</td>
          </tr>)}</tbody></table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Historique des connexions</h2>
        <div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>
          <th className="p-3">Connexion</th><th className="p-3">Déconnexion</th><th className="p-3">Durée</th><th className="p-3">Fin</th>
        </tr></thead><tbody>{history.connections.map((session) => <tr key={session.id} className="border-t border-slate-100">
          <td className="p-3">{formatDate(session.connectedAt)}</td><td className="p-3">{formatDate(session.disconnectedAt)}</td>
          <td className="p-3">{formatDuration(session.durationSeconds)}</td><td className="p-3">{session.endReason ?? "EN LIGNE"}</td>
        </tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
