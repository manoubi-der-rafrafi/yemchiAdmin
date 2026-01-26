import FactureModel, { FactureType, type Facture } from "../models/facture";
import { connectDB } from "../config/db";

export const factureRepository = {
  async findAll() {
    await connectDB();
    return FactureModel.find().exec();
  },
  async findById(id: string) {
    await connectDB();
    return FactureModel.findById(id).exec();
  },
  async findByLivreurId(livreurId: string) {
    await connectDB();
    return FactureModel.find({ id_livreur: livreurId }).exec();
  },
  async create(data: Partial<Facture>) {
    await connectDB();
    const facture = new FactureModel(data);
    return facture.save();
  },
  async updateById(id: string, data: Partial<Facture>) {
    await connectDB();
    return FactureModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async deleteById(id: string) {
    await connectDB();
    return FactureModel.findByIdAndDelete(id).exec();
  },
  async sumMontantByLivreurIdAndType(livreurId: string, type: FactureType) {
    await connectDB();
    const result = await FactureModel.aggregate([
      { $match: { id_livreur: livreurId, type } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$montant", 0] } } } },
    ]);
    return result[0]?.total ?? 0;
  },
  async sumMontantEntrepriseVerseLivreurByLivreurId(livreurId: string) {
    return this.sumMontantByLivreurIdAndType(livreurId, FactureType.ENTREPRISE_VERSE_LIVREUR);
  },
  async sumMontantLivreurVerseEntrepriseByLivreurId(livreurId: string) {
    return this.sumMontantByLivreurIdAndType(livreurId, FactureType.LIVREUR_VERSE_ENTREPRISE);
  },
};
