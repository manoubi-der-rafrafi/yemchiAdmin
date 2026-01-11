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

    if (!statut) {
      return NextResponse.json({ message: "Statut requis" }, { status: 400 });
    }

    const updated = await commandeService.update(id, { statut });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while updating commande statut", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise a jour du statut" },
      { status: 500 }
    );
  }
}
