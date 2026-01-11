import { NextResponse } from "next/server";
import { demandeService } from "@/lib/service/demandeService";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await demandeService.accepter(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while accepting demande", error);
    return NextResponse.json(
      { message: "Erreur lors de l'acceptation" },
      { status: 500 }
    );
  }
}
