import { utilisateurRepository } from "../repository/utilisateurRepository";
import { type Utilisateur } from "../models/utilisateur";

export const utilisateurService = {
  list(filter?: Parameters<(typeof utilisateurRepository)["findAll"]>[0]) {
    return utilisateurRepository.findAll(filter);
  },
  get(id: string) {
    return utilisateurRepository.findById(id);
  },
  findByEmail(email: string) {
    return utilisateurRepository.findByEmail(email);
  },
  create(data: Partial<Utilisateur>) {
    return utilisateurRepository.create(data);
  },
  update(id: string, data: Partial<Utilisateur>) {
    return utilisateurRepository.updateById(id, data);
  },
  remove(id: string) {
    return utilisateurRepository.deleteById(id);
  },
};
