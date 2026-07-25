import { NextResponse } from "next/server";
import { commandeService } from "@/lib/service/commandeService";

const normalizeStatut = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const statut = (body?.statut as string | undefined)?.trim();
    const transporteurId = (body?.transporteurId as string | undefined)?.trim();
    const qrCodeDepart = (body?.qrCodeDepart as string | undefined)?.trim();
    const qrCodeArrivee = (body?.qrCodeArrivee as string | undefined)?.trim();

    if (!statut) {
      return NextResponse.json({ message: "Statut requis" }, { status: 400 });
    }

    const existing = await commandeService.get(id);
    if (!existing) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    const previousStatut = normalizeStatut(existing.statut);
    const nextStatut = normalizeStatut(statut);
    const updateData: Record<string, unknown> = { statut };

    if (previousStatut === "en_route" && nextStatut === "confirmer") {
      updateData.transporteurId = null;
    }

    if (previousStatut === "confirmer" && nextStatut === "en_route" && !transporteurId) {
      return NextResponse.json(
        { message: "Livreur requis pour passer la commande en route" },
        { status: 400 }
      );
    }

    if (transporteurId) updateData.transporteurId = transporteurId;
    if (qrCodeDepart) updateData.qrCodeDepart = qrCodeDepart;
    if (qrCodeArrivee) updateData.qrCodeArrivee = qrCodeArrivee;

    const updated = await commandeService.update(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while updating commande statut", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise a jour du statut" },
      { status: 500 }
    );
  }
}
