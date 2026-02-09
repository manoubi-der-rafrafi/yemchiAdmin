export const COMMANDE_STATUTS = [
  "annulee",
  "en_attente",
  "en_cours",
  "livree",
  "confirmer",
  "envoyee",
  "accepter",
  "appel_client_1",
  "appel_client_2",
  "en_appelle",
  "non_repondre_client_1",
  "non_repondre_client_2",
] as const;

export type CommandeStatut = (typeof COMMANDE_STATUTS)[number];
