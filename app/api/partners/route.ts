import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { partenaireService } from "@/lib/service/partenaireService";
import { verifyJwt } from "@/lib/utils/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const requireAdmin = async () => {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  const payload = await verifyJwt(token, secret);
  return payload && extractRole(payload) === "admin" ? { token, payload } : null;
};

const serializePartner = (partner: any) => ({
  id: partner._id?.toString?.() ?? partner.id?.toString?.() ?? String(partner._id ?? partner.id),
  externalBusinessId: partner.externalBusinessId ?? null,
  externalOwnerUserId: partner.externalOwnerUserId ?? null,
  businessName: partner.businessName,
  statut: partner.statut ?? "ACTIF",
  createdAt:
    partner.createdAt instanceof Date
      ? partner.createdAt.toISOString()
      : partner.createdAt
        ? String(partner.createdAt)
        : null,
  updatedAt:
    partner.updatedAt instanceof Date
      ? partner.updatedAt.toISOString()
      : partner.updatedAt
        ? String(partner.updatedAt)
        : null,
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Non autorise" }, { status: 401 });
    }

    const partners = await partenaireService.list();
    return NextResponse.json({ partners: partners.map(serializePartner) });
  } catch (error) {
    console.error("Error while listing partners", error);
    return NextResponse.json(
      { message: "Erreur lors du chargement des partenaires" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const externalBusinessId = (body?.externalBusinessId as string | undefined)?.trim();
    const externalOwnerUserId = (body?.externalOwnerUserId as string | undefined)?.trim();
    const businessName = (body?.businessName as string | undefined)?.trim();
    const scopes = Array.isArray(body?.scopes)
      ? body.scopes.filter((scope: unknown) => typeof scope === "string" && scope.trim()).map((scope: string) => scope.trim())
      : undefined;

    if (!externalBusinessId || !businessName) {
      return NextResponse.json(
        { message: "Identifiant externe et nom partenaire requis" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.AUTH_API_URL || "http://localhost:8081";
    const internalSecret =
      process.env.INTERNAL_PROVISIONING_SECRET ||
      process.env.PARTNER_PROVISIONING_SECRET ||
      "transport-static-secret";

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/internal/partners/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        externalBusinessId,
        externalOwnerUserId: externalOwnerUserId || null,
        businessName,
        scopes,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || "Creation partenaire echouee" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error while creating partner", error);
    return NextResponse.json(
      { message: "Erreur lors de la creation du partenaire" },
      { status: 500 }
    );
  }
}
