import type { UserRole } from '@/lib/auth';

/** Ligne de GET /utilisateurs (admin plateforme). */
export type Utilisateur = {
  id: number;
  nom: string;
  telephone: string;
  email: string | null;
  photoUrl: string | null;
  role: UserRole;
  compagnieId: number | null;
  compagnie: { id: number; nom: string } | null;
  actif: boolean;
  doitChangerMotDePasse: boolean;
  dateCreation: string;
};

export const LIBELLE_ROLE: Record<UserRole, string> = {
  user: 'Voyageur',
  agent: 'Agent',
  company_admin: 'Gestionnaire',
  admin: 'Admin Yègo',
};

export const ROLES: { valeur: UserRole; label: string }[] = (
  ['user', 'agent', 'company_admin', 'admin'] as const
).map((r) => ({ valeur: r, label: LIBELLE_ROLE[r] }));

/** Rôles rattachés à une compagnie (compagnieId requis par PATCH /utilisateurs/:id/role). */
export const ROLES_LIES_COMPAGNIE: UserRole[] = ['agent', 'company_admin'];
