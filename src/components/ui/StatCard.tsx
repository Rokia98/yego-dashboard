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
}: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  const bon = up === deltaUpIsGood;
  const deltaAffiche = delta != null ? Math.max(-999, Math.min(999, Math.round(delta))) : null;

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-subtle transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />}
      </div>

      <p className="mt-2 whitespace-nowrap text-[1.55rem] font-semibold leading-tight tracking-tight text-ink">
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
