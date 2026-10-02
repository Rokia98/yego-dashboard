import type { Ville } from '@/features/villes';
import type { Vehicule, Chauffeur } from '@/features/flotte';

export type DepartStatut = 'planifie' | 'en_route' | 'arrive' | 'annule' | string;

export type Depart = {
  id: number;
  trajetId: number;
  vehiculeId: number | null;
  chauffeurId: number | null;
  dateDepart: string;
  placesTotales: number;
  placesDisponibles: number;
  statut: DepartStatut;
  demarreA?: string | null;
  termineA?: string | null;
  retardMinutes?: number | null;
  vehicule: Vehicule | null;
  // Depuis l'API 0.26.0, réduit à { id, nom } (détail via GET /chauffeurs).
  chauffeur: Pick<Chauffeur, 'id' | 'nom'> | null;
  trajet: {
    id: number;
    compagnieId: number;
    prix: string;
    heureDepart: string;
    villeDepart: Ville;
    villeArrivee: Ville;
    compagnie: { id: number; nom: string };
  };
};

export type SiegesDepart = {
  placesTotales: number;
  placesDisponibles: number;
  occupes: string[];
  placesVendues?: number; // total vendu (0.21.1+)
  placesSansSiege?: number; // vendues en placement libre, non situables (0.21.1+)
};
