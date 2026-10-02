'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { remboursableParJeko } from '@/features/remboursements';
import type { ModeRemboursement, Remboursement } from '@/features/remboursements';
import { JEKO } from '@/lib/capacites';
import { formatFcfa } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';

const TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  en_attente: 'warning',
  en_cours: 'warning',
  echoue: 'danger',
  rembourse: 'success',
};

const LIBELLE: Record<string, string> = {
  en_attente: 'À verser',
  en_cours: 'Transfert en cours',
  echoue: 'Échoué',
  rembourse: 'Remboursé',
};

export const OPTIONS_STATUT_REMBOURSEMENT = [
  { valeur: 'en_attente', label: 'À verser' },
  ...(JEKO
    ? [
        { valeur: 'en_cours', label: 'En cours' },
        { valeur: 'echoue', label: 'Échoués' },
      ]
    : []),
  { valeur: 'rembourse', label: 'Remboursés' },
  { valeur: 'tous', label: 'Tous' },
] as const;

export type FiltreStatutRemboursement = (typeof OPTIONS_STATUT_REMBOURSEMENT)[number]['valeur'];

/** À traiter par le gestionnaire : pas encore versé, ou transfert à relancer. */
export function estATraiter(r: Remboursement): boolean {
  return r.statut === 'en_attente' || r.statut === 'echoue';
}

export function StatutRemboursement({ r }: { r: Remboursement }) {
  return (
    <div>
      <Badge tone={TONE[r.statut] || 'neutral'}>{LIBELLE[r.statut] ?? r.statut.replace('_', ' ')}</Badge>
      {r.statut === 'echoue' && r.motifEchec && (
        <span className="mt-1 block max-w-[14rem] text-xs text-danger">{r.motifEchec}</span>
      )}
      {r.jekoReference && <span className="mt-1 block text-[11px] text-ink-faint">{r.jekoReference}</span>}
    </div>
  );
}

/** Demande confirmation avant le PATCH ; false si l'utilisateur annule. */
export function demanderConfirmation(r: Remboursement, mode: ModeRemboursement | undefined): boolean {
  const montant = formatFcfa(r.montantRembourse);
  if (mode === 'manuel' || !JEKO) {
    return confirm(
      `Marquer le remboursement #${r.id} (${montant}) comme versé ?\n` +
        'À faire uniquement si le voyageur a déjà été remboursé hors plateforme : ' +
        'le paiement passera au statut « remboursé ».',
    );
  }
  const tel = r.reservation?.paiement?.telephonePayeur;
  return confirm(
    `${r.statut === 'echoue' ? 'Relancer le transfert' : 'Rembourser'} ${montant} via Mobile Money ?\n` +
      `Le montant sera transféré automatiquement au numéro qui a payé${tel ? ` (${formatTelephone(tel)})` : ''}.`,
  );
}

export function ActionsRemboursement({
  r,
  enCours,
  onConfirmer,
}: {
  r: Remboursement;
  enCours: boolean;
  onConfirmer: (r: Remboursement, mode?: ModeRemboursement) => void;
}) {
  if (r.statut === 'en_cours') {
    return <span className="text-xs text-ink-faint">Attente opérateur…</span>;
  }
  if (!estATraiter(r)) return null;
  if (enCours) return <span className="text-xs text-ink-faint">...</span>;

  // Avant 0.28.0 : un seul bouton, PATCH sans body (constat manuel).
  if (!JEKO) {
    return (
      <Button variant="link-success" onClick={() => onConfirmer(r)}>
        Confirmer le versement
      </Button>
    );
  }

  if (!remboursableParJeko(r)) {
    return (
      <Button variant="link-success" onClick={() => onConfirmer(r, 'manuel')}>
        Marquer comme remboursé
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="link-success" onClick={() => onConfirmer(r)}>
        {r.statut === 'echoue' ? 'Relancer le transfert' : 'Rembourser via Mobile Money'}
      </Button>
      <button
        type="button"
        onClick={() => onConfirmer(r, 'manuel')}
        className="text-[11px] text-ink-faint hover:text-ink hover:underline"
      >
        Marquer comme remboursé manuellement
      </button>
    </div>
  );
}
