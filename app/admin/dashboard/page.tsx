import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { DashboardShell } from "./shell";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminDashboardPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/auth");
  }

  const payload = await verifyJwt(token, secret);
  const role = payload ? extractRole(payload) : null;

  if (!payload || role !== "admin") {
    redirect("/auth");
  }

  return <DashboardShell payload={payload as JwtPayload} />;
}
