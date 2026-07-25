import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/admin/dashboard/shell";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { ApplicationErrorsClient } from "./client";

const roleOf = (payload: Record<string, unknown>) => {
  const role = payload.role || (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return String(role ?? "").replace(/^ROLE_/i, "").toLowerCase();
};

export default async function ApplicationErrorsPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) redirect("/auth");
  const payload = await verifyJwt(token, secret);
  if (!payload || roleOf(payload) !== "admin") redirect("/auth");

  return (
    <DashboardShell
      payload={payload as JwtPayload}
      title="Erreurs applications"
      subtitle="Incidents techniques des clients, livreurs et services"
    >
      <ApplicationErrorsClient />
    </DashboardShell>
  );
}
