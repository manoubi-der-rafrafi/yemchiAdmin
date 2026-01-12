'use client';

import { useMemo, useState } from "react";
import type { JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "../dashboard/shell";

type ContactRow = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  createdAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function ContactsPageContent({
  payload,
  contacts,
}: {
  payload: JwtPayload;
  contacts: ContactRow[];
}) {
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<ContactRow | null>(null);

  const filteredContacts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((c) => {
      const haystack = `${c.nom} ${c.email} ${c.telephone}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [contacts, searchText]);

  return (
    <DashboardShell payload={payload} title="Gestion des contacts" subtitle="Contacts">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-sm shadow-[0_18px_60px_rgba(14,165,233,0.08)]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <input
            type="text"
            placeholder="Rechercher par nom, email, telephone"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 w-full max-w-sm rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
          <span className="ml-auto text-sm text-slate-500">
            {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="border-t border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Nom</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Telephone</th>
                <th className="px-6 py-3 font-semibold">Message</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{contact.nom}</td>
                  <td className="px-6 py-4 text-slate-700">{contact.email}</td>
                  <td className="px-6 py-4 text-slate-700">{contact.telephone}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <span className="line-clamp-2 max-w-sm block">{contact.message}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(contact.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(contact)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={6}>
                    Aucun contact pour le moment.
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
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p>
                  <p className="text-lg font-semibold text-slate-900">{selected.nom}</p>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
              <div className="px-6 py-5 space-y-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Telephone</span>
                  <span>{selected.telephone}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
                  <span>{formatDate(selected.createdAt)}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">{selected.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
