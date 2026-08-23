import { connectDB } from "../config/db";
import ProduitModel, { type Produit } from "../models/produit";
import { type QueryFilter, Types } from "mongoose";

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
    return new ProduitModel(data).save();
  },
  async updateById(id: string, data: Partial<Produit>) {
    await connectDB();
    return ProduitModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async deleteById(id: string) {
    await connectDB();
    return ProduitModel.findByIdAndDelete(id).exec();
  },
  async findByCommandeIds(commandeIds: string[]) {
    if (commandeIds.length === 0) return [];
    await connectDB();
    const ids: Array<string | Types.ObjectId> = [...commandeIds];
    for (const id of commandeIds) {
      if (Types.ObjectId.isValid(id)) ids.push(new Types.ObjectId(id));
    }
    return ProduitModel.find({ commandeId: { $in: ids } })
      .sort({ _id: 1 })
      .lean()
      .exec();
  },
};
