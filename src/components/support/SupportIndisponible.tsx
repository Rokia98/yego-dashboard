import { LifeBuoy } from 'lucide-react';

/** Affiché tant que le module support n'est pas déployé côté API (lib/capacites.ts). */
export default function SupportIndisponible() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-10 text-center shadow-subtle">
      <LifeBuoy className="mb-3 h-8 w-8 text-ink-faint" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">Module support en cours de déploiement</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">
        Les écrans sont prêts ; ils s’activeront dès que la version de l’API qui gère les demandes de support sera en
        ligne.
      </p>
    </div>
  );
}
