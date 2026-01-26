import { type QueryFilter } from "mongoose";
import { demandeRepository } from "../repository/demandeRepository";
import { type Demande, ReponseDemande } from "../models/demande";

export const demandeService = {
  list(filter?: QueryFilter<Demande>) {
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
    return demandeRepository.updateById(id, {
      reponse: ReponseDemande.ACCEPTER,
      dossierPhysique: false,
    });
  },
  refuser(id: string, causesRefus?: Record<string, string[]>) {
    return demandeRepository.updateById(id, {
      reponse: ReponseDemande.REFUSER,
      causesRefus: causesRefus ?? {},
    });
  },
  remove(id: string) {
    return demandeRepository.deleteById(id);
  },
  markDossierPhysique(id: string, value: boolean) {
    return demandeRepository.updateById(id, { dossierPhysique: value });
  },
};
