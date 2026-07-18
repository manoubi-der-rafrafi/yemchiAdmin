import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { TarifsVehiculesClient } from "./client";

export default async function TarifsVehiculesPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) redirect("/auth");
  const payload = await verifyJwt(token, secret);
  const rawRole = (payload?.role as string | undefined) || (payload?.roles as string[] | undefined)?.[0];
  if (!payload || rawRole?.replace(/^ROLE_/i, "").toLowerCase() !== "admin") redirect("/auth");
  return <TarifsVehiculesClient payload={payload as JwtPayload} />;
}
