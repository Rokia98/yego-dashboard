import type { AuthUser } from '@/lib/auth';
import { SUPPORT_COMPAGNIE } from '@/lib/capacites';
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

/** Le gestionnaire voit les demandes des voyageurs de sa compagnie (SUPPORT_COMPAGNIE). */
export function gestionnaireSupport(user: AuthUser | null): boolean {
  return SUPPORT_COMPAGNIE && user?.role === 'company_admin' && user.compagnieId != null;
}

/**
 * Peut traiter la demande (répondre en tant que support, changer statut et
 * priorité) : l'admin plateforme (support:manage, seul à poser des notes
 * internes) ; avec SUPPORT_COMPAGNIE, aussi le gestionnaire pour une demande
 * de voyageur liée à sa compagnie (support:compagnie).
 */
export function peutTraiter(d: DemandeSupport, user: AuthUser | null): boolean {
  if (user?.role === 'admin') return true;
  return gestionnaireSupport(user) && estDemandeVoyageur(d) && d.compagnieId === user!.compagnieId;
}

/**
 * Auteur d'un message tel qu'affiché : distingue l'équipe Yègo d'un
 * gestionnaire de compagnie (qui répond au voyageur au nom de sa compagnie).
 */
export function libelleAuteurMessage(
  m: { auteurRole: string; auteur?: { nom: string } | null },
  compagnie?: { nom: string } | null,
): string {
  const nom = m.auteur?.nom;
  if (m.auteurRole === 'admin') return nom ? `${nom} · Équipe Yègo` : 'Équipe Yègo';
  if (m.auteurRole === 'company_admin') {
    const qui = compagnie?.nom ?? 'Gestionnaire';
    return nom ? `${nom} · ${qui}` : qui;
  }
  return nom ?? libelleRole(m.auteurRole);
}

export function estAuteur(d: DemandeSupport, user: AuthUser | null): boolean {
  return !!user && d.auteurId === user.userId;
}
