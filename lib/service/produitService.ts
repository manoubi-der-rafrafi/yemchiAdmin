import { produitRepository } from "../repository/produitRepository";
import { type Produit } from "../models/produit";

export const produitService = {
  list(filter?: Parameters<(typeof produitRepository)["findAll"]>[0]) {
    return produitRepository.findAll(filter);
  },
  get(id: string) {
    return produitRepository.findById(id);
  },
  create(data: Partial<Produit>) {
    return produitRepository.create(data);
  },
  update(id: string, data: Partial<Produit>) {
    return produitRepository.updateById(id, data);
  },
  remove(id: string) {
    return produitRepository.deleteById(id);
  },
};
