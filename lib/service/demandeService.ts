import { demandeRepository } from "../repository/demandeRepository";
import { type Demande, ReponseDemande } from "../models/demande";

export const demandeService = {
  list(filter?: Parameters<(typeof demandeRepository)["findAll"]>[0]) {
    return demandeRepository.findAll(filter);
  },
  get(id: string) {
    return demandeRepository.findById(id);
  },
  create(data: Partial<Demande>) {
    return demandeRepository.create(data);
  },
  update(id: string, data: Partial<Demande>) {
    return demandeRepository.updateById(id, data);
  },
  accepter(id: string) {
    return demandeRepository.updateById(id, { reponse: ReponseDemande.ACCEPTER });
  },
  refuser(id: string) {
    return demandeRepository.updateById(id, { reponse: ReponseDemande.REFUSER });
  },
  remove(id: string) {
    return demandeRepository.deleteById(id);
  },
};
