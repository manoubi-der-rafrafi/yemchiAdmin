import { NextResponse } from "next/server";
import { contactService } from "@/lib/service/contactService";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:4200", // or your frontend URL
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, email, telephone, message } = body ?? {};

    if (!nom || !email || !telephone || !message) {
      return NextResponse.json(
        { message: "Champs requis : nom, email, telephone, message" },
        { status: 400, headers: CORS_HEADERS  }
      );
    }

    const created = await contactService.create({
      nom,
      email,
      telephone,
      message,
    });

    return NextResponse.json(created, { status: 201, headers: CORS_HEADERS  });
  } catch (error) {
    console.error("Error while creating contact", error);
    return NextResponse.json(
      { message: "Erreur lors de l'envoi du contact" },
      { status: 500 , headers: CORS_HEADERS }
    );
  }
}
