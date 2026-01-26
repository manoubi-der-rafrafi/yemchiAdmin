import { type QueryFilter } from "mongoose";
import { connectDB } from "../config/db";
import AmiModel, { type Utilisateur as Ami } from "../models/ami";

export const amiRepository = {
  async findAll(filter: QueryFilter<Ami> = {}) {
    await connectDB();
    return AmiModel.find(filter).exec();
  },

  async findById(id: string) {
    await connectDB();
    return AmiModel.findById(id).exec();
  },

  async create(data: Partial<Ami>) {
    await connectDB();
    const ami = new AmiModel(data);
    return ami.save();
  },

  async updateById(id: string, data: Partial<Ami>) {
    await connectDB();
    return AmiModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return AmiModel.findByIdAndDelete(id).exec();
  },
};
