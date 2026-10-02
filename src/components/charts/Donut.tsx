'use client';

import { useState } from 'react';
import { pourcent } from './utils';

export type DonutPart = { label: string; value: number; couleur: string };

type DonutProps = {
  parts: DonutPart[];
  total?: number;
  centreLabel?: string;
  centreValeur?: string;
};

const R = 52;
const STROKE = 18;
const C = 2 * Math.PI * R;

export default function Donut({ parts, total, centreLabel, centreValeur }: DonutProps) {
  const [actif, setActif] = useState<number | null>(null);
  const somme = total ?? parts.reduce((s, p) => s + p.value, 0);
  let offset = 0;

  const segments = parts.map((p, i) => {
    const frac = somme ? p.value / somme : 0;
    const len = frac * C;
    const seg = { ...p, dash: `${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`, offset: -offset, i };
    offset += len;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
          <circle cx={70} cy={70} r={R} fill="none" stroke="rgb(var(--line))" strokeWidth={STROKE} />
          {segments.map((s) => (
            <circle
              key={s.i}
              cx={70}
              cy={70}
              r={R}
              fill="none"
              stroke={s.couleur}
              strokeWidth={actif === s.i ? STROKE + 3 : STROKE}
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              className="transition-[stroke-width] duration-150"
              onMouseEnter={() => setActif(s.i)}
              onMouseLeave={() => setActif(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-semibold text-ink">{centreValeur ?? somme.toLocaleString('fr-FR')}</span>
          {centreLabel && <span className="text-[11px] text-ink-faint">{centreLabel}</span>}
        </div>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {parts.map((p, i) => (
          <li
            key={p.label}
            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors ${
              actif === i ? 'bg-surface-2' : ''
            }`}
            onMouseEnter={() => setActif(i)}
            onMouseLeave={() => setActif(null)}
          >
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.couleur }} />
              {p.label}
            </span>
            <span className="tabular-nums text-ink">
              {p.value.toLocaleString('fr-FR')}
              <span className="ml-1.5 text-ink-faint">{pourcent(p.value, somme)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
