"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegisterPayload = {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  telephone?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterPayload>({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    telephone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof RegisterPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post("/api/auth/register", form, { withCredentials: true });
      router.push("/admin");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Inscription impossible";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-slate-600">Créer un compte</p>
          <h1 className="text-2xl font-semibold">Yemchi w Yji - Admin</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Nom</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Prénom</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
                value={form.prenom}
                onChange={(e) => handleChange("prenom", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Mot de passe</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
              value={form.mot_de_passe}
              onChange={(e) => handleChange("mot_de_passe", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Téléphone (optionnel)</label>
            <input
              type="tel"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
              value={form.telephone ?? ""}
              onChange={(e) => handleChange("telephone", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-black text-white font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Déjà un compte ?{" "}
            <Link href="/auth" className="text-black underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
