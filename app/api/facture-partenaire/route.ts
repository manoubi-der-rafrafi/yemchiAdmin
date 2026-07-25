import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/utils/jwt";
import { facturePartenaireService } from "@/lib/service/facturePartenaireService";
import {
  FacturePartenaireStatus,
  FacturePartenaireType,
} from "@/lib/models/facturePartenaire";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("yemchi_admin_token")?.value;
    const secret = process.env.JWT_SECRET;
    const payload = token && secret ? await verifyJwt(token, secret) : null;
    const role = String(
      payload?.role ??
        (Array.isArray(payload?.roles) ? payload.roles[0] : "") ??
        ""
    ).toLowerCase();
    if (!payload || role !== "admin") {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }

    const body = await request.json();
    const montant = Number(body.montant);
    const partenaireId = String(body.partenaireId ?? "").trim();
    const externalBusinessId = body.externalBusinessId
      ? String(body.externalBusinessId).trim()
      : null;
    const type = body.type as FacturePartenaireType;

    if (
      !partenaireId ||
      !Number.isFinite(montant) ||
      montant <= 0 ||
      !Object.values(FacturePartenaireType).includes(type)
    ) {
      return NextResponse.json({ message: "Champs invalides." }, { status: 400 });
    }

    const created = await facturePartenaireService.create({
      partenaireId,
      externalBusinessId,
      montant,
      dateTimle: body.dateTimle || new Date().toISOString(),
      image: body.image || null,
      type,
      confirmer: FacturePartenaireStatus.ACCEPTER,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error while creating partner invoice", error);
    return NextResponse.json(
      { message: "Erreur lors de la creation de la facture partenaire." },
      { status: 500 }
    );
  }
}
