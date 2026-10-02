// Les montants viennent de l'API en chaîne (Decimal Prisma sérialisé) pour ne
// perdre aucune précision : on ne les parse qu'au moment de l'affichage.
export function formatFcfa(montant: string | number | null | undefined): string {
  const valeur = typeof montant === 'string' ? Number(montant) : montant ?? 0;
  if (!Number.isFinite(valeur)) return '— FCFA';
  return `${valeur.toLocaleString('fr-FR')} FCFA`;
}

export function formatPourcentage(valeur: number): string {
  return `${Math.round(valeur * 100)}%`;
}

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatDate(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

export function formatDateHeure(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// L'API renvoie heureDepart sous forme "1970-01-01THH:mm:ss.000Z" (epoch) :
// on ne garde que l'heure, en UTC pour rester fidèle à ce qui a été saisi.
export function formatHeure(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}
