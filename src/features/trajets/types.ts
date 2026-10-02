import type { Ville } from '@/features/villes';

export type Trajet = {
  id: number;
  compagnieId: number;
  prix: string; // Decimal sérialisé en chaîne par l'API
  heureDepart: string; // "1970-01-01THH:mm:ss.000Z"
  heureArriveeEstimee: string | null;
  joursRecurrence: string | null;
  statut: string;
  villeDepartId: number;
  villeArriveeId: number;
  villeDepart: Ville;
  villeArrivee: Ville;
  compagnie?: { id: number; nom: string };
};
