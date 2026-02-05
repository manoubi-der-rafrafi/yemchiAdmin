export const COMMANDE_STATUTS = [
  "EN_ATTENTE",
  "ENVOYEE",
  "EN_COURS",
  "LIVREE",
  "ANNULEE",
  "en_appelle",
  "Appelle client 1",
  "Appelle client 2",
  "Non repondre client 1",
  "Non repondre client 2",
] as const;

export type CommandeStatut = (typeof COMMANDE_STATUTS)[number];
