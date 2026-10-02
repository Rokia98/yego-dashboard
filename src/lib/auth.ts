'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from './http';
import {
  API_URL,
  accessTokenValide,
  decodeJwt,
  ecrireSession,
  effacerSession,
  jetonExpire,
  lireAccessToken,
  lireRefreshToken,
} from './session';

export type UserRole = 'user' | 'agent' | 'company_admin' | 'admin';

// Nom du claim JWT indiquant un mot de passe temporaire à changer — à ajuster
// ici si l'API choisit un autre nom.
const CLAIM_MDP_TEMPORAIRE = 'pwTmp';
export const PATH_CHANGEMENT_MDP = '/changer-mot-de-passe';

export type AuthUser = {
  userId: number;
  telephone: string;
  role: UserRole;
  compagnieId: number | null;
  motDePasseTemporaire: boolean;
};

export function saveSession(accessToken: string, refreshToken?: string) {
  ecrireSession(accessToken, refreshToken);
}

export function getAccessToken(): string | null {
  return lireAccessToken();
}

function userDepuisJeton(token: string | null): AuthUser | null {
  if (!token || jetonExpire(token)) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    userId: payload.sub as number,
    telephone: payload.telephone as string,
    role: payload.role as UserRole,
    compagnieId: (payload.cid as number | null) ?? null,
    motDePasseTemporaire: Boolean(payload[CLAIM_MDP_TEMPORAIRE]),
  };
}

// Rôle et compagnie sont lus dans le payload JWT (`role` / `cid`) pour piloter
// l'affichage uniquement : le jeton n'est PAS vérifié côté client. Toute
// autorisation réelle doit être appliquée par l'API.
export function getCurrentUser(): AuthUser | null {
  return userDepuisJeton(lireAccessToken());
}

/**
 * Comme getCurrentUser, mais si l'access token (15 min) est expiré on tente un
 * refresh (30 j) avant de conclure que la session est perdue.
 */
export async function chargerUtilisateur(): Promise<AuthUser | null> {
  return userDepuisJeton(await accessTokenValide());
}

export function homeForRole(role: UserRole): string {
  if (role === 'admin') return '/admin';
  if (role === 'agent' || role === 'company_admin') return '/compagnie';
  return '/';
}

export type SessionApres = { accessToken: string; refreshToken: string; role: UserRole };

// Réémet un jeton (flag pwTmp levé, sessions des autres appareils révoquées) :
// on remplace la session courante sans repasser par /auth/login.
export function changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string) {
  return apiFetch<SessionApres>('/auth/mot-de-passe', {
    method: 'PATCH',
    body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse }),
  });
}

/** Révoque un refresh token côté API (best-effort). */
export async function revoquerRefreshToken(refreshToken: string) {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Best-effort : rien à faire si l'API est injoignable.
  }
}

export async function logout() {
  const refreshToken = lireRefreshToken();
  effacerSession();
  if (refreshToken) await revoquerRefreshToken(refreshToken);
}

// Protège une page cliente : redirige vers la connexion (`/`) si la session est
// perdue, vers l'écran de changement de mot de passe s'il est temporaire (sauf
// sur cet écran lui-même), ou vers le dashboard adapté si le rôle ne fait pas
// partie de `allowedRoles`.
export function useAuthGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let annule = false;
    chargerUtilisateur().then((current) => {
      if (annule) return;
      if (!current) {
        effacerSession();
        router.replace('/');
        return;
      }
      if (current.motDePasseTemporaire && window.location.pathname !== PATH_CHANGEMENT_MDP) {
        router.replace(PATH_CHANGEMENT_MDP);
        return;
      }
      if (!allowedRoles.includes(current.role)) {
        router.replace(homeForRole(current.role));
        return;
      }
      setUser(current);
      setReady(true);
    });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, ready };
}
