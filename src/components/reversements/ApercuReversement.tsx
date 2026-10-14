import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { estBloque, MOYENS_REVERSEMENT } from '@/features/reversements';
import type { ApercuReversement as Apercu } from '@/features/reversements';
import { formatDateHeure, formatFcfa } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';
import { DEMANDES_REVERSEMENT } from '@/lib/capacites';

function Ligne({ label, valeur, fort = false }: { label: string; valeur: React.ReactNode; fort?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft py-2 text-sm last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className={`text-right tabular-nums ${fort ? 'font-semibold text-accent-ink' : 'text-ink'}`}>{valeur}</span>
    </div>
  );
}

/** Ce qui serait reversé maintenant : paiements Jèko des départs passés + frais retenus des remboursements soldés. */
export default function ApercuReversement({
  apercu,
  titre = 'Prochain reversement',
  actionBlocage,
  children,
}: {
  apercu: Apercu;
  titre?: string;
  /** Action proposée dans le bandeau de blocage (admin : « Confirmer le compte »). */
  actionBlocage?: React.ReactNode;
  children?: React.ReactNode; // action (bouton admin)
}) {
  const c = apercu.coordonnees;
  const moyen = MOYENS_REVERSEMENT.find((m) => m.valeur === c?.moyen)?.label ?? c?.moyen;
  const pourcent = Number(apercu.commissionPourcent);

  return (
    <Card>
      <CardHeader
        title={titre}
        subtitle="Billets payés en ligne dont le départ est passé, et frais retenus sur les annulations."
        right={`${apercu.nombrePaiements} paiement${apercu.nombrePaiements > 1 ? 's' : ''}`}
      />
      <div className="px-5 py-3">
        <Ligne label="Montant brut" valeur={formatFcfa(apercu.montantBrut)} />
        <Ligne
          label={`Commission Yègo${Number.isFinite(pourcent) ? ` (${pourcent.toLocaleString('fr-FR')} %)` : ''}`}
          valeur={`− ${formatFcfa(apercu.commission)}`}
        />
        <Ligne label="Net à reverser" valeur={formatFcfa(apercu.montantNet)} fort />
        {DEMANDES_REVERSEMENT ? (
          <Ligne label="Versement" valeur="Remis en main propre par Yègo" />
        ) : (
          <Ligne
            label="Bénéficiaire"
            valeur={
              c?.telephone ? `${moyen} · ${formatTelephone(c.telephone)}` : <span className="text-danger">Non renseigné</span>
            }
          />
        )}
      </div>
      {!DEMANDES_REVERSEMENT && estBloque(apercu) && (
        <div className="flex flex-col gap-2 border-t border-line-soft bg-warning-soft px-5 py-3 text-xs text-warning sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-1.5">
            <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Compte modifié par la compagnie — reversement possible le {formatDateHeure(apercu.bloqueJusquA)}.
          </p>
          {actionBlocage}
        </div>
      )}
      {(apercu.plafondAtteint || apercu.reversementsEnCours > 0) && (
        <div className="space-y-1.5 border-t border-line-soft px-5 py-3 text-xs text-warning">
          {apercu.plafondAtteint && (
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Plafond de 2 000 000 FCFA par reversement atteint : le reste sera versé lors d’un reversement suivant.
            </p>
          )}
          {apercu.reversementsEnCours > 0 && (
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {apercu.reversementsEnCours} reversement{apercu.reversementsEnCours > 1 ? 's' : ''} en cours
              {DEMANDES_REVERSEMENT ? ' de transfert vers Yègo.' : ' chez l’opérateur.'}
            </p>
          )}
        </div>
      )}
      {children && <div className="border-t border-line-soft px-5 py-4">{children}</div>}
    </Card>
  );
}
