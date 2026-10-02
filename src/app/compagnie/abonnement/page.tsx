'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { abonnementsApi } from '@/features/abonnements';
import type { Abonnement } from '@/features/abonnements';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatDate, formatFcfa } from '@/lib/format';

const BADGE_TONE = {
  actif: 'success',
  expire: 'danger',
} as const;

export default function AbonnementPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user?.compagnieId) {
      setChargement(false);
      return;
    }
    abonnementsApi
      .listByCompagnie(user.compagnieId)
      .then(setAbonnements)
      .catch(() => setAbonnements([]))
      .finally(() => setChargement(false));
  }, [ready, user]);

  if (!ready) return null;

  const courant = abonnements.find(
    (a) => a.statut === 'actif' && new Date(a.dateFin) > new Date(),
  );
  const joursRestants = courant
    ? Math.max(0, Math.ceil((new Date(courant.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Abonnement plateforme"
        subtitle="Votre compagnie doit avoir un abonnement actif pour vendre des tickets. Le renouvellement est géré par l'équipe Yègo."
      />

      {chargement ? (
        <p className="text-sm text-ink-faint">Chargement...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Statut" value={courant ? 'Actif' : 'Aucun abonnement actif'} detail={courant?.plan} />
            <StatCard label="Jours restants" value={courant ? joursRestants : '—'} detail="Avant expiration" />
            <StatCard
              label="Échéance"
              value={courant ? new Date(courant.dateFin).toLocaleDateString('fr-FR') : '—'}
              detail="Date de fin d'abonnement"
            />
          </div>

          {!courant && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning-soft p-5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              <p>
                Aucun abonnement actif : votre compagnie n&apos;apparaît pas dans la recherche voyageur et ne peut pas vendre de tickets.
                Contactez l&apos;équipe Yègo pour renouveler.
              </p>
            </div>
          )}

          <Card>
            <CardHeader title="Historique des abonnements" right={`${abonnements.length} enregistrement${abonnements.length > 1 ? 's' : ''}`} />
            {abonnements.length === 0 ? (
              <TableMessage>Aucun abonnement enregistré.</TableMessage>
            ) : (
              <Table minWidth="560px">
                <THead>
                  <Th>Plan</Th>
                  <Th>Montant</Th>
                  <Th>Début</Th>
                  <Th>Fin</Th>
                  <Th>Statut</Th>
                </THead>
                <tbody>
                  {abonnements.map((a) => (
                    <Tr key={a.id}>
                      <Td strong>{a.plan}</Td>
                      <Td className="tabular-nums">{formatFcfa(a.montant)}</Td>
                      <Td>{formatDate(a.dateDebut)}</Td>
                      <Td>{formatDate(a.dateFin)}</Td>
                      <Td>
                        <Badge tone={BADGE_TONE[a.statut as keyof typeof BADGE_TONE] || 'neutral'}>{a.statut}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
