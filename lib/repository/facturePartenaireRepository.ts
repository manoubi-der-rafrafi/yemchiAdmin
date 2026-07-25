import { connectDB } from "../config/db";
import FacturePartenaireModel, {
  FacturePartenaireStatus,
  FacturePartenaireType,
  type FacturePartenaire,
} from "../models/facturePartenaire";

export const facturePartenaireRepository = {
  async findByPartenaireId(partenaireId: string, externalBusinessId?: string | null) {
    await connectDB();
    const filter = externalBusinessId
      ? { $or: [{ partenaireId }, { externalBusinessId }] }
      : { partenaireId };
    return FacturePartenaireModel.find(filter).sort({ dateTimle: -1 }).exec();
  },

  async create(data: Partial<FacturePartenaire>) {
    await connectDB();
    return new FacturePartenaireModel(data).save();
  },

  async sumAccepted(partenaireId: string, type: FacturePartenaireType) {
    await connectDB();
    const result = await FacturePartenaireModel.aggregate([
      {
        $match: {
          partenaireId,
          type,
          confirmer: FacturePartenaireStatus.ACCEPTER,
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$montant", 0] } } } },
    ]);
    return result[0]?.total ?? 0;
  },
};
