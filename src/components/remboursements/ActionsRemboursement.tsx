'use client';

import { CheckCheck, Hourglass, RotateCcw, Send } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import type { OptionsConfirmation } from '@/components/ui/Dialogues';
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

/** Contenu de la boîte de confirmation affichée avant le PATCH. */
export function confirmationRemboursement(r: Remboursement, mode: ModeRemboursement | undefined): OptionsConfirmation {
  const montant = formatFcfa(r.montantRembourse);
  if (mode === 'manuel' || !JEKO) {
    return {
      titre: `Marquer le remboursement #${r.id} comme versé ?`,
      message:
        `Montant : ${montant}.\n` +
        'À faire uniquement si le voyageur a déjà été remboursé hors plateforme : ' +
        'le paiement passera au statut « remboursé ».',
      libelleConfirmer: 'Marquer comme versé',
      ton: 'warning',
    };
  }
  const tel = r.reservation?.paiement?.telephonePayeur;
  const relance = r.statut === 'echoue';
  return {
    titre: `${relance ? 'Relancer le transfert de' : 'Rembourser'} ${montant} via Mobile Money ?`,
    message: `Le montant sera transféré automatiquement au numéro qui a payé${tel ? ` (${formatTelephone(tel)})` : ''}.`,
    libelleConfirmer: relance ? 'Relancer le transfert' : 'Rembourser',
    ton: 'success',
  };
}

export function ActionsRemboursement({
  r,
  enCours,
  onConfirmer,
  manuelSurJeko = true,
}: {
  r: Remboursement;
  enCours: boolean;
  onConfirmer: (r: Remboursement, mode?: ModeRemboursement) => void;
  /**
   * Constat manuel proposé même quand le transfert Jèko est possible. API 0.30.1+ :
   * réservé à l'admin plateforme, le company_admin reçoit un 403 sur un billet payé
   * via Jèko et pas encore reversé.
   */
  manuelSurJeko?: boolean;
}) {
  if (r.statut === 'en_cours') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-medium text-warning">
        <Hourglass className="h-3 w-3" strokeWidth={2} /> Attente opérateur
      </span>
    );
  }
  if (!estATraiter(r)) return null;

  // Avant 0.28.0 : un seul bouton, PATCH sans body (constat manuel).
  if (!JEKO) {
    return (
      <Actions>
        <ActionIcone icone={CheckCheck} label="Confirmer le versement" ton="success" chargement={enCours} onClick={() => onConfirmer(r)} />
      </Actions>
    );
  }

  if (!remboursableParJeko(r)) {
    return (
      <Actions>
        <ActionIcone icone={CheckCheck} label="Marquer comme remboursé" ton="success" chargement={enCours} onClick={() => onConfirmer(r, 'manuel')} />
      </Actions>
    );
  }

  return (
    <Actions>
      {!manuelSurJeko && (
        <span className="mr-1 max-w-[11rem] whitespace-normal text-right text-[11px] leading-tight text-ink-faint">
          Remboursement manuel via l’équipe Yègo
        </span>
      )}
      <ActionIcone
        icone={r.statut === 'echoue' ? RotateCcw : Send}
        label={r.statut === 'echoue' ? 'Relancer le transfert' : 'Rembourser via Mobile Money'}
        ton="success"
        chargement={enCours}
        onClick={() => onConfirmer(r)}
      />
      {manuelSurJeko && (
        <MenuActions
          disabled={enCours}
          items={[{ label: 'Marquer comme remboursé manuellement', icone: CheckCheck, ton: 'warning', onClick: () => onConfirmer(r, 'manuel') }]}
        />
      )}
    </Actions>
  );
}
