import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { partenaireService } from "@/lib/service/partenaireService";
import { commandeService } from "@/lib/service/commandeService";
import { facturePartenaireService } from "@/lib/service/facturePartenaireService";
import { type Partenaire } from "@/lib/models/partenaire";
import { produitRepository } from "@/lib/repository/produitRepository";
import { buildPartnerFinancialLedger } from "@/lib/finance/partenaireLedger";
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
      const produits = await produitRepository.findByCommandeIds(
        commandes.map((commande) => commande._id.toString())
      );
      const registre = buildPartnerFinancialLedger(
        commandes.map((commande) => ({
          id: commande._id.toString(),
          externalOrderId: commande.externalOrderId,
          date: commande.dateDemande ?? commande.date_demande,
          statut: commande.statut,
          modePaiement: commande.modePaiement ?? commande.mode_paiement,
          prixProduitsPartenaire: commande.prixProduitsPartenaire,
          prixLivraison: commande.prixLivraison,
          prix: commande.prix,
        })),
        produits.map((produit: any) => ({
          id: produit._id.toString(),
          commandeId: String(produit.commandeId),
          externalProductId: produit.externalProductId ?? null,
          nom: produit.nom ?? null,
          quantite: produit.quantite ?? 1,
          prix: Number(produit.prix ?? 0),
          prixTotalLigne: produit.prixTotalLigne == null ? null : Number(produit.prixTotalLigne),
        })),
        factures.map((facture) => ({
          id: facture._id.toString(),
          montant: Number(facture.montant),
          date: facture.dateTimle,
          type: facture.type,
          confirmer: facture.confirmer,
        }))
      );

      return {
        id,
        externalBusinessId,
        externalOwnerUserId: partenaire.externalOwnerUserId ?? null,
        businessName: partenaire.businessName,
        statut: partenaire.statut ?? "ACTIF",
        createdAt: toIso(partenaire.createdAt),
        updatedAt: toIso(partenaire.updatedAt),
        solde: registre.soldeNet,
        resteProduits: registre.produitsHorsLigneRestants,
      };
    })
  );

  return <PartenairesPageContent payload={payload as JwtPayload} partenaires={partenairesDto} />;
}
