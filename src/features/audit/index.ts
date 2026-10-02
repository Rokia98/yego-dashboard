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
];

export const ACTIONS_AUDIT: { valeur: string; label: string; entite: string }[] = [
  { valeur: 'reservation.guichet', label: 'Vente au guichet', entite: 'reservation' },
  { valeur: 'reservation.annulation', label: 'Annulation de réservation', entite: 'reservation' },
  { valeur: 'paiement.guichet', label: 'Encaissement au guichet', entite: 'paiement' },
  { valeur: 'paiement.simulation', label: 'Paiement simulé', entite: 'paiement' },
  { valeur: 'remboursement.demande', label: 'Demande de remboursement', entite: 'remboursement' },
  { valeur: 'remboursement.confirme', label: 'Remboursement confirmé', entite: 'remboursement' },
  { valeur: 'ticket.validation', label: 'Scan de ticket', entite: 'ticket' },
];

export function libelleAction(action: string): string {
  return ACTIONS_AUDIT.find((a) => a.valeur === action)?.label ?? action;
}

export const auditApi = {
  list: (f: AuditFiltre = {}) => apiFetch<AuditLog[]>(`/audit-logs${toQuery({ take: 100, ...f })}`),
};
