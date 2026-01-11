import { connectDB } from "../config/db";
import CommandeModel, { type Commande } from "../models/commande";
import "../models/utilisateur"; // ensure Utilisateur schema is registered for populate

export const commandeRepository = {
  async findAll(
    filter: Parameters<(typeof CommandeModel)["find"]>[0] = {}
  ) {
    await connectDB();
    const excludeEnCours = { statut: { $not: /^en[\s_]*cours$/i } } as const;
    const query = filter ? ({ $and: [excludeEnCours, filter] } as any) : excludeEnCours;

    return CommandeModel.find(query)
      .populate("clientId", "nom prenom email telephone adresse role image")
      .populate("transporteurId", "nom prenom email telephone adresse role image")
      .exec();
  },

  async findById(id: string) {
    await connectDB();
    return CommandeModel.findById(id).exec();
  },

  async create(data: Partial<Commande>) {
    await connectDB();
    const commande = new CommandeModel(data);
    return commande.save();
  },

  async updateById(id: string, data: Partial<Commande>) {
    await connectDB();
    return CommandeModel.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return CommandeModel.findByIdAndDelete(id).exec();
  },
};
