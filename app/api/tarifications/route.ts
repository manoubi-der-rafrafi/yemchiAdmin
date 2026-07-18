import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/utils/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleOf = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.replace(/^ROLE_/i, "").toLowerCase();
};

const requireAdmin = async () => {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  const payload = await verifyJwt(token, secret);
  return payload && roleOf(payload) === "admin" ? token : null;
};

const backendUrl = () => (process.env.AUTH_API_URL || "http://localhost:8081").replace(/\/$/, "");

export async function GET() {
  const token = await requireAdmin();
  if (!token) return NextResponse.json({ message: "Non autorise" }, { status: 401 });

  const headers = { Authorization: `Bearer ${token}` };
  const [tarifsResponse, majorationsResponse] = await Promise.all([
    fetch(`${backendUrl()}/api/admin/tarifications/vehicules`, { headers, cache: "no-store" }),
    fetch(`${backendUrl()}/api/admin/tarifications/majorations`, { headers, cache: "no-store" }),
  ]);
  if (!tarifsResponse.ok || !majorationsResponse.ok) {
    return NextResponse.json({ message: "Chargement des tarifs impossible" }, { status: 502 });
  }
  return NextResponse.json({
    tarifs: await tarifsResponse.json(),
    majorations: await majorationsResponse.json(),
  });
}

export async function POST(request: Request) {
  const token = await requireAdmin();
  if (!token) return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  const body = await request.json();
  const resource = body?.resource === "majoration" ? "majorations" : "vehicules";
  const response = await fetch(`${backendUrl()}/api/admin/tarifications/${resource}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body?.data ?? {}),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data ?? { message: "Reponse backend invalide" }, { status: response.status });
}
