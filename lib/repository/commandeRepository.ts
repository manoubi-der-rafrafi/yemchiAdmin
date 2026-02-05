import { type QueryFilter, Types } from "mongoose";
import { connectDB } from "../config/db";
import CommandeModel, { type Commande } from "../models/commande";
import "../models/utilisateur"; // ensure Utilisateur schema is registered for populate

export const commandeRepository = {
  buildTransporteurMatch(livreurId: string) {
    const matchTransporteur: Record<string, unknown> = { transporteurId: livreurId };
    if (Types.ObjectId.isValid(livreurId)) {
      matchTransporteur.$or = [{ transporteurId: new Types.ObjectId(livreurId) }, { transporteurId: livreurId }];
      delete matchTransporteur.transporteurId;
    }
    return matchTransporteur;
  },
  async findAll(filter: QueryFilter<Commande> = {}) {
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

  async sumPrixByLivreurId(livreurId: string) {
    await connectDB();
    const matchTransporteur = this.buildTransporteurMatch(livreurId);
    const result = await CommandeModel.aggregate([
      { $match: { statut: { $regex: /^livr[ée]e$/i } } },
      { $match: matchTransporteur },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: {
                input: "$prix",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  },

  async sumPrixLivreeEnligneByTransporteurId(livreurId: string) {
    await connectDB();
    const matchTransporteur = this.buildTransporteurMatch(livreurId);
    const result = await CommandeModel.aggregate([
      {
        $match: {
          statut: { $regex: /^livr[ée]e$/i },
          $or: [
            { modePaiement: { $regex: /^en[\s_]*ligne$/i } },
            { mode_paiement: { $regex: /^en[\s_]*ligne$/i } },
          ],
        },
      },
      { $match: matchTransporteur },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: {
                input: "$prix",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  },

  async sumPrixLivreeHorsEnligneByTransporteurId(livreurId: string) {
    await connectDB();
    const matchTransporteur = this.buildTransporteurMatch(livreurId);
    const result = await CommandeModel.aggregate([
      {
        $match: {
          statut: { $regex: /^livr[ée]e$/i },
          $nor: [
            { modePaiement: { $regex: /^en[\s_]*ligne$/i } },
            { mode_paiement: { $regex: /^en[\s_]*ligne$/i } },
          ],
        },
      },
      { $match: matchTransporteur },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: {
                input: "$prix",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  },

  async findLivreeByTransporteurId(livreurId: string) {
    await connectDB();
    const matchTransporteur = this.buildTransporteurMatch(livreurId);
    return CommandeModel.aggregate([
      { $match: { statut: { $regex: /^livr[ée]e$/i } } },
      { $match: matchTransporteur },
      { $sort: { dateDemande: -1, date_demande: -1, createdAt: -1 } },
    ]);
  },
};
