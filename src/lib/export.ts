// Export CSV côté client (séparateur point-virgule + BOM UTF-8 pour Excel FR).

// Une cellule commençant par = + - @ (ou tabulation / retour chariot) est
// interprétée comme une formule par Excel/LibreOffice : un nom de voyageur
// piégé pourrait exfiltrer des données. On la préfixe d'une apostrophe.
// Les nombres (montants, identifiants, y compris négatifs) restent intacts.
function neutraliserFormule(s: string): string {
  if (/^-?\d+([.,]\d+)?$/.test(s)) return s;
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function echapper(valeur: unknown): string {
  const s = neutraliserFormule(valeur == null ? '' : String(valeur));
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function versCsv(entetes: string[], lignes: (string | number | null | undefined)[][]): string {
  const corps = [entetes, ...lignes].map((r) => r.map(echapper).join(';')).join('\r\n');
  return '﻿' + corps;
}

export function telechargerCsv(nomFichier: string, contenu: string) {
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier.endsWith('.csv') ? nomFichier : `${nomFichier}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function horodatageFichier(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}
