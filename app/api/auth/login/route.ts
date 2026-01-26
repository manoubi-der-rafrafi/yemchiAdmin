import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { utilisateurService } from "@/lib/service/utilisateurService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JwtPayload = {
  sub: string;
  email: string;
  role?: string;
  exp: number;
  [key: string]: unknown;
};

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const signJwt = (payload: JwtPayload, secret: string) => {
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
    const { email, password } = await req.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim() : "";
    const providedPassword = typeof password === "string" ? password : "";

    if (!normalizedEmail || !providedPassword) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "JWT_SECRET manquant dans .env.local" },
        { status: 500 }
      );
    }

    const user = await utilisateurService.findByEmail(normalizedEmail);

    const invalidResponse = () =>
      NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });

    if (!user || (user.role || "client").toLowerCase() !== "admin") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return invalidResponse();
    }

    const hash =
      user.mot_de_passe ?? (user as { motDePasse?: string }).motDePasse ?? "";
    const normalizedHash = hash.startsWith("{bcrypt}")
      ? hash.replace(/^\{bcrypt\}/, "")
      : hash;
    const passwordOk =
      !!normalizedHash &&
      (await bcrypt.compare(providedPassword, normalizedHash).catch(() => false));

    if (!passwordOk) {
      // petit délai pour ralentir le bruteforce
      await new Promise((resolve) => setTimeout(resolve, 300));
      return invalidResponse();
    }

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 jours
    const token = signJwt(
      { sub: String(user._id), email: user.email, role: user.role, exp },
      process.env.JWT_SECRET
    );

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json(
      {
        message: "Utilisateur existe",
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
        },
        token,
      },
      { status: 200 }
    );

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
      { message: "Echec de connexion", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/auth", req.url));
}
