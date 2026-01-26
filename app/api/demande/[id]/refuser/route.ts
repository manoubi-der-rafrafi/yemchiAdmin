import { NextResponse } from "next/server";
import { demandeService } from "@/lib/service/demandeService";
import { mailService } from "@/lib/service/mailService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const causesRefus = body?.causesRefus ?? {};
    const updated = await demandeService.refuser(id, causesRefus);
    mailService.sendDemandeRefusee(updated).catch((error) => {
      console.error("Error while sending refuse email", error);
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error while refusing demande", error);
    return NextResponse.json(
      { message: "Erreur lors du refus" },
      { status: 500 }
    );
  }
}
