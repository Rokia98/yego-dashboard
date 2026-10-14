import { apiFetch } from '@/lib/http';
import { toQuery } from '@/lib/filtres';
import type {
  ApercuReversement,
  ApercuRetrait,
  CoordonneesReversement,
  DemandeReversement,
  MoyenRetrait,
  MoyenReversement,
  MoyenYego,
  Retrait,
  Reversement,
  ReversementDetail,
  SoldeCompagnie,
} from './types';

type ListeParams = { take?: number; skip?: number; compagnieId?: number | null; statut?: string };

export const reversementsApi = {
  /**
   * company_admin : toujours sa compagnie (compagnieId ignoré). take ≤ 100.
   * aRemettre (nouveau circuit) : true = fonds arrivés chez Yègo, pas encore remis ; false = déjà remis.
   */
  list: ({ take = 20, skip = 0, compagnieId, statut, aRemettre }: ListeParams & { aRemettre?: boolean | null } = {}) =>
    apiFetch<Reversement[]>(`/reversements${toQuery({ compagnieId, statut, aRemettre, skip, take })}`),
  get: (id: number) => apiFetch<ReversementDetail>(`/reversements/${id}`),
  /** admin : compagnieId requis ; company_admin : facultatif (sa compagnie). */
  apercu: (compagnieId?: number | null) =>
    apiFetch<ApercuReversement>(`/reversements/apercu${toQuery({ compagnieId })}`),
  /** Solde de la compagnie (disponible, en attente, en cours, reversé). admin : compagnieId requis. */
  soldeCompagnie: (compagnieId?: number | null) =>
    apiFetch<SoldeCompagnie>(`/dashboard/solde${toQuery({ compagnieId })}`),
  /** Solde du magasin Jèko Yègo (admin) ; null = illisible. */
  solde: () => apiFetch<{ soldeFcfa: number | null }>('/reversements/solde'),
  /**
   * Lance le transfert du net éligible (admin). Honore aussi la demande en attente de la compagnie.
   * moyen : requis par le nouveau circuit (opérateur du numéro Yègo qui reçoit) ; omis = ancien circuit.
   */
  creer: (compagnieId: number, moyen?: MoyenYego) =>
    apiFetch<Reversement>('/reversements', { method: 'POST', body: JSON.stringify({ compagnieId, moyen }) }),
  /** Déclare la remise en main propre à la compagnie (fonds arrivés : statut effectue). */
  remettre: (id: number, note?: string) =>
    apiFetch<Reversement>(`/reversements/${id}/remise`, {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {}),
    }),
  getCoordonnees: (compagnieId: number) =>
    apiFetch<CoordonneesReversement | null>(`/reversements/coordonnees/${compagnieId}`),
  /** Téléphone normalisé en +225… par l'API (400 si ce n'est pas un mobile CI). */
  setCoordonnees: (compagnieId: number, data: { moyen: MoyenReversement; telephone: string }) =>
    apiFetch<CoordonneesReversement>(`/reversements/coordonnees/${compagnieId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Demandes : la compagnie demande, l'admin approuve (lance le transfert) ou rejette.

  /** company_admin : une seule demande en attente à la fois (409 sinon). */
  demander: (commentaire?: string) =>
    apiFetch<DemandeReversement>('/reversements/demandes', {
      method: 'POST',
      body: JSON.stringify(commentaire ? { commentaire } : {}),
    }),
  /** admin : toutes (filtre compagnieId) ; company_admin : celles de sa compagnie. */
  demandes: ({ take = 20, skip = 0, compagnieId, statut }: ListeParams = {}) =>
    apiFetch<DemandeReversement[]>(`/reversements/demandes${toQuery({ compagnieId, statut, skip, take })}`),
  /** Transfert Jèko vers le numéro Yègo (opérateur `moyen`). Si Jèko refuse, la demande reste en attente. */
  approuverDemande: (id: number, moyen: MoyenYego) =>
    apiFetch<DemandeReversement>(`/reversements/demandes/${id}/approuver`, {
      method: 'POST',
      body: JSON.stringify({ moyen }),
    }),
  /** motif : 3 à 500 caractères. */
  rejeterDemande: (id: number, motif: string) =>
    apiFetch<DemandeReversement>(`/reversements/demandes/${id}/rejeter`, {
      method: 'POST',
      body: JSON.stringify({ motif }),
    }),
  annulerDemande: (id: number) =>
    apiFetch<DemandeReversement>(`/reversements/demandes/${id}/annuler`, { method: 'POST' }),
};

/** Retraits de la part Yègo vers le numéro Mobile Money de Yègo (admin plateforme). */
export const retraitsApi = {
  apercu: () => apiFetch<ApercuRetrait>('/retraits/apercu'),
  /** Mot de passe de l'admin redemandé ; 5 tentatives / minute. */
  creer: (data: { montant: number; moyen: MoyenRetrait; motDePasse: string }) =>
    apiFetch<Retrait>('/retraits', { method: 'POST', body: JSON.stringify(data) }),
  list: ({ take = 20, skip = 0, statut }: Omit<ListeParams, 'compagnieId'> = {}) =>
    apiFetch<Retrait[]>(`/retraits${toQuery({ statut, skip, take })}`),
};
