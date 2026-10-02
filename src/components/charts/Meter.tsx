'use client';

type MeterProps = {
  valeur: number; // 0..1
  label?: string;
  detail?: string;
};

// Jauge linéaire, même rampe que la piste (magnitude d'un ratio vs limite).
export default function Meter({ valeur, label, detail }: MeterProps) {
  const pct = Math.max(0, Math.min(1, valeur)) * 100;
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">{label}</span>
          <span className="tabular-nums text-lg font-semibold text-ink">{Math.round(pct)} %</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700"
          style={{ width: `${Math.max(pct, 1.5)}%` }}
        />
      </div>
      {detail && <p className="mt-1.5 text-xs text-ink-faint">{detail}</p>}
    </div>
  );
}
