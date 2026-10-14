import { CheckCircle2, Clock, Hourglass, Wallet } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import type { SoldeCompagnie as Solde } from '@/features/reversements';
import { formatDate, formatFcfa } from '@/lib/format';

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}

/**
 * Solde de la compagnie chez Yègo (GET /dashboard/solde) : ventes en ligne
 * encaissées via Jèko, nettes de commission, remises en main propre par Yègo.
 * `solde` null = chargement.
 */
export default function SoldeCompagnie({ solde }: { solde: Solde | null }) {
  const v = (montant: string | undefined) => (solde ? formatFcfa(montant) : '…');
  const dernier = solde?.dernierReversement;

  return (
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
}
