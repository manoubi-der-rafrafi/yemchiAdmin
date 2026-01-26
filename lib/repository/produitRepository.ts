import { type QueryFilter } from "mongoose";
import { connectDB } from "../config/db";
import ProduitModel, { type Produit } from "../models/produit";

export const produitRepository = {
  async findAll(filter: QueryFilter<Produit> = {}) {
    await connectDB();
    return ProduitModel.find(filter).exec();
  },

  async findById(id: string) {
    await connectDB();
    return ProduitModel.findById(id).exec();
  },

  async create(data: Partial<Produit>) {
    await connectDB();
    const produit = new ProduitModel(data);
    return produit.save();
  },

  async updateById(id: string, data: Partial<Produit>) {
    await connectDB();
    return ProduitModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return ProduitModel.findByIdAndDelete(id).exec();
  },
};
