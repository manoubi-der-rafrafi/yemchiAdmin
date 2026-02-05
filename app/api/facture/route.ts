import { NextResponse } from "next/server";
import crypto from "crypto";
import { factureService } from "@/lib/service/factureService";
import { FactureStatus, FactureType } from "@/lib/models/facture";

const getEnv = (key: string) => process.env[key] ?? "";

const buildSignature = (params: Record<string, string>, apiSecret: string) => {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const montant = Number(form.get("montant"));
    const id_livreur = String(form.get("id_livreur") ?? "");
    const dateTimle = String(form.get("dateTimle") ?? "");
    const type = String(form.get("type") ?? "");
    const factureType = Object.values(FactureType).includes(type as FactureType)
      ? (type as FactureType)
      : undefined;
    const confirmer = String(form.get("confirmer") ?? "");
    const confirmerUpper = confirmer.toUpperCase();
    const factureStatus = Object.values(FactureStatus).includes(confirmerUpper as FactureStatus)
      ? (confirmerUpper as FactureStatus)
      : undefined;
    const file = form.get("image");

    if (
      !Number.isFinite(montant) ||
      !id_livreur ||
      !dateTimle ||
      !factureType ||
      !factureStatus ||
      !(file instanceof File)
    ) {
      return NextResponse.json({ message: "Champs invalides." }, { status: 400 });
    }

    const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = getEnv("CLOUDINARY_API_KEY");
    const apiSecret = getEnv("CLOUDINARY_API_SECRET");
    const folder = getEnv("CLOUDINARY_FOLDER");

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary config missing", {
        cloudName: Boolean(cloudName),
        apiKey: Boolean(apiKey),
        apiSecret: Boolean(apiSecret),
      });
      return NextResponse.json({ message: "Configuration Cloudinary manquante." }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureParams: Record<string, string> = { timestamp };
    if (folder) signatureParams.folder = folder;
    const signature = buildSignature(signatureParams, apiSecret);

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "application/octet-stream" });

    const uploadForm = new FormData();
    uploadForm.append("file", blob, file.name || "facture");
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("signature", signature);
    if (folder) uploadForm.append("folder", folder);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error("Cloudinary upload failed", {
        status: uploadResponse.status,
        body: errorBody,
      });
      return NextResponse.json({ message: "Erreur lors de l'upload." }, { status: 502 });
    }

    const uploadResult = await uploadResponse.json();
    const imageUrl = uploadResult.secure_url ?? uploadResult.url ?? null;

    const created = await factureService.create({
      montant,
      id_livreur,
      dateTimle,
      type: factureType,
      image: imageUrl,
      confirmer: factureStatus,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error while creating facture", error);
    return NextResponse.json({ message: "Erreur lors de la creation" }, { status: 500 });
  }
}
