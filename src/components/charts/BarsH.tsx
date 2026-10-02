'use client';

export type BarItem = { label: string; value: number; sous?: string };

type BarsHProps = {
  items: BarItem[];
  valueFormat?: (n: number) => string;
  couleur?: 'accent' | 'chart-1' | 'chart-3';
};

// Barres horizontales, teinte unique (magnitude) — plus lisible qu'un camembert
// pour un classement à noms longs. Valeur en label direct au bout de la barre.
export default function BarsH({ items, valueFormat = (n) => n.toLocaleString('fr-FR'), couleur = 'accent' }: BarsHProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (!items.length) {
    return <p className="py-6 text-center text-sm text-ink-faint">Aucune donnée sur la période.</p>;
  }

  return (
    <ul className="space-y-3.5">
      {items.map((it, idx) => (
        <li key={`${it.label}-${idx}`} className="min-w-0">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-ink-soft">{it.label}</span>
            <span className="shrink-0 tabular-nums text-sm font-medium text-ink">{valueFormat(it.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max((it.value / max) * 100, 2)}%`, background: `rgb(var(--${couleur}))` }}
            />
          </div>
          {it.sous && <p className="mt-1 text-xs text-ink-faint">{it.sous}</p>}
        </li>
      ))}
    </ul>
  );
}
