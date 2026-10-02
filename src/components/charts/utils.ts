// Outils de tracé partagés par les composants charts (SVG maison, sans dépendance).

export type XY = { x: number; y: number };

/** Échelle linéaire domaine -> plage. */
export function scale(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/**
 * Chemin lissé par interpolation cubique monotone (Fritsch–Carlson) : suit les
 * points sans overshoot — l'aspect « courbe fluide » sans bosses parasites.
 */
export function monotonePath(points: XY[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  if (n === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x || 1e-6;
    dy[i] = points[i + 1].y - points[i].y;
    m[i] = dy[i] / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  t[n - 1] = m[n - 2];

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = points[i].x + dx[i] / 3;
    const y1 = points[i].y + (t[i] * dx[i]) / 3;
    const x2 = points[i + 1].x - dx[i] / 3;
    const y2 = points[i + 1].y - (t[i + 1] * dx[i]) / 3;
    d += ` C${x1},${y1} ${x2},${y2} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

/** Graduations « rondes » pour un axe (max ~count valeurs). */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (max <= min) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Nombre compact : 12 500 -> « 12,5k », 3 200 000 -> « 3,2M ». */
export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString('fr-FR');
}

export function pourcent(part: number, tout: number): string {
  if (!tout) return '0 %';
  return `${Math.round((part / tout) * 100)} %`;
}
