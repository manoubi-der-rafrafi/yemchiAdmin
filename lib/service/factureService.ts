import { type Facture } from "../models/facture";
import { factureRepository } from "../repository/factureRepository";

export const factureService = {
  list() {
    return factureRepository.findAll();
  },
  get(id: string) {
    return factureRepository.findById(id);
  },
  listByLivreurId(livreurId: string) {
    return factureRepository.findByLivreurId(livreurId);
  },
  create(data: Partial<Facture>) {
    return factureRepository.create(data);
  },
  update(id: string, data: Partial<Facture>) {
    return factureRepository.updateById(id, data);
  },
  remove(id: string) {
    return factureRepository.deleteById(id);
  },
  sumMontantEntrepriseVerseLivreurByLivreurId(livreurId: string) {
    return factureRepository.sumMontantEntrepriseVerseLivreurByLivreurId(livreurId);
  },
  sumMontantLivreurVerseEntrepriseByLivreurId(livreurId: string) {
    return factureRepository.sumMontantLivreurVerseEntrepriseByLivreurId(livreurId);
  },
};
