"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      setSuccess(data?.message ?? "Utilisateur existe");
      router.push("/admin/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Identifiants invalides";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Yemchi w Yji - Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Mot de passe</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-black text-white font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Pas de compte ?{" "}
            <Link href="/auth/register" className="text-black underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
