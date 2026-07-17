import { type QueryFilter } from "mongoose";
import { partenaireRepository } from "../repository/partenaireRepository";
import { type Partenaire } from "../models/partenaire";

export const partenaireService = {
  list(filter?: QueryFilter<Partenaire>) {
    return partenaireRepository.findAll(filter);
  },
  get(id: string) {
    return partenaireRepository.findById(id);
  },
};
