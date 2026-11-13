import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  delta?: number;
  deltaSuffix?: string;
  deltaUpIsGood?: boolean;
  children?: React.ReactNode; // sparkline pleine largeur
  /** Teinte imposée ; par défaut, elle dépend de la position dans la rangée. */
  ton?: 'accent' | 'info' | 'success' | 'violet' | 'danger' | 'warning';
};

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  delta,
  deltaSuffix = '%',
  deltaUpIsGood = true,
  children,
  ton,
}: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  const bon = up === deltaUpIsGood;
  const deltaAffiche = delta != null ? Math.max(-999, Math.min(999, Math.round(delta))) : null;

  return (
    <div
      data-ton={ton}
      className="stat-card group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      {/* Liseré et halo de couleur */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[rgb(var(--stat))]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[rgb(var(--stat)/0.10)] blur-2xl transition-opacity group-hover:opacity-80"
      />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--stat)/0.12)] text-[rgb(var(--stat))]">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>

      <p className="relative mt-2 whitespace-nowrap text-[1.55rem] font-semibold leading-tight tracking-tight text-ink">
        {value}
      </p>

      {children && <div className="mt-2 h-8 w-full [&_svg]:w-full">{children}</div>}

      {(deltaAffiche != null || detail) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {deltaAffiche != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${bon ? 'text-success' : 'text-danger'}`}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              ) : (
                <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
              )}
              {Math.abs(deltaAffiche).toLocaleString('fr-FR')}
              {deltaSuffix}
            </span>
          )}
          {detail && <p className="text-xs text-ink-faint">{detail}</p>}
        </div>
      )}
    </div>
  );
}
