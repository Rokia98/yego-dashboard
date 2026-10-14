import { CheckCircle2, Clock, Globe, Hourglass, Landmark, Store, Wallet } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { SoldeCompagnie as Solde } from '@/features/reversements';
import { LIBELLE_MOYEN_PAIEMENT } from '@/features/paiements';
import { SOLDE_PAR_CANAL } from '@/lib/capacites';
import { formatDate, formatFcfa } from '@/lib/format';

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}

/** Répartition du guichet par moyen de paiement, ex. « Espèces 45 000 · Wave 12 000 ». */
function detailMoyens(parMoyen: Record<string, string> | undefined): string | undefined {
  if (!parMoyen) return undefined;
  const lignes = Object.entries(parMoyen)
    .filter(([, m]) => Number(m) > 0)
    .map(([moyen, m]) => `${LIBELLE_MOYEN_PAIEMENT[moyen] ?? moyen} ${Number(m).toLocaleString('fr-FR')}`);
  return lignes.length ? lignes.join(' · ') : undefined;
}

function Titre({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">{children}</h2>;
}

/**
 * Solde de la compagnie (GET /dashboard/solde). Avec SOLDE_PAR_CANAL : total,
 * ventes en ligne (encaissées par Yègo via Jèko, remises sur demande) et ventes
 * au guichet (encaissées par la compagnie), puis le détail des ventes en ligne.
 * `solde` null = chargement.
 */
export default function SoldeCompagnie({ solde }: { solde: Solde | null }) {
  const v = (montant: string | undefined) => (solde ? formatFcfa(montant) : '…');
  const dernier = solde?.dernierReversement;
  const parCanal = SOLDE_PAR_CANAL && (solde == null || solde.guichet != null);

  const detailEnLigne = (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Disponible"
        value={v(solde?.disponible.montantNet)}
        icon={Wallet}
        detail={solde ? `${pluriel(solde.disponible.nombrePaiements, 'paiement')} · reversable maintenant` : undefined}
      />
      <StatCard
        label="En attente"
        value={v(solde?.enAttente.montantNet)}
        icon={Hourglass}
        detail={solde ? 'Départs à venir, remboursements non soldés' : undefined}
      />
      <StatCard
        label="En cours de remise"
        value={v(solde?.enCoursDeReversement.montant)}
        icon={Clock}
        detail={solde ? `${pluriel(solde.enCoursDeReversement.nombre, 'validé')} par Yègo, pas encore remis` : undefined}
      />
      <StatCard
        label="Déjà reçu"
        value={v(solde?.totalReverse.montant)}
        icon={CheckCircle2}
        detail={
          dernier
            ? `Dernière remise : ${formatFcfa(dernier.montantNet)} le ${formatDate(dernier.remisLe)}`
            : solde
              ? 'Aucune remise pour le moment'
              : undefined
        }
      />
    </div>
  );

  if (!parCanal) return detailEnLigne;

  const guichet = solde?.guichet;
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Solde global"
          value={v(solde?.global?.total)}
          icon={Landmark}
          detail={solde ? 'Ventes en ligne + ventes au guichet' : undefined}
        />
        <StatCard
          label="Ventes en ligne"
          value={v(solde?.enLigne?.total)}
          icon={Globe}
          detail={solde ? 'Payées via Jèko : encaissées par Yègo, remises sur demande' : undefined}
        />
        <StatCard
          label="Ventes au guichet"
          value={v(guichet?.encaisse)}
          icon={Store}
          detail={
            guichet
              ? (detailMoyens(guichet.parMoyen) ??
                `${pluriel(guichet.nombrePaiements, 'paiement')} encaissé${guichet.nombrePaiements > 1 ? 's' : ''} par la compagnie`) +
                (Number(guichet.rembourse) > 0 ? ` · ${formatFcfa(guichet.rembourse)} remboursés` : '')
              : undefined
          }
        />
      </div>
      <Titre>Ventes en ligne — détail</Titre>
      {detailEnLigne}
    </>
  );
}
