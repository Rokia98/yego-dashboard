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
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-ink ring-1 ring-inset ring-accent/15">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {right && (
        <span className="w-fit shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft shadow-subtle">
          {right}
        </span>
      )}
    </div>
  );
}
