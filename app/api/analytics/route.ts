import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { analyticsAdminService } from "@/lib/service/analyticsAdminService";
import { verifyJwt } from "@/lib/utils/jwt";

const roleOf = (payload: Record<string, unknown>) => {
  const role = payload.role || (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return String(role ?? "").replace(/^ROLE_/i, "").toLowerCase();
};

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  const payload = token && secret ? await verifyJwt(token, secret) : null;
  if (!payload || roleOf(payload) !== "admin") {
    return NextResponse.json({ message: "Accès réservé à l’administrateur" }, { status: 403 });
  }

  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days") || 30), 1), 365);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  try {
    const overview = await analyticsAdminService.overview(from, to);
    return NextResponse.json(overview, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analytics admin error", error);
    return NextResponse.json({ message: "Impossible de charger les statistiques" }, { status: 500 });
  }
}
