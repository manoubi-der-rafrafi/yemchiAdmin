import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/config/db";
import UtilisateurModel from "@/lib/models/utilisateur";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/utils/jwt";

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const signJwt = (payload: Record<string, unknown>, secret: string) => {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${signature}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, prenom, email, mot_de_passe, telephone } = body;

    if (!email || !mot_de_passe || !nom || !prenom) {
      return NextResponse.json(
        { message: "Champs requis : nom, prenom, email, mot_de_passe" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "JWT_SECRET manquant dans .env.local" },
        { status: 500 }
      );
    }

    await connectDB();
    const adminCount = await UtilisateurModel.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      const token = (await cookies()).get("yemchi_admin_token")?.value;
      const payload = token ? await verifyJwt(token, process.env.JWT_SECRET) : null;
      const rawRole = payload?.role || payload?.roles?.[0] || payload?.authorities?.[0];
      const currentRole = rawRole?.replace(/^ROLE_/i, "").toLowerCase();
      if (!payload || currentRole !== "admin") {
        return NextResponse.json(
          { message: "Seul un administrateur peut créer un autre administrateur" },
          { status: 403 },
        );
      }
    }

    const existing = await UtilisateurModel.findOne({ email }).exec();
    if (existing) {
      return NextResponse.json(
        { message: "Email déjà utilisé" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const newUser = new UtilisateurModel({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      motDePasse: hashedPassword, // compat avec docs existants
      telephone,
      role: "admin",
      statut: "actif",
    });

    await newUser.save();

    const userRole = newUser.role || "client";
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const token = signJwt(
      {
        sub: String(newUser._id),
        email: newUser.email,
        role: userRole,
        exp,
      },
      process.env.JWT_SECRET
    );

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      user: {
        id: newUser._id,
        email: newUser.email,
        role: userRole,
        nom: newUser.nom,
        prenom: newUser.prenom,
      },
    });

    response.cookies.set("yemchi_admin_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Echec d'inscription", error: (error as Error).message },
      { status: 500 }
    );
  }
}
