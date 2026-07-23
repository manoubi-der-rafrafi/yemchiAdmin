import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/admin/dashboard/shell";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { TrackingClient } from "./client";

const roleOf = (payload: Record<string, unknown>) => {
  const role = payload.role || (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return String(role ?? "").replace(/^ROLE_/i, "").toLowerCase();
};

export default async function TrackingPage() {
  const token = (await cookies()).get("yemchi_admin_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) redirect("/auth");
  const payload = await verifyJwt(token, secret);
  if (!payload || roleOf(payload) !== "admin") redirect("/auth");

  const users = await utilisateurService.list({ role: { $in: ["client", "transporteur"] } });
  const userOptions = users.map((user) => ({
    id: String(user._id),
    label: `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || user.email,
    email: user.email,
    role: user.role ?? "client",
  }));

  return (
    <DashboardShell
      payload={payload as JwtPayload}
      title="Suivi des utilisateurs"
      subtitle="Historique sécurisé des positions et connexions"
    >
      <TrackingClient users={userOptions} />
    </DashboardShell>
  );
}
