export function Table({ children, minWidth = '640px' }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line-soft text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-2">{children}</tr>
  );
}

export function Td({
  children,
  strong = false,
  className = '',
  colSpan,
}: {
  children: React.ReactNode;
  strong?: boolean;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-5 py-3.5 ${strong ? 'font-medium text-ink' : 'text-ink-soft'} ${className}`}
    >
      {children}
    </td>
  );
}

export function TableMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-ink-faint">{children}</p>;
}
