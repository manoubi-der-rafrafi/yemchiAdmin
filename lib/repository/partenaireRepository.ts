import { type QueryFilter } from "mongoose";
import { connectDB } from "../config/db";
import PartenaireModel, { type Partenaire } from "../models/partenaire";

export const partenaireRepository = {
  async findAll(filter: QueryFilter<Partenaire> = {}) {
    await connectDB();
    return PartenaireModel.find(filter).sort({ createdAt: -1 }).exec();
  },

  async findById(id: string) {
    await connectDB();
    return PartenaireModel.findById(id).exec();
  },
};
