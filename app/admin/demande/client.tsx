'use client';

import { useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

type DemandeStatus = "non traiter" | "accepter" | "refuser";

type DemandeRow = {
  id: string;
  nom: string;
  prenom: string;
  numero: string;
  typeVehicule: string;
  dateDemande?: string;
  dateReponse?: string | null;
  reponse: DemandeStatus;
  dossierPhysique?: boolean;
  causesRefus?: Record<string, string[]>;
  imageCarteIdentiteFace: string;
  imageCarteIdentiteArriere: string;
  imagePermis: string;
  imageCarteGrise: string;
  imageAssurance: string;
};

const statusFilters: { key: DemandeStatus; label: string }[] = [
  { key: "non traiter", label: "Non traitees" },
  { key: "accepter", label: "Acceptees" },
  { key: "refuser", label: "Refusees" },
];

const badgeClass: Record<DemandeStatus, string> = {
  "non traiter": "border-amber-200 bg-amber-50 text-amber-800",
  accepter: "border-emerald-200 bg-emerald-50 text-emerald-700",
  refuser: "border-rose-200 bg-rose-50 text-rose-700",
};

const refuseReasonsCatalog: Record<string, { id: string; label: string }[]> = {
  "Carte d'identite": [
    { id: "id_document_invalide", label: "Document invalide" },
    { id: "id_image_floue", label: "Image floue, illisible ou coupee" },
    { id: "id_nom_prenom", label: "Nom/prenom ne correspondent pas aux champs nom/prenom" },
  ],
  "Permis de conduire": [
    { id: "permis_document_invalide", label: "Document invalide" },
    { id: "permis_image_floue", label: "Image floue, illisible ou coupee" },
    { id: "permis_categorie_incompatible", label: "Categorie du permis incompatible avec typeVehicule" },
  ],
  "Carte grise": [
    { id: "cg_nom_demandeur", label: "Vehicule non enregistre au nom du demandeur" },
    { id: "cg_type_diff", label: "Type de vehicule different de typeVehicule" },
    { id: "cg_image_floue", label: "Image floue, illisible ou coupee" },
  ],
  Assurance: [
    { id: "assurance_non_valide", label: "Assurance non valide" },
    { id: "assurance_expiree", label: "Assurance expiree" },
    { id: "assurance_non_couvert", label: "Vehicule non couvert" },
    { id: "assurance_nom_diff", label: "Nom different de celui du demandeur" },
    { id: "assurance_attestation_illisible", label: "Attestation illisible" },
  ],
};

const buildCausesRefus = (selectedIds: string[]) => {
  const result: Record<string, string[]> = {};
  Object.entries(refuseReasonsCatalog).forEach(([category, reasons]) => {
    const labels = reasons
      .filter((reason) => selectedIds.includes(reason.id))
      .map((reason) => reason.label);
    if (labels.length) result[category] = labels;
  });
  return result;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export function DemandePageContent({
  payload,
  demandes,
}: {
  payload: JwtPayload;
  demandes: DemandeRow[];
}) {
  const [statusFilter, setStatusFilter] = useState<DemandeStatus>("non traiter");
  const [items, setItems] = useState<DemandeRow[]>(demandes);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [depotLoadingId, setDepotLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DemandeRow | null>(null);
  const [refuseReasons, setRefuseReasons] = useState<string[]>([]);
  const [refuseError, setRefuseError] = useState<string | null>(null);
  const [showRefuseReasons, setShowRefuseReasons] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchNumero, setSearchNumero] = useState("");

  const filteredDemandes = useMemo(
    () =>
      items.filter((d) => {
        if (d.reponse !== statusFilter) return false;
        const fullName = `${d.nom ?? ""} ${d.prenom ?? ""}`.toLowerCase();
        const numero = (d.numero ?? "").toLowerCase();
        const nameMatch = searchName.trim()
          ? fullName.includes(searchName.trim().toLowerCase())
          : true;
        const numeroMatch = searchNumero.trim()
          ? numero.includes(searchNumero.trim().toLowerCase())
          : true;
        return nameMatch && numeroMatch;
      }),
    [statusFilter, items, searchName, searchNumero]
  );

  const updateStatus = async (demande: DemandeRow, status: DemandeStatus) => {
    if (status === "refuser" && refuseReasons.length === 0) {
      setRefuseError("Veuillez choisir au moins une cause de refus.");
      return;
    }
    try {
      setLoadingId(demande.id);
      const url = `/api/demande/${demande.id}/${status === "accepter" ? "accepter" : "refuser"}`;
      const options: RequestInit = { method: "POST" };
      if (status === "refuser") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ causesRefus: buildCausesRefus(refuseReasons) });
      }
      await fetch(url, options);
      setItems((prev) =>
        prev.map((d) => (d.id === demande.id ? { ...d, reponse: status, dateReponse: new Date().toISOString() } : d))
      );
      setSelected(null);
      setRefuseReasons([]);
      setRefuseError(null);
      setShowRefuseReasons(false);
    } catch (error) {
      console.error("Erreur lors de la mise a jour de la demande", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDepotPhysique = async (demande: DemandeRow) => {
    try {
      setDepotLoadingId(demande.id);
      const response = await fetch(`/api/demande/${demande.id}/deposer`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Erreur lors du depot physique");
      }
      setItems((prev) => prev.filter((d) => d.id !== demande.id));
      setSelected(null);
    } catch (error) {
      console.error("Erreur lors du depot physique", error);
    } finally {
      setDepotLoadingId(null);
    }
  };

  return (
    <DashboardShell payload={payload} title="Gestion des demandes" subtitle="Demande">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex gap-2">
            {statusFilters.map(({ key, label }) => {
              const active = key === statusFilter;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_8px_24px_rgba(14,165,233,0.16)]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-1 flex-wrap gap-2 justify-end">
            <input
              type="text"
              placeholder="Rechercher par nom/prenom"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="h-10 w-full max-w-xs rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="text"
              placeholder="Rechercher par numero"
              value={searchNumero}
              onChange={(e) => setSearchNumero(e.target.value)}
              className="h-10 w-full max-w-xs rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <span className="text-sm text-slate-500">
            {filteredDemandes.length} demande{filteredDemandes.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[780px] w-full text-sm">
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Demandeur</th>
                <th className="px-6 py-3 font-semibold">Numero</th>
                <th className="px-6 py-3 font-semibold">Type vehicule</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDemandes.map((demande) => (
                <tr key={demande.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {demande.nom} <span className="font-normal text-slate-500">{demande.prenom}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{demande.numero}</td>
                  <td className="px-6 py-4 text-slate-700">{demande.typeVehicule}</td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(demande.dateDemande)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-end gap-2">
                      {statusFilter !== "non traiter" && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                          onClick={() => setSelected(demande)}
                          className="rounded-full bg-sky-500/90 px-3 py-1.5 text-white text-xs font-semibold hover:bg-sky-600 transition-colors"
                        >
                          Documents
                        </button>
                        </div>
                      )}
                      {statusFilter === "non traiter" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(demande);
                            setRefuseReasons([]);
                            setRefuseError(null);
                            setShowRefuseReasons(false);
                          }}
                          className="rounded-full bg-sky-500/90 px-3 py-1.5 text-white text-xs font-semibold hover:bg-sky-600 transition-colors"
                        >
                          Documents
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDemandes.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={6}>
                    Aucune demande pour ce statut pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Documents</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selected.nom} {selected.prenom}
                  </p>
                  <p className="text-sm text-slate-500">{selected.numero}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 overflow-y-auto pr-1 max-h-[calc(90vh-120px)]">
                {[
                  { label: "Carte identite (face)", url: selected.imageCarteIdentiteFace },
                  { label: "Carte identite (arriere)", url: selected.imageCarteIdentiteArriere },
                  { label: "Permis", url: selected.imagePermis },
                  { label: "Carte grise", url: selected.imageCarteGrise },
                  { label: "Assurance", url: selected.imageAssurance },
                ].map((doc) => (
                  <div key={doc.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{doc.label}</p>
                    <div className="relative overflow-hidden rounded-lg bg-slate-200 aspect-[4/3] max-h-56">
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))}
                {selected.reponse === "non traiter" && showRefuseReasons && (
                  <div className="sm:col-span-2 space-y-4 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Causes du refus
                      </p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                        {Object.entries(refuseReasonsCatalog).map(([category, reasons]) => (
                          <div key={category} className="space-y-2">
                            <p className="font-semibold text-slate-900">{category}</p>
                            {reasons.map((reason) => (
                              <label key={reason.id} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={refuseReasons.includes(reason.id)}
                                  onChange={(e) =>
                                    setRefuseReasons((prev) =>
                                      e.target.checked
                                        ? [...prev, reason.id]
                                        : prev.filter((item) => item !== reason.id)
                                    )
                                  }
                                />
                                <span>{reason.label}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                      {refuseError && (
                        <p className="mt-3 text-xs font-semibold text-rose-600">{refuseError}</p>
                      )}
                    </div>
                  </div>
                )}
                {selected.reponse === "refuser" && (
                  <div className="sm:col-span-2 space-y-3 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Causes du refus
                      </p>
                      {selected.causesRefus && Object.keys(selected.causesRefus).length > 0 ? (
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                          {Object.entries(selected.causesRefus).map(([category, reasons]) => (
                            <div key={category} className="space-y-1">
                              <p className="font-semibold text-slate-900">{category}</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {reasons.map((reason, index) => (
                                  <li key={`${category}-${index}`}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">Aucune cause enregistree.</p>
                      )}
                    </div>
                  </div>
                )}
                {selected.reponse === "non traiter" && (
                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRefuseReasons(false);
                        setRefuseReasons([]);
                        setRefuseError(null);
                        updateStatus(selected, "accepter");
                      }}
                      className="rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                      disabled={loadingId === selected.id}
                    >
                      {loadingId === selected.id ? "..." : "Accepter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showRefuseReasons) {
                          setShowRefuseReasons(true);
                          setRefuseError(null);
                          return;
                        }
                        updateStatus(selected, "refuser");
                      }}
                      className="rounded-full bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition-colors disabled:opacity-60"
                      disabled={loadingId === selected.id}
                    >
                      {loadingId === selected.id ? "..." : "Refuser"}
                    </button>
                  </div>
                )}
                {selected.reponse === "accepter" && (
                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleDepotPhysique(selected)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      disabled={depotLoadingId === selected.id}
                    >
                      {depotLoadingId === selected.id ? "..." : "Dossier physique depose"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
