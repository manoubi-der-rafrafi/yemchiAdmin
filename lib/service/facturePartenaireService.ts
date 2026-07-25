import { facturePartenaireRepository } from "../repository/facturePartenaireRepository";
import { FacturePartenaireType, type FacturePartenaire } from "../models/facturePartenaire";

export const facturePartenaireService = {
  list(partenaireId: string, externalBusinessId?: string | null) {
    return facturePartenaireRepository.findByPartenaireId(partenaireId, externalBusinessId);
  },
  create(data: Partial<FacturePartenaire>) {
    return facturePartenaireRepository.create(data);
  },
  sumEntrepriseVerse(partenaireId: string) {
    return facturePartenaireRepository.sumAccepted(
      partenaireId,
      FacturePartenaireType.ENTREPRISE_VERSE_PARTENAIRE
    );
  },
  sumPartenaireVerse(partenaireId: string) {
    return facturePartenaireRepository.sumAccepted(
      partenaireId,
      FacturePartenaireType.PARTENAIRE_VERSE_ENTREPRISE
    );
  },
};
