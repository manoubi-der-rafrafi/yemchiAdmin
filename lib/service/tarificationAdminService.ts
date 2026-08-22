import { Types } from "mongoose";
import { tarificationRepository } from "../repository/tarificationRepository";
import {
  TYPES_VEHICULE,
  type TypeVehicule,
} from "../models/tarificationVehicule";

type TarifInput = {
  typeVehicule?: unknown;
  dateDebut?: unknown;
  prixCommencement?: unknown;
  prixCommencementLivreur?: unknown;
  prixParKilometre?: unknown;
  prixParKilometreLivreur?: unknown;
};

type MajorationInput = {
  pourcentageAjout?: unknown;
  dateDebut?: unknown;
  dateFin?: unknown;
  descriptionCause?: unknown;
};

type RegleBlocageInput = {
  montantBlocage?: unknown;
  pourcentageReglement?: unknown;
};

const numberField = (value: unknown, field: string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} doit etre positif ou nul`);
  }
  return Math.round((parsed + Number.EPSILON) * 1_000) / 1_000;
};

const dateField = (value: unknown, field: string) => {
  const parsed = new Date(typeof value === "string" || value instanceof Date ? value : "");
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} invalide`);
  }
  return parsed;
};

const decimal = (value: number) => Types.Decimal128.fromString(value.toFixed(3));

export const tarificationAdminService = {
  listTarifs() {
    return tarificationRepository.findAllTarifs();
  },

  async activateTarif(input: TarifInput, adminId: string) {
    if (!TYPES_VEHICULE.includes(input.typeVehicule as TypeVehicule)) {
      throw new Error("Type de vehicule invalide");
    }

    const typeVehicule = input.typeVehicule as TypeVehicule;
    const dateDebut = dateField(input.dateDebut, "dateDebut");
    if (dateDebut.getTime() > Date.now() + 5_000) {
      throw new Error("Un tarif courant ne peut pas commencer dans le futur");
    }

    const prixCommencement = numberField(input.prixCommencement, "prixCommencement");
    const prixCommencementLivreur = numberField(
      input.prixCommencementLivreur,
      "prixCommencementLivreur"
    );
    const prixParKilometre = numberField(input.prixParKilometre, "prixParKilometre");
    const prixParKilometreLivreur = numberField(
      input.prixParKilometreLivreur,
      "prixParKilometreLivreur"
    );

    if (
      prixCommencementLivreur > prixCommencement ||
      prixParKilometreLivreur > prixParKilometre
    ) {
      throw new Error("La part livreur ne peut pas depasser le prix total");
    }

    const activeTarifs = await tarificationRepository.findActiveTarifs(typeVehicule);
    if (activeTarifs.some((tarif) => tarif.dateDebut && dateDebut < tarif.dateDebut)) {
      throw new Error("La date de debut doit etre posterieure au tarif actuel");
    }

    await tarificationRepository.closeTarifs(
      activeTarifs.map((tarif) => tarif._id.toString()),
      dateDebut
    );

    return tarificationRepository.createTarif({
      typeVehicule,
      dateDebut,
      dateFin: null,
      prixCommencement: decimal(prixCommencement),
      prixCommencementLivreur: decimal(prixCommencementLivreur),
      prixCommencementSociete: decimal(prixCommencement - prixCommencementLivreur),
      prixParKilometre: decimal(prixParKilometre),
      prixParKilometreLivreur: decimal(prixParKilometreLivreur),
      prixParKilometreSociete: decimal(prixParKilometre - prixParKilometreLivreur),
      createdAt: new Date(),
      createdByAdminId: adminId,
    });
  },

  listMajorations() {
    return tarificationRepository.findAllMajorations();
  },

  async createMajoration(input: MajorationInput, adminId: string) {
    const pourcentageAjout = numberField(input.pourcentageAjout, "pourcentageAjout");
    const dateDebut = dateField(input.dateDebut, "dateDebut");
    const dateFin = dateField(input.dateFin, "dateFin");
    const descriptionCause =
      typeof input.descriptionCause === "string" ? input.descriptionCause.trim() : "";

    if (dateFin <= dateDebut || !descriptionCause) {
      throw new Error("Majoration invalide");
    }
    if (await tarificationRepository.findOverlappingMajoration(dateDebut, dateFin)) {
      throw new Error("Une majoration existe deja sur cette periode");
    }

    return tarificationRepository.createMajoration({
      pourcentageAjout: decimal(pourcentageAjout),
      dateDebut,
      dateFin,
      descriptionCause,
      createdAt: new Date(),
      createdByAdminId: adminId,
    });
  },

  listReglesBlocage() {
    return tarificationRepository.findAllReglesBlocage();
  },

  async activateRegleBlocage(input: RegleBlocageInput, adminId: string) {
    const montantBlocage = numberField(input.montantBlocage, "montantBlocage");
    const pourcentageReglement = numberField(
      input.pourcentageReglement,
      "pourcentageReglement"
    );
    if (montantBlocage <= 0) {
      throw new Error("Le montant de blocage doit etre superieur a zero");
    }
    if (pourcentageReglement <= 0 || pourcentageReglement > 100) {
      throw new Error("Le pourcentage de reglement doit etre compris entre 0 et 100");
    }

    const dateDebut = new Date();
    const active = await tarificationRepository.findActiveReglesBlocage();
    await tarificationRepository.closeReglesBlocage(
      active.map((regle) => regle._id.toString()),
      dateDebut
    );
    return tarificationRepository.createRegleBlocage({
      montantBlocage: decimal(montantBlocage),
      pourcentageReglement: decimal(pourcentageReglement),
      dateDebut,
      dateFin: null,
      createdAt: dateDebut,
      createdByAdminId: adminId,
    });
  },
};
