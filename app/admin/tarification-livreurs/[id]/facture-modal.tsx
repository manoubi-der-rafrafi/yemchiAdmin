'use client';

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FactureModalProps = {
  label: string;
  variant: "encaissement" | "decaissement";
  livreurId: string;
  onCreated?: (facture: {
    _id?: unknown;
    dateTimle: string;
    montant: number;
    type: string;
    image?: string | null;
    confirmer?: string | null;
  }) => void;
};

export function FactureModal({ label, variant, livreurId, onCreated }: FactureModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [montant, setMontant] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClass =
    "inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold transition-colors";
  const variantClass =
    variant === "encaissement"
      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${baseClass} ${variantClass}`}>
        {label}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">{label}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!montant || !imageFile) {
                  setError("Veuillez remplir le montant et l'image.");
                  return;
                }
                setError(null);
                setIsSaving(true);
                try {
                  const nowIso = new Date().toISOString();
                  const factureType =
                    variant === "encaissement"
                      ? "LIVREUR_VERSE_ENTREPRISE"
                      : "ENTREPRISE_VERSE_LIVREUR";
                  const formData = new FormData();
                  formData.append("montant", String(Number(montant)));
                  formData.append("id_livreur", livreurId);
                  formData.append("dateTimle", nowIso);
                  formData.append("type", factureType);
                  formData.append("confirmer", "ACCEPTER");
                  formData.append("image", imageFile);
                  const response = await fetch("/api/facture", {
                    method: "POST",
                    body: formData,
                  });
                  if (!response.ok) {
                    throw new Error("Erreur lors de l'enregistrement.");
                  }
                  let created: any = null;
                  try {
                    created = await response.json();
                  } catch {
                    created = null;
                  }
                  onCreated?.({
                    _id: created?._id,
                    dateTimle: created?.dateTimle ?? nowIso,
                    montant: Number(montant),
                    type: created?.type ?? factureType,
                    image: created?.image ?? null,
                    confirmer: created?.confirmer ?? "ACCEPTER",
                  });
                  setMontant("");
                  setImageFile(null);
                  setOpen(false);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
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
                <label className="text-xs font-semibold text-slate-600">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
