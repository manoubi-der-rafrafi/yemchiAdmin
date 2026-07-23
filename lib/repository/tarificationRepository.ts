import { connectDB } from "../config/db";
import MajorationTarifModel from "../models/majorationTarif";
import TarificationVehiculeModel, {
  type TypeVehicule,
} from "../models/tarificationVehicule";

export const tarificationRepository = {
  async findAllTarifs() {
    await connectDB();
    return TarificationVehiculeModel.find().sort({ dateDebut: -1 }).exec();
  },

  async findActiveTarifs(typeVehicule: TypeVehicule) {
    await connectDB();
    return TarificationVehiculeModel.find({ typeVehicule, dateFin: null }).exec();
  },

  async closeTarifs(ids: string[], dateFin: Date) {
    await connectDB();
    if (ids.length === 0) return;
    await TarificationVehiculeModel.updateMany(
      { _id: { $in: ids } },
      { $set: { dateFin } }
    ).exec();
  },

  async createTarif(data: Record<string, unknown>) {
    await connectDB();
    return TarificationVehiculeModel.create(data);
  },

  async findAllMajorations() {
    await connectDB();
    return MajorationTarifModel.find().sort({ dateDebut: -1 }).exec();
  },

  async findOverlappingMajoration(dateDebut: Date, dateFin: Date) {
    await connectDB();
    return MajorationTarifModel.findOne({
      dateDebut: { $lt: dateFin },
      dateFin: { $gt: dateDebut },
    }).exec();
  },

  async createMajoration(data: Record<string, unknown>) {
    await connectDB();
    return MajorationTarifModel.create(data);
  },
};
