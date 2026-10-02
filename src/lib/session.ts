// Stockage de la session (jetons) — source unique partagée par lib/http et lib/auth.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'yego_token';
const REFRESH_KEY = 'yego_refresh_token';

function lire(cle: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(cle);
}

export function lireAccessToken(): string | null {
  return lire(TOKEN_KEY);
}

export function lireRefreshToken(): string | null {
  return lire(REFRESH_KEY);
}

export function ecrireSession(accessToken: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function effacerSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

/** Vrai si le jeton est illisible ou expiré (marge de 10 s pour l'horloge). */
export function jetonExpire(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  const exp = payload.exp as number | undefined;
  return exp != null && Date.now() >= exp * 1000 - 10_000;
}

// Un seul rafraîchissement en vol à la fois : les appels concurrents attendent
// la même promesse plutôt que de spammer /auth/refresh (le refresh token est
// rotatif, un double appel invaliderait la lignée).
let refreshEnCours: Promise<string | null> | null = null;

async function appelerRefresh(): Promise<string | null> {
  const refreshToken = lireRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    ecrireSession(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export function rafraichirAccessToken(): Promise<string | null> {
  if (!refreshEnCours) {
    refreshEnCours = appelerRefresh().finally(() => {
      refreshEnCours = null;
    });
  }
  return refreshEnCours;
}

/**
 * Renvoie un access token valide : le courant s'il n'est pas expiré, sinon un
 * nouveau obtenu via le refresh token (30 j). `null` si la session est perdue.
 */
export async function accessTokenValide(): Promise<string | null> {
  const token = lireAccessToken();
  if (token && !jetonExpire(token)) return token;
  if (!lireRefreshToken()) return null;
  return rafraichirAccessToken();
}
