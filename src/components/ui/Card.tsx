export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-subtle ${className}`}>{children}</div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-line-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-accent to-accent/40" />
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 pl-3 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {right != null && right !== '' &&
        (typeof right === 'string' || typeof right === 'number' ? (
          <span className="w-fit rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-inset ring-line-soft">
            {right}
          </span>
        ) : (
          <span className="text-xs text-ink-faint">{right}</span>
        ))}
    </div>
  );
}
