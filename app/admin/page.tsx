import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyJwt } from "@/lib/utils/jwt";

export default async function AdminPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/auth");
  }

  const payload = await verifyJwt(token, secret);

  if (!payload) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Session active</p>
            <h1 className="text-2xl font-semibold">Dashboard admin</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90">
              Se déconnecter
            </button>
          </form>
        </header>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Jeton de session</h2>
          {payload ? (
            <pre className="overflow-auto rounded-md bg-slate-900 p-4 text-sm text-slate-50">
              {JSON.stringify(payload, null, 2)}
            </pre>
          ) : (
            <p className="text-slate-600">Token non décodable.</p>
          )}
        </div>

        <div className="text-sm text-slate-600">
          <p>
            Besoin d&apos;un autre compte ?{" "}
            <Link href="/auth/register" className="text-black underline">
              Créer un compte
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
