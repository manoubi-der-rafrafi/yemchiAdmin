import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/lib/utils/jwt";
import { utilisateurService } from "@/lib/service/utilisateurService";
import { commandeService } from "@/lib/service/commandeService";
import { factureService } from "@/lib/service/factureService";
import { type Utilisateur } from "@/lib/models/utilisateur";
import { TarificationLivreursPageContent } from "./client";

type LivreurTarifDto = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  identifiant?: string | null;
  image?: string | null;
  valPaye: number;
};

const extractRole = (payload: Record<string, unknown>) => {
  const role =
    (payload.role as string | undefined) ||
    (payload.roles as string[] | undefined)?.[0] ||
    (payload.authorities as string[] | undefined)?.[0];
  return role?.toLowerCase();
};

export default async function AdminTarificationLivreursPage() {
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

  const livreurs = await utilisateurService.list({ role: "transporteur" });
  const factures = await factureService.list();

  const livreursDto: LivreurTarifDto[] = await Promise.all(
    livreurs.map(async (livreur: Utilisateur) => {
      const id = livreur._id.toString();
      const [
        totalEnligne,
        totalHorsEnligne,
        totalFactureEntrepriseVerseLivreur,
        totalFactureLivreurVerseEntreprise,
      ] = await Promise.all([
        commandeService.sumPrixLivreeEnligneByTransporteurId(id),
        commandeService.sumPrixLivreeHorsEnligneByTransporteurId(id),
        factureService.sumMontantEntrepriseVerseLivreurByLivreurId(id),
        factureService.sumMontantLivreurVerseEntrepriseByLivreurId(id),
      ]);
      const diffRevenue = (totalEnligne - totalHorsEnligne) * 0.5;
      const diffFacture = totalFactureEntrepriseVerseLivreur - totalFactureLivreurVerseEntreprise;
      const valPaye = diffFacture - diffRevenue;
      return {
        id,
        nom: livreur.nom,
        prenom: livreur.prenom,
        email: livreur.email,
        telephone: livreur.telephone ?? null,
        identifiant: livreur.identifiant ?? null,
        image: livreur.image ?? null,
        valPaye,
      };
    })
  );

  const livreurMap = new Map(
    livreurs.map((livreur: Utilisateur) => [livreur._id.toString(), livreur])
  );
  const facturesPlain = factures.map((facture: any) => {
    const livreur = facture?.id_livreur ? livreurMap.get(String(facture.id_livreur)) : null;
    return {
      _id: facture._id?.toString?.() ?? String(facture._id),
      dateTimle: facture.dateTimle ?? null,
      montant: facture.montant ?? null,
      type: facture.type ?? null,
      image: facture.image ?? null,
      livreur: livreur
        ? {
            nom: livreur.nom ?? null,
            prenom: livreur.prenom ?? null,
            email: livreur.email ?? null,
            telephone: livreur.telephone ?? null,
            image: livreur.image ?? null,
          }
        : null,
    };
  });

  return (
    <TarificationLivreursPageContent
      payload={payload as JwtPayload}
      livreurs={livreursDto}
      factures={facturesPlain}
    />
  );
}
