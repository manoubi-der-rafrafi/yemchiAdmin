import { type QueryFilter } from "mongoose";
import { amiRepository } from "../repository/amiRepository";
import { type Utilisateur as Ami } from "../models/ami";

export const amiService = {
  list(filter?: QueryFilter<Ami>) {
    return amiRepository.findAll(filter);
  },
  get(id: string) {
    return amiRepository.findById(id);
  },
  create(data: Partial<Ami>) {
    return amiRepository.create(data);
  },
  update(id: string, data: Partial<Ami>) {
    return amiRepository.updateById(id, data);
  },
  remove(id: string) {
    return amiRepository.deleteById(id);
  },
};
