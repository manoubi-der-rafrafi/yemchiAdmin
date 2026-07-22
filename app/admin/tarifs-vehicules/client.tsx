"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

const VEHICLES = [
  "DEUX_ROUES_MOTORISES",
  "VEHICULE_PARTICULIER",
  "VEHICULE_UTILITAIRE_LEGER",
  "FOURGON_MINIBUS",
  "GROS_UTILITAIRE",
] as const;

type Tarif = {
  id: string;
  typeVehicule: string;
  dateDebut: string;
  dateFin?: string | null;
  prixCommencement: number;
  prixCommencementLivreur: number;
  prixCommencementSociete: number;
  prixParKilometre: number;
  prixParKilometreLivreur: number;
  prixParKilometreSociete: number;
};

type Majoration = {
  id: string;
  pourcentageAjout: number;
  dateDebut: string;
  dateFin: string;
  descriptionCause: string;
};

const money = (value: number) => `${Number(value || 0).toFixed(3)} DT`;
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString("fr-FR") : "Actuel";
const systemDateTimeLocal = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

export function TarifsVehiculesClient({ payload }: { payload: JwtPayload }) {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [majorations, setMajorations] = useState<Majoration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    typeVehicule: VEHICLES[0], dateDebut: "", prixCommencement: "",
    prixCommencementLivreur: "", prixParKilometre: "", prixParKilometreLivreur: "",
  });
  const [majorationForm, setMajorationForm] = useState({
    pourcentageAjout: "", dateDebut: "", dateFin: "", descriptionCause: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/tarifications", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.message || "Chargement impossible");
    else { setTarifs(data.tarifs ?? []); setMajorations(data.majorations ?? []); setError(""); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const updateSystemDate = () => {
      setForm((old) => ({ ...old, dateDebut: systemDateTimeLocal() }));
    };

    updateSystemDate();
    const intervalId = window.setInterval(updateSystemDate, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const current = useMemo(() => tarifs.filter((tarif) => !tarif.dateFin), [tarifs]);
  const history = useMemo(() => tarifs.filter((tarif) => tarif.dateFin), [tarifs]);

  async function submitTarif(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const totalStart = Number(form.prixCommencement);
    const courierStart = Number(form.prixCommencementLivreur);
    const totalKm = Number(form.prixParKilometre);
    const courierKm = Number(form.prixParKilometreLivreur);
    const data = {
      ...form,
      dateDebut: new Date().toISOString(),
      prixCommencement: totalStart,
      prixCommencementLivreur: courierStart,
      prixParKilometre: totalKm,
      prixParKilometreLivreur: courierKm,
    };
    const response = await fetch("/api/tarifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "tarif", data }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.message || "Creation impossible");
    else { setForm((old) => ({ ...old, dateDebut: systemDateTimeLocal(), prixCommencement: "", prixCommencementLivreur: "", prixParKilometre: "", prixParKilometreLivreur: "" })); await load(); }
    setSaving(false);
  }

  async function submitMajoration(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const response = await fetch("/api/tarifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "majoration", data: { ...majorationForm, pourcentageAjout: Number(majorationForm.pourcentageAjout) } }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.message || "Creation impossible");
    else { setMajorationForm({ pourcentageAjout: "", dateDebut: "", dateFin: "", descriptionCause: "" }); await load(); }
    setSaving(false);
  }

  const inputClass = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400";
  return <DashboardShell payload={payload} title="Tarifs des vehicules" subtitle="Tarifs actuels et historique">
    <div className="grid gap-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Sans tarif actif en base, le backend conserve les valeurs historiques par defaut et les partage a 50/50 entre le livreur et la societe.
      </div>
      <form onSubmit={submitTarif} className="grid gap-3 rounded-2xl bg-white/80 p-5 shadow-sm md:grid-cols-3">
        <h2 className="md:col-span-3 text-lg font-semibold">Activer un nouveau tarif</h2>
        <select className={inputClass} value={form.typeVehicule} onChange={(e) => setForm({ ...form, typeVehicule: e.target.value as typeof form.typeVehicule })}>{VEHICLES.map((v) => <option key={v}>{v}</option>)}</select>
        <input
          required
          readOnly
          type="datetime-local"
          aria-label="Date de début système"
          title="Date et heure définies automatiquement par le système"
          className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-600`}
          value={form.dateDebut}
        />
        <span />
        <input required min="0" step="0.001" type="number" placeholder="Commencement total" className={inputClass} value={form.prixCommencement} onChange={(e) => setForm({ ...form, prixCommencement: e.target.value })} />
        <input required min="0" step="0.001" type="number" placeholder="Commencement livreur" className={inputClass} value={form.prixCommencementLivreur} onChange={(e) => setForm({ ...form, prixCommencementLivreur: e.target.value })} />
        <div className="px-3 py-2 text-sm text-slate-600">Societe: {money(Number(form.prixCommencement || 0) - Number(form.prixCommencementLivreur || 0))}</div>
        <input required min="0" step="0.001" type="number" placeholder="Prix/km total" className={inputClass} value={form.prixParKilometre} onChange={(e) => setForm({ ...form, prixParKilometre: e.target.value })} />
        <input required min="0" step="0.001" type="number" placeholder="Prix/km livreur" className={inputClass} value={form.prixParKilometreLivreur} onChange={(e) => setForm({ ...form, prixParKilometreLivreur: e.target.value })} />
        <button disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Activer le tarif</button>
      </form>

      <section className="rounded-2xl bg-white/80 p-5 shadow-sm overflow-x-auto"><h2 className="mb-3 text-lg font-semibold">Tarifs actuels</h2>
        {loading ? <p>Chargement...</p> : <TarifTable rows={current} />}
      </section>
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm overflow-x-auto"><h2 className="mb-3 text-lg font-semibold">Historique</h2><TarifTable rows={history} /></section>

      <form onSubmit={submitMajoration} className="grid gap-3 rounded-2xl bg-white/80 p-5 shadow-sm md:grid-cols-4">
        <h2 className="md:col-span-4 text-lg font-semibold">Ajouter une majoration temporaire</h2>
        <input required min="0" step="0.01" type="number" placeholder="Pourcentage" className={inputClass} value={majorationForm.pourcentageAjout} onChange={(e) => setMajorationForm({ ...majorationForm, pourcentageAjout: e.target.value })} />
        <input required type="datetime-local" className={inputClass} value={majorationForm.dateDebut} onChange={(e) => setMajorationForm({ ...majorationForm, dateDebut: e.target.value })} />
        <input required type="datetime-local" className={inputClass} value={majorationForm.dateFin} onChange={(e) => setMajorationForm({ ...majorationForm, dateFin: e.target.value })} />
        <input required placeholder="Cause" className={inputClass} value={majorationForm.descriptionCause} onChange={(e) => setMajorationForm({ ...majorationForm, descriptionCause: e.target.value })} />
        <button disabled={saving} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Ajouter</button>
      </form>
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm"><h2 className="mb-3 text-lg font-semibold">Majorations</h2>
        <div className="grid gap-2">{majorations.map((m) => <div key={m.id} className="rounded-xl border border-slate-200 p-3 text-sm"><b>+{m.pourcentageAjout}%</b> — {m.descriptionCause}<div className="text-slate-500">{dateLabel(m.dateDebut)} → {dateLabel(m.dateFin)}</div></div>)}</div>
      </section>
    </div>
  </DashboardShell>;
}

function TarifTable({ rows }: { rows: Tarif[] }) {
  return <table className="min-w-[900px] w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th>Vehicule</th><th>Periode</th><th>Depart total</th><th>Depart livreur</th><th>Depart societe</th><th>Km total</th><th>Km livreur</th><th>Km societe</th></tr></thead><tbody>{rows.map((t) => <tr key={t.id} className="border-b border-slate-100"><td className="py-3 font-medium">{t.typeVehicule}</td><td>{dateLabel(t.dateDebut)} → {dateLabel(t.dateFin)}</td><td>{money(t.prixCommencement)}</td><td>{money(t.prixCommencementLivreur)}</td><td>{money(t.prixCommencementSociete)}</td><td>{money(t.prixParKilometre)}</td><td>{money(t.prixParKilometreLivreur)}</td><td>{money(t.prixParKilometreSociete)}</td></tr>)}</tbody></table>;
}
