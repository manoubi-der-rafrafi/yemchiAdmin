import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { partenaireService } from "@/lib/service/partenaireService";
import { commandeService } from "@/lib/service/commandeService";
import { facturePartenaireService } from "@/lib/service/facturePartenaireService";
import { type Partenaire } from "@/lib/models/partenaire";
import { PartenairesPageContent, type PartenaireRow } from "./client";

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

const toIso = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export default async function AdminPartenairesPage() {
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

  const partenaires = await partenaireService.list();

  const partenairesDto: PartenaireRow[] = await Promise.all(
    partenaires.map(async (partenaire: Partenaire) => {
      const id = partenaire._id.toString();
      const externalBusinessId = partenaire.externalBusinessId ?? null;
      const filter = externalBusinessId
        ? { $or: [{ partenaireId: id }, { externalBusinessId }] }
        : { partenaireId: id };
      const [commandes, factures] = await Promise.all([
        commandeService.list(filter as any),
        facturePartenaireService.list(id, externalBusinessId),
      ]);
      const delivered = commandes.filter((commande) => /^livr/i.test(commande.statut ?? ""));
      const produitsCash = delivered
        .filter(
          (commande) =>
            !/^en[\s_]*ligne$/i.test(commande.modePaiement ?? commande.mode_paiement ?? "")
        )
        .reduce((sum, commande) => sum + Number(commande.prixProduitsPartenaire ?? 0), 0);
      const livraisonOnline = delivered
        .filter((commande) =>
          /^en[\s_]*ligne$/i.test(commande.modePaiement ?? commande.mode_paiement ?? "")
        )
        .reduce(
          (sum, commande) => sum + Number(commande.prixLivraison ?? commande.prix ?? 0),
          0
        );
      const accepted = factures.filter(
        (facture) => !facture.confirmer || facture.confirmer === "ACCEPTER"
      );
      const entrepriseVerse = accepted
        .filter((facture) => facture.type === "ENTREPRISE_VERSE_PARTENAIRE")
        .reduce((sum, facture) => sum + Number(facture.montant), 0);
      const partenaireVerse = accepted
        .filter((facture) => facture.type === "PARTENAIRE_VERSE_ENTREPRISE")
        .reduce((sum, facture) => sum + Number(facture.montant), 0);

      return {
        id,
        externalBusinessId,
        externalOwnerUserId: partenaire.externalOwnerUserId ?? null,
        businessName: partenaire.businessName,
        statut: partenaire.statut ?? "ACTIF",
        createdAt: toIso(partenaire.createdAt),
        updatedAt: toIso(partenaire.updatedAt),
        solde: produitsCash - livraisonOnline - entrepriseVerse + partenaireVerse,
      };
    })
  );

  return <PartenairesPageContent payload={payload as JwtPayload} partenaires={partenairesDto} />;
}
