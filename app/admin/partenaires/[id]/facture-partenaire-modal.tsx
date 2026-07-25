"use client";

import { useState } from "react";

export type FacturePartenaireRow = {
  _id?: string;
  montant: number;
  dateTimle: string;
  type: "ENTREPRISE_VERSE_PARTENAIRE" | "PARTENAIRE_VERSE_ENTREPRISE";
  confirmer?: string;
};

export function FacturePartenaireModal({
  partenaireId,
  externalBusinessId,
  type,
  label,
  onCreated,
}: {
  partenaireId: string;
  externalBusinessId?: string | null;
  type: FacturePartenaireRow["type"];
  label: string;
  onCreated: (facture: FacturePartenaireRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/facture-partenaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partenaireId,
          externalBusinessId,
          montant: Number(montant),
          type,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Enregistrement impossible.");
      }
      onCreated(payload);
      setMontant("");
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">
                Fermer
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-600">
              Montant (TND)
              <input
                type="number"
                min="0.001"
                step="0.001"
                required
                value={montant}
                onChange={(event) => setMontant(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
