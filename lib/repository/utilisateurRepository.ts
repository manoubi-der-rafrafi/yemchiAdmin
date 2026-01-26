import { type QueryFilter } from "mongoose";
import { connectDB } from "../config/db";
import UtilisateurModel, { type Utilisateur } from "../models/utilisateur";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const utilisateurRepository = {
  async findAll(filter: QueryFilter<Utilisateur> = {}) {
    await connectDB();
    return UtilisateurModel.find(filter).exec();
  },

  async findById(id: string) {
    await connectDB();
    return UtilisateurModel.findById(id).exec();
  },

  async findByEmail(email: string) {
    await connectDB();
    const normalized = email.trim();
    const safeEmail = escapeRegex(normalized);
    return UtilisateurModel.findOne({
      email: new RegExp(`^${safeEmail}$`, "i"),
    }).exec();
  },

  async create(data: Partial<Utilisateur>) {
    await connectDB();
    const utilisateur = new UtilisateurModel(data);
    return utilisateur.save();
  },

  async updateById(id: string, data: Partial<Utilisateur>) {
    await connectDB();
    return UtilisateurModel.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return UtilisateurModel.findByIdAndDelete(id).exec();
  },
};
