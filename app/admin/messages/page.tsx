import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { contactService } from "@/lib/service/contactService";
import { type Contact } from "@/lib/models/contact";
import { ContactsPageContent } from "./client";

type ContactDto = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  createdAt?: string;
};

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminMessagesPage() {
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

  const contacts = await contactService.list();

  const contactsDto: ContactDto[] = contacts.map((contact: Contact) => ({
    id: contact._id.toString(),
    nom: contact.nom,
    email: contact.email,
    telephone: contact.telephone,
    message: contact.message,
    createdAt: (contact as any).createdAt?.toISOString?.() ?? null,
  }));

  return <ContactsPageContent payload={payload as JwtPayload} contacts={contactsDto} />;
}
