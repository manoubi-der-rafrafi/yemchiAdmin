import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { trackingAdminService } from "@/lib/service/trackingAdminService";
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

  const params = request.nextUrl.searchParams;
  const userId = params.get("userId")?.trim();
  if (!userId) return NextResponse.json({ message: "userId requis" }, { status: 400 });

  const parseDate = (value: string | null) => value ? new Date(value) : undefined;
  try {
    const data = await trackingAdminService.history(userId, {
      from: parseDate(params.get("from")),
      to: parseDate(params.get("to")),
      limit: Number(params.get("limit") || 2000),
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Tracking admin error", error);
    return NextResponse.json({ message: "Impossible de charger l’historique" }, { status: 500 });
  }
}
