import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';

export type AuditLog = {
  id: number;
  entite: string;
  entiteId: number | null;
  action: string;
  acteurId: number | null;
  acteurRole: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  dateCreation: string;
  acteur: { id: number; nom: string; telephone: string; role: string } | null;
};

export type AuditFiltre = { entite?: string; action?: string; take?: number; skip?: number };

// Valeurs enregistrées par yego-api (filtre en égalité stricte côté API).
export const ENTITES_AUDIT: { valeur: string; label: string }[] = [
  { valeur: 'reservation', label: 'Réservations' },
  { valeur: 'paiement', label: 'Paiements' },
  { valeur: 'remboursement', label: 'Remboursements' },
  { valeur: 'ticket', label: 'Tickets' },
  { valeur: 'reversement', label: 'Reversements' },
  { valeur: 'demande_reversement', label: 'Demandes de reversement' },
  { valeur: 'retrait_plateforme', label: 'Retraits Yègo' },
  { valeur: 'compagnie', label: 'Compagnies' },
];

export const ACTIONS_AUDIT: { valeur: string; label: string; entite: string }[] = [
  { valeur: 'reservation.guichet', label: 'Vente au guichet', entite: 'reservation' },
  { valeur: 'reservation.annulation', label: 'Annulation de réservation', entite: 'reservation' },
  { valeur: 'paiement.guichet', label: 'Encaissement au guichet', entite: 'paiement' },
  { valeur: 'paiement.simulation', label: 'Paiement simulé', entite: 'paiement' },
  { valeur: 'remboursement.demande', label: 'Demande de remboursement', entite: 'remboursement' },
  { valeur: 'remboursement.confirme', label: 'Remboursement confirmé', entite: 'remboursement' },
  { valeur: 'ticket.validation', label: 'Scan de ticket', entite: 'ticket' },
  { valeur: 'reversement.initie', label: 'Reversement lancé', entite: 'reversement' },
  { valeur: 'reversement.effectue', label: 'Reversement effectué', entite: 'reversement' },
  { valeur: 'reversement.echoue', label: 'Reversement échoué', entite: 'reversement' },
  { valeur: 'reversement.demande', label: 'Demande de reversement', entite: 'demande_reversement' },
  { valeur: 'reversement.demande_rejetee', label: 'Demande de reversement rejetée', entite: 'demande_reversement' },
  { valeur: 'retrait.initie', label: 'Retrait Yègo lancé', entite: 'retrait_plateforme' },
  { valeur: 'retrait.effectue', label: 'Retrait Yègo effectué', entite: 'retrait_plateforme' },
  { valeur: 'retrait.echoue', label: 'Retrait Yègo échoué', entite: 'retrait_plateforme' },
  { valeur: 'compagnie.coordonnees_reversement', label: 'Compte de reversement modifié', entite: 'compagnie' },
];

export function libelleAction(action: string): string {
  return ACTIONS_AUDIT.find((a) => a.valeur === action)?.label ?? action;
}

export const auditApi = {
  list: (f: AuditFiltre = {}) => apiFetch<AuditLog[]>(`/audit-logs${toQuery({ take: 100, ...f })}`),
};
