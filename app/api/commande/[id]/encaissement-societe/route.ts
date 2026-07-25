import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { commandeService } from "@/lib/service/commandeService";
import { verifyJwt } from "@/lib/utils/jwt";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const commande = await commandeService.get(id);
    if (!commande || !(commande.partenaireId || commande.externalBusinessId)) {
      return NextResponse.json({ message: "Commande B2C introuvable." }, { status: 404 });
    }
    const mode = commande.modePaiement ?? commande.mode_paiement ?? "";
    if (/^en[\s_]*ligne$/i.test(mode)) {
      return NextResponse.json(
        { message: "Cette commande a ete encaissee par le partenaire." },
        { status: 400 }
      );
    }
    const updated = await commandeService.update(id, {
      statutEncaissementSociete: "RECU",
      dateEncaissementSociete: new Date().toISOString(),
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while confirming company collection", error);
    return NextResponse.json({ message: "Mise a jour impossible." }, { status: 500 });
  }
}
