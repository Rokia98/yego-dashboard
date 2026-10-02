import {
  API_URL,
  effacerSession,
  lireAccessToken,
  lireRefreshToken,
  rafraichirAccessToken,
} from './session';

function redirigerVersConnexion() {
  effacerSession();
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.href = '/';
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
