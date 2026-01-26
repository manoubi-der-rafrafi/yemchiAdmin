import type { Demande } from "../models/demande";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

const getResendConfig = () => {
  const apiKey =
    process.env.RESEND_API_KEY ||
    process.env["resend.api.key"];
  const from =
    process.env.RESEND_FROM ||
    process.env["resend.from"] ||
    "onboarding@resend.dev";
  return { apiKey, from };
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeCausesRefus = (causes?: Demande["causesRefus"]) => {
  if (!causes) return {} as Record<string, string[]>;
  if (causes instanceof Map) {
    return Object.fromEntries(causes.entries()) as Record<string, string[]>;
  }
  return causes;
};

const sendMail = async ({ to, subject, html, text }: EmailPayload) => {
  const { apiKey, from } = getResendConfig();
  if (!apiKey) {
    console.warn("Resend API key missing; email skipped.");
    return null;
  }
  if (!to) {
    console.warn("Email recipient missing; email skipped.");
    return null;
  }
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!response.ok) {
    const message = await response.text();
    console.error("Resend email failed:", message);
  }
  return response.ok;
};

const buildRefusList = (causes?: Demande["causesRefus"]) => {
  const normalized = normalizeCausesRefus(causes);
  const entries = Object.entries(normalized);
  if (entries.length === 0) {
    return {
      text: "Causes de refus: Aucune cause fournie.",
      html: "<p><strong>Causes de refus:</strong> Aucune cause fournie.</p>",
    };
  }
  const text = entries
    .map(([category, reasons]) => {
      const lines = reasons.map((reason) => `- ${reason}`).join("\n");
      return `${category}:\n${lines}`;
    })
    .join("\n\n");
  const html = entries
    .map(
      ([category, reasons]) =>
        `<p><strong>${category}</strong></p><ul>${reasons
          .map((reason) => `<li>${reason}</li>`)
          .join("")}</ul>`
    )
    .join("");
  return {
    text: `Causes de refus:\n${text}`,
    html: `<p><strong>Causes de refus:</strong></p>${html}`,
  };
};

export const mailService = {
  async sendDemandeAcceptee(demande: Demande) {
    if (!demande.email) return null;
    const subject = "Votre demande a ete acceptee";
    const text = [
      `Bonjour ${demande.prenom} ${demande.nom},`,
      "",
      "Votre demande a ete acceptee.",
      `Numero: ${demande.numero}`,
      `Type vehicule: ${demande.typeVehicule}`,
      `Date demande: ${formatDate(demande.dateDemande)}`,
      "",
      "Merci.",
    ].join("\n");
    const html = `
      <p>Bonjour ${demande.prenom} ${demande.nom},</p>
      <p>Votre demande a ete acceptee.</p>
      <ul>
        <li><strong>Numero:</strong> ${demande.numero}</li>
        <li><strong>Type vehicule:</strong> ${demande.typeVehicule}</li>
        <li><strong>Date demande:</strong> ${formatDate(demande.dateDemande)}</li>
      </ul>
      <p>Merci.</p>
    `;
    return sendMail({ to: demande.email, subject, html, text });
  },
  async sendDemandeRefusee(demande: Demande) {
    if (!demande.email) return null;
    const subject = "Votre demande a ete refusee";
    const refusList = buildRefusList(demande.causesRefus);
    const text = [
      `Bonjour ${demande.prenom} ${demande.nom},`,
      "",
      "Votre demande a ete refusee.",
      `Numero: ${demande.numero}`,
      `Type vehicule: ${demande.typeVehicule}`,
      `Date demande: ${formatDate(demande.dateDemande)}`,
      "",
      refusList.text,
      "",
      "Merci.",
    ].join("\n");
    const html = `
      <p>Bonjour ${demande.prenom} ${demande.nom},</p>
      <p>Votre demande a ete refusee.</p>
      <ul>
        <li><strong>Numero:</strong> ${demande.numero}</li>
        <li><strong>Type vehicule:</strong> ${demande.typeVehicule}</li>
        <li><strong>Date demande:</strong> ${formatDate(demande.dateDemande)}</li>
      </ul>
      ${refusList.html}
      <p>Merci.</p>
    `;
    return sendMail({ to: demande.email, subject, html, text });
  },
};
