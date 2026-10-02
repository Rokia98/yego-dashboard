type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ eyebrow, title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-accent-ink">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {right && (
        <span className="w-fit shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft">
          {right}
        </span>
      )}
    </div>
  );
}
