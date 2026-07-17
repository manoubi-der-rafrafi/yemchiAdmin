import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { partenaireService } from "@/lib/service/partenaireService";
import { type Partenaire } from "@/lib/models/partenaire";
import { PartenairesPageContent, type PartenaireRow } from "./client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const toIso = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export default async function AdminPartenairesPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/auth");
  }

  const payload = await verifyJwt(token, secret);
  const role = payload ? extractRole(payload) : null;

  if (!payload || role !== "admin") {
    redirect("/auth");
  }

  const partenaires = await partenaireService.list();

  const partenairesDto: PartenaireRow[] = partenaires.map((partenaire: Partenaire) => ({
    id: partenaire._id.toString(),
    externalBusinessId: partenaire.externalBusinessId ?? null,
    externalOwnerUserId: partenaire.externalOwnerUserId ?? null,
    businessName: partenaire.businessName,
    statut: partenaire.statut ?? "ACTIF",
    createdAt: toIso(partenaire.createdAt),
    updatedAt: toIso(partenaire.updatedAt),
  }));

  return <PartenairesPageContent payload={payload as JwtPayload} partenaires={partenairesDto} />;
}
