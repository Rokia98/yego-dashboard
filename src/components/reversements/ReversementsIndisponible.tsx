import { Banknote } from 'lucide-react';

/** Affiché tant que l'intégration Jèko n'est pas déployée côté API (lib/capacites.ts). */
export default function ReversementsIndisponible() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-10 text-center shadow-subtle">
      <Banknote className="mb-3 h-8 w-8 text-ink-faint" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">Reversements en cours de déploiement</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">
        Les écrans sont prêts ; ils s’activeront dès que la version de l’API qui gère les paiements en ligne Jèko sera
        en ligne.
      </p>
    </div>
  );
}
