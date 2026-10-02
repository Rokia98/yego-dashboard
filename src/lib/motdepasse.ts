// Génère un mot de passe lisible : « Yego- » + 4 lettres + 4 chiffres + 1 symbole
// (14 caractères), en évitant les caractères ambigus (0/O, 1/l/I).
const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const CHIFFRES = '23456789';
const SYMBOLES = '!@#$%&*';

function tirer(source: string, n: number): string {
  const buf = new Uint32Array(n);
  (globalThis.crypto ?? window.crypto).getRandomValues(buf);
  return Array.from(buf, (v) => source[v % source.length]).join('');
}

export function genererMotDePasse(): string {
  // Yego- pour la lisibilité + assez d'entropie pour un mot de passe temporaire.
  return `Yego-${tirer(LETTRES, 4)}${tirer(CHIFFRES, 4)}${tirer(SYMBOLES, 1)}`;
}
