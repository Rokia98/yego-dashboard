'use client';

import { Search, X } from 'lucide-react';

const controlClass =
  'rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

/** Conteneur d'une barre de filtres : contrôles à gauche, réinitialisation à droite. */
export function FiltresBar({
  children,
  nbActifs = 0,
  onReinitialiser,
}: {
  children: React.ReactNode;
  nbActifs?: number;
  onReinitialiser?: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-3 shadow-subtle">
      {children}
      {onReinitialiser && nbActifs > 0 && (
        <button
          type="button"
          onClick={onReinitialiser}
          className="ml-auto inline-flex items-center gap-1 self-center rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Réinitialiser ({nbActifs})
        </button>
      )}
    </div>
  );
}

function Libelle({ label, children }: { label?: string; children: React.ReactNode }) {
  if (!label) return <>{children}</>;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </div>
  );
}

export function FiltreRecherche({
  value,
  onChange,
  placeholder = 'Rechercher…',
  label,
  className = 'w-full sm:w-64',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Libelle label={label}>
      <div className={`relative ${className}`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" strokeWidth={1.75} />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${controlClass} w-full pl-9`}
        />
      </div>
    </Libelle>
  );
}

export type OptionFiltre<V extends string = string> = { valeur: V; label: string };

/** Contrôle segmenté — pour les énumérations courtes (statut, canal…). */
export function FiltreSegments<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V;
  onChange: (v: V) => void;
  options: OptionFiltre<V>[];
  label?: string;
}) {
  return (
    <Libelle label={label}>
      <div role="radiogroup" className="inline-flex flex-wrap rounded-xl border border-line bg-surface-2 p-0.5">
        {options.map((o) => {
          const actif = o.valeur === value;
          return (
            <button
              key={o.valeur}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onChange(o.valeur)}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                actif ? 'bg-surface text-ink shadow-subtle' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </Libelle>
  );
}

export function FiltreSelect<V extends string>({
  value,
  onChange,
  options,
  label,
  tous = 'Tous',
  className = 'w-full sm:w-52',
}: {
  value: V | '';
  onChange: (v: V | '') => void;
  options: OptionFiltre<V>[];
  label?: string;
  /** Libellé de l'option vide (pas de filtre). */
  tous?: string;
  className?: string;
}) {
  return (
    <Libelle label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as V | '')} className={`${controlClass} ${className}`}>
        <option value="">{tous}</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.label}
          </option>
        ))}
      </select>
    </Libelle>
  );
}

export type RaccourciPeriode = { label: string; du: string; au: string };

/** Période [du, au] (dates incluses) + raccourcis optionnels. */
export function FiltrePeriode({
  du,
  au,
  onChange,
  label = 'Période',
  raccourcis = [],
}: {
  du: string;
  au: string;
  onChange: (du: string, au: string) => void;
  label?: string;
  raccourcis?: RaccourciPeriode[];
}) {
  return (
    <Libelle label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={du}
          max={au || undefined}
          onChange={(e) => onChange(e.target.value, au)}
          className={`${controlClass} w-[9.5rem]`}
          aria-label="Du"
        />
        <span className="text-xs text-ink-faint">au</span>
        <input
          type="date"
          value={au}
          min={du || undefined}
          onChange={(e) => onChange(du, e.target.value)}
          className={`${controlClass} w-[9.5rem]`}
          aria-label="Au"
        />
        {raccourcis.map((r) => {
          const actif = r.du === du && r.au === au;
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => onChange(r.du, r.au)}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                actif ? 'bg-accent-soft text-accent-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </Libelle>
  );
}

/** Bandeau d'information sous la barre (ex. filtrage local en attente de l'API). */
export function NoteFiltre({ children }: { children: React.ReactNode }) {
  return <p className="-mt-2 mb-3 px-1 text-xs text-ink-faint">{children}</p>;
}
