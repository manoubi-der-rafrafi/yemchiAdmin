import { type QueryFilter } from "mongoose";
import { commandeRepository } from "../repository/commandeRepository";
import { type Commande } from "../models/commande";

export const commandeService = {
  list(filter?: QueryFilter<Commande>) {
    const excludeEnCours = { statut: { $not: /^en[\s_]*cours$/i } } as const;
    const query = filter ? ({ $and: [excludeEnCours, filter] } as any) : excludeEnCours;
    return commandeRepository.findAll(query);
  },
  get(id: string) {
    return commandeRepository.findById(id);
  },
  create(data: Partial<Commande>) {
    return commandeRepository.create(data);
  },
  update(id: string, data: Partial<Commande>) {
    return commandeRepository.updateById(id, data);
  },
  remove(id: string) {
    return commandeRepository.deleteById(id);
  },
  sumPrixByLivreurId(id: string) {
    return commandeRepository.sumPrixByLivreurId(id);
  },
  sumPrixLivreeEnligneByTransporteurId(id: string) {
    return commandeRepository.sumPrixLivreeEnligneByTransporteurId(id);
  },
  sumPrixLivreeHorsEnligneByTransporteurId(id: string) {
    return commandeRepository.sumPrixLivreeHorsEnligneByTransporteurId(id);
  },
  listLivreeByTransporteurId(id: string) {
    return commandeRepository.findLivreeByTransporteurId(id);
  },
};
