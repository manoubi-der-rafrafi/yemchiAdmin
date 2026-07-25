import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { applicationErrorAdminService } from "@/lib/service/applicationErrorAdminService";
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
    return NextResponse.json({ message: "Acces reserve a l'administrateur" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  try {
    const result = await applicationErrorAdminService.list({
      page: Number(params.get("page") || 0),
      size: Number(params.get("size") || 25),
      source: params.get("source") || undefined,
      severity: params.get("severity") || undefined,
      search: params.get("search") || undefined,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Application errors admin loading failed", error);
    return NextResponse.json({ message: "Impossible de charger les erreurs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  const payload = token && secret ? await verifyJwt(token, secret) : null;
  if (!payload || roleOf(payload) !== "admin") {
    return NextResponse.json({ message: "Acces reserve a l'administrateur" }, { status: 403 });
  }

  try {
    const input = await request.json() as Record<string, unknown>;
    await applicationErrorAdminService.collectAdmin({
      message: String(input.message || "Erreur administration"),
      type: input.type ? String(input.type) : undefined,
      page: input.page ? String(input.page) : undefined,
      stackTrace: input.stackTrace ? String(input.stackTrace) : undefined,
      userId: payload.sub ? String(payload.sub) : undefined,
      userEmail: payload.email ? String(payload.email) : undefined,
    });
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error("Application error collection failed", error);
    return new NextResponse(null, { status: 202 });
  }
}
