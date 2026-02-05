import { NextResponse } from "next/server";
import { factureService } from "@/lib/service/factureService";
import { FactureStatus } from "@/lib/models/facture";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const rawStatus = String(body?.confirmer ?? "");
    const confirmer = rawStatus.toUpperCase();
    const isValidStatus = Object.values(FactureStatus).includes(confirmer as FactureStatus);
    if (!id || !isValidStatus) {
      return NextResponse.json({ message: "Champs invalides." }, { status: 400 });
    }

    const update: Record<string, unknown> = { confirmer };
    if (confirmer === FactureStatus.ACCEPTER) {
      const montant = Number(body?.montant);
      const dateTimle = String(body?.dateTimle ?? "");
      if (!Number.isFinite(montant) || !dateTimle) {
        return NextResponse.json({ message: "Champs invalides." }, { status: 400 });
      }
      update.montant = montant;
      update.dateTimle = dateTimle;
    }

    const updated = await factureService.update(id, update);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error while updating facture", error);
    return NextResponse.json({ message: "Erreur lors de la mise a jour" }, { status: 500 });
  }
}
