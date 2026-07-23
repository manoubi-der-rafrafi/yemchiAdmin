import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { tarificationAdminService } from "@/lib/service/tarificationAdminService";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleOf = (payload: JwtPayload) => {
  const role = payload.role || payload.roles?.[0] || payload.authorities?.[0];
  return role?.replace(/^ROLE_/i, "").toLowerCase();
};

const requireAdmin = async () => {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  const payload = await verifyJwt(token, secret);
  return payload && roleOf(payload) === "admin" ? payload : null;
};

const numericValue = (value: unknown) => {
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }
  return Number(value ?? 0);
};

const isoValue = (value: unknown) =>
  value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : null;

const serializeTarif = (document: any) => {
  const tarif = document.toObject ? document.toObject() : document;
  return {
    id: tarif._id.toString(),
    typeVehicule: tarif.typeVehicule,
    dateDebut: isoValue(tarif.dateDebut),
    dateFin: isoValue(tarif.dateFin),
    prixCommencement: numericValue(tarif.prixCommencement),
    prixCommencementLivreur: numericValue(tarif.prixCommencementLivreur),
    prixCommencementSociete: numericValue(tarif.prixCommencementSociete),
    prixParKilometre: numericValue(tarif.prixParKilometre),
    prixParKilometreLivreur: numericValue(tarif.prixParKilometreLivreur),
    prixParKilometreSociete: numericValue(tarif.prixParKilometreSociete),
    createdAt: isoValue(tarif.createdAt),
    createdByAdminId: tarif.createdByAdminId,
  };
};

const serializeMajoration = (document: any) => {
  const majoration = document.toObject ? document.toObject() : document;
  return {
    id: majoration._id.toString(),
    pourcentageAjout: numericValue(majoration.pourcentageAjout),
    dateDebut: isoValue(majoration.dateDebut),
    dateFin: isoValue(majoration.dateFin),
    descriptionCause: majoration.descriptionCause,
    createdAt: isoValue(majoration.createdAt),
    createdByAdminId: majoration.createdByAdminId,
  };
};

const errorResponse = (error: unknown) => {
  console.error("Tarification admin error", error);
  const message = error instanceof Error ? error.message : "Operation impossible";
  return NextResponse.json({ message }, { status: 400 });
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Non autorise" }, { status: 401 });

  try {
    const [tarifs, majorations] = await Promise.all([
      tarificationAdminService.listTarifs(),
      tarificationAdminService.listMajorations(),
    ]);
    return NextResponse.json({
      tarifs: tarifs.map(serializeTarif),
      majorations: majorations.map(serializeMajoration),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const adminId = admin.sub || admin.email || "admin";

    if (body?.resource === "majoration") {
      const majoration = await tarificationAdminService.createMajoration(body?.data ?? {}, adminId);
      return NextResponse.json(serializeMajoration(majoration), { status: 201 });
    }

    const tarif = await tarificationAdminService.activateTarif(
      { ...(body?.data ?? {}), dateDebut: new Date().toISOString() },
      adminId
    );
    return NextResponse.json(serializeTarif(tarif), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
