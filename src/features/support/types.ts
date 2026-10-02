import type { UserRole } from '@/lib/auth';

export type CategorieSupport =
  | 'reservation'
  | 'paiement'
  | 'remboursement'
  | 'ticket'
  | 'compte'
  | 'abonnement'
  | 'technique'
  | 'autre';

export type StatutSupport = 'ouverte' | 'en_cours' | 'resolue' | 'fermee';
export type PrioriteSupport = 'normale' | 'haute';

type Personne = { id: number; nom: string; telephone?: string; role: UserRole | string };

export type DemandeSupport = {
  id: number;
  auteurId: number;
  auteurRole: UserRole | string;
  compagnieId: number | null;
  reservationId: number | null;
  categorie: CategorieSupport;
  sujet: string;
  statut: StatutSupport;
  priorite: PrioriteSupport;
  dateCreation: string;
  dateMaj: string;
  dernierMessageA: string;
  nbMessages?: number;
  auteur?: Personne | null;
  compagnie?: { id: number; nom: string } | null;
};

export type MessageSupport = {
  id: number;
  demandeId: number;
  auteurId: number;
  auteurRole: UserRole | string;
  contenu: string;
  /** Note interne de l'équipe Yègo — jamais renvoyée aux non-admins. */
  interne: boolean;
  dateCreation: string;
  auteur?: Personne | null;
};

export type DemandeSupportDetail = DemandeSupport & { messages: MessageSupport[] };

export type CompteursSupport = { ouverte: number; en_cours: number };
