import { commandeRepository } from "../repository/commandeRepository";
import { type Commande } from "../models/commande";

export const commandeService = {
  list(filter?: Parameters<(typeof commandeRepository)["findAll"]>[0]) {
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
};
