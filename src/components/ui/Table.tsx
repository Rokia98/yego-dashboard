import type { LucideIcon } from 'lucide-react';
import { Inbox, SearchX } from 'lucide-react';

type Align = 'left' | 'right' | 'center';
const ALIGN: Record<Align, string> = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Table({ children, minWidth = '640px' }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-surface-2/70 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap border-b border-line-soft px-5 py-2.5 font-semibold ${ALIGN[align]} ${className}`}>
      {children}
    </th>
  );
}

/** En-tête de la colonne d'actions (alignée à droite, largeur minimale). */
export function ThActions({ children = 'Actions' }: { children?: React.ReactNode }) {
  return (
    <Th align="right" className="w-px">
      {children}
    </Th>
  );
}

export function Tr({
  children,
  className = '',
  attenue = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Ligne inactive (désactivée, annulée…) : contenu légèrement estompé. */
  attenue?: boolean;
}) {
  return (
    <tr
      className={`group/ligne transition-colors hover:bg-surface-2/80 [&:last-child>td]:border-b-0 ${
        attenue ? '[&>td:not(:last-child)]:opacity-60' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  strong = false,
  className = '',
  colSpan,
  align = 'left',
}: {
  children?: React.ReactNode;
  strong?: boolean;
  className?: string;
  colSpan?: number;
  align?: Align;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-line-soft px-5 py-3.5 align-middle ${ALIGN[align]} ${
        strong ? 'font-medium text-ink' : 'text-ink-soft'
      } ${className}`}
    >
      {children}
    </td>
  );
}

/** Cellule d'actions : alignée à droite, jamais coupée. */
export function TdActions({ children }: { children: React.ReactNode }) {
  return (
    <td className="w-px whitespace-nowrap border-b border-line-soft py-2 pl-3 pr-4 text-right align-middle">
      {children}
    </td>
  );
}

/**
 * État vide / message d'un tableau. Les messages de type « Aucun … ne
 * correspond » prennent l'icône de recherche, les autres une boîte vide.
 */
export function TableMessage({
  children,
  icone,
  action,
}: {
  children: React.ReactNode;
  icone?: LucideIcon;
  action?: React.ReactNode;
}) {
  if (typeof children === 'string' && /^chargement/i.test(children)) return <TableChargement />;
  const Icone = icone ?? (typeof children === 'string' && /correspond|filtre/i.test(children) ? SearchX : Inbox);
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint ring-1 ring-line-soft">
        <Icone className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className="max-w-sm text-sm text-ink-soft">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Squelette de chargement : quelques lignes grisées animées. */
export function TableChargement({ lignes = 5 }: { lignes?: number }) {
  return (
    <div className="divide-y divide-line-soft" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="h-3 w-1/4 rounded-full bg-line-soft" />
          <div className="h-3 w-1/6 rounded-full bg-line-soft" />
          <div className="h-3 flex-1 rounded-full bg-line-soft/70" />
          <div className="h-5 w-16 rounded-full bg-line-soft" />
        </div>
      ))}
    </div>
  );
}
