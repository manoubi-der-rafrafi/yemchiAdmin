import { type QueryFilter } from "mongoose";
import { connectDB } from "../config/db";
import DemandeModel, { type Demande } from "../models/demande";

export const demandeRepository = {
  async findAll(filter: QueryFilter<Demande> = {}) {
    await connectDB();
    return DemandeModel.find(filter).exec();
  },

  async findById(id: string) {
    await connectDB();
    return DemandeModel.findById(id).exec();
  },

  async create(data: Partial<Demande>) {
    await connectDB();
    const demande = new DemandeModel(data);
    return demande.save();
  },

  async updateById(id: string, data: Partial<Demande>) {
    await connectDB();
    return DemandeModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return DemandeModel.findByIdAndDelete(id).exec();
  },
};
