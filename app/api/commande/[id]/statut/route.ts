import { NextResponse } from "next/server";
import { commandeService } from "@/lib/service/commandeService";

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

    const updateData: Record<string, unknown> = { statut };
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
