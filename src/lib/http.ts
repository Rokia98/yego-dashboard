import {
  API_URL,
  PATH_CONNEXION,
  effacerSession,
  lireAccessToken,
  lireRefreshToken,
  rafraichirAccessToken,
} from './session';

// Dupliqué de auth.ts (qui importe http.ts) pour éviter un import circulaire.
const PATH_CHANGEMENT_MDP = '/changer-mot-de-passe';

function redirigerVersConnexion() {
  effacerSession();
  if (typeof window !== 'undefined' && window.location.pathname !== PATH_CONNEXION) {
    // Rechargement complet voulu : repart d'un état mémoire vierge après la perte de session.
    window.location.href = PATH_CONNEXION;
  }
}

function messageErreur(corps: unknown): string {
  if (corps && typeof corps === 'object' && 'message' in corps) {
    const m = (corps as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return 'Erreur API';
}

function enTetes(token: string | null, avecJson: boolean, extra?: HeadersInit): HeadersInit {
  return {
    ...(avecJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Exécute une requête avec gestion commune du 401 (refresh silencieux unique
 * puis rejeu, sinon redirection login). `construire` reçoit le token courant
 * et doit renvoyer la Response — appelé une 2e fois avec le token rafraîchi.
 */
async function avecAuth(path: string, construire: (token: string | null) => Promise<Response>): Promise<Response> {
  const estAuth = path.startsWith('/auth/');
  let res = await construire(lireAccessToken());

  if (res.status === 401 && !estAuth && lireRefreshToken()) {
    const nouveauToken = await rafraichirAccessToken();
    if (nouveauToken) {
      res = await construire(nouveauToken);
    } else {
      redirigerVersConnexion();
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }
  }

  if (res.status === 401 && !estAuth) {
    redirigerVersConnexion();
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  // API 0.29.0 : tant que le mot de passe temporaire n'est pas changé, toute
  // route protégée répond 403 MOT_DE_PASSE_A_CHANGER (filet de sécurité si le
  // claim pwTmp du jeton n'a pas déjà redirigé via useAuthGuard).
  if (res.status === 403) {
    const corps = await res.clone().json().catch(() => null);
    if (corps?.code === 'MOT_DE_PASSE_A_CHANGER') {
      if (typeof window !== 'undefined' && window.location.pathname !== PATH_CHANGEMENT_MDP) {
        window.location.replace(`${PATH_CHANGEMENT_MDP}?obligatoire=1`);
      }
      throw new Error(messageErreur(corps));
    }
  }

  return res;
}

/** Requête JSON standard. */
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await avecAuth(path, (token) =>
    fetch(`${API_URL}${path}`, { ...options, headers: enTetes(token, true, options.headers) }),
  );

  if (!res.ok) {
    const corps = await res.json().catch(() => null);
    throw new Error(messageErreur(corps));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Requête JSON d'une liste paginée dont le total hors pagination est dans
 * l'en-tête X-Total-Count (null si absent ou non exposé par CORS).
 */
export async function apiFetchAvecTotal<T = unknown>(path: string): Promise<{ items: T; total: number | null }> {
  const res = await avecAuth(path, (token) =>
    fetch(`${API_URL}${path}`, { headers: enTetes(token, true) }),
  );

  if (!res.ok) {
    const corps = await res.json().catch(() => null);
    throw new Error(messageErreur(corps));
  }
  const brut = res.headers.get('X-Total-Count');
  const total = brut != null && brut !== '' && Number.isFinite(Number(brut)) ? Number(brut) : null;
  return { items: await res.json(), total };
}

/** Upload multipart (FormData) — pas de Content-Type forcé, le navigateur pose la boundary. */
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const res = await avecAuth(path, (token) =>
    fetch(`${API_URL}${path}`, { method: 'POST', body: formData, headers: enTetes(token, false) }),
  );

  if (!res.ok) {
    const corps = await res.json().catch(() => null);
    throw new Error(messageErreur(corps));
  }
  return res.json();
}

/** Téléchargement binaire authentifié (ex. fichier de document compagnie) -> Blob. */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await avecAuth(path, (token) =>
    fetch(`${API_URL}${path}`, { headers: enTetes(token, false) }),
  );

  if (!res.ok) {
    const corps = await res.json().catch(() => null);
    throw new Error(messageErreur(corps));
  }
  return res.blob();
}
