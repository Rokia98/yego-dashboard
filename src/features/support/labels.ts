import type { AuthUser } from '@/lib/auth';
import type { CategorieSupport, DemandeSupport, StatutSupport } from './types';

export const CATEGORIES_SUPPORT: { valeur: CategorieSupport; label: string }[] = [
  { valeur: 'reservation', label: 'Réservation' },
  { valeur: 'paiement', label: 'Paiement' },
  { valeur: 'remboursement', label: 'Remboursement' },
  { valeur: 'ticket', label: 'Ticket / embarquement' },
  { valeur: 'compte', label: 'Compte / accès' },
  { valeur: 'abonnement', label: 'Abonnement' },
  { valeur: 'technique', label: 'Problème technique' },
  { valeur: 'autre', label: 'Autre' },
];

export const LIBELLE_STATUT_SUPPORT: Record<StatutSupport, string> = {
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  resolue: 'Résolue',
  fermee: 'Fermée',
};

export const TONE_STATUT_SUPPORT: Record<StatutSupport, 'warning' | 'accent' | 'success' | 'neutral'> = {
  ouverte: 'warning',
  en_cours: 'accent',
  resolue: 'success',
  fermee: 'neutral',
};

export function libelleCategorie(c: string): string {
  return CATEGORIES_SUPPORT.find((x) => x.valeur === c)?.label ?? c;
}

export function libelleRole(role: string): string {
  if (role === 'admin') return 'Équipe Yègo';
  if (role === 'company_admin') return 'Gestionnaire';
  if (role === 'agent') return 'Agent';
  return 'Voyageur';
}

/** Demande ouverte par un voyageur (sinon : par le personnel d'une compagnie). */
export function estDemandeVoyageur(d: DemandeSupport): boolean {
  return d.auteurRole === 'user';
}

/**
 * Peut traiter la demande (répondre en tant que support, changer statut et
 * priorité, notes internes) : l'admin plateforme uniquement. Les autres rôles
 * ne voient que leurs propres demandes. Reflète la règle API (support:manage).
 */
export function peutTraiter(_d: DemandeSupport, user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function estAuteur(d: DemandeSupport, user: AuthUser | null): boolean {
  return !!user && d.auteurId === user.userId;
}
