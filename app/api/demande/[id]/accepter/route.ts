import { NextResponse } from "next/server";
import { demandeService } from "@/lib/service/demandeService";
import { mailService } from "@/lib/service/mailService";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await demandeService.accepter(id);
    mailService.sendDemandeAcceptee(updated).catch((error) => {
      console.error("Error while sending accept email", error);
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while accepting demande", error);
    return NextResponse.json(
      { message: "Erreur lors de l'acceptation" },
      { status: 500 }
    );
  }
}
