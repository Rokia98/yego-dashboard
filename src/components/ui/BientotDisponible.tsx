import type { LucideIcon } from 'lucide-react';

/** Écran d'attente d'une fonctionnalité dont la version de l'API n'est pas encore déployée (lib/capacites.ts). */
export default function BientotDisponible({ icon: Icon, titre, texte }: { icon: LucideIcon; titre: string; texte: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-10 text-center shadow-subtle">
      <Icon className="mb-3 h-8 w-8 text-ink-faint" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">{titre}</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{texte}</p>
    </div>
  );
}
