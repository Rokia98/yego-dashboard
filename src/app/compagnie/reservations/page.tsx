'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import ListeReservations from '@/components/reservations/ListeReservations';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';

export default function ReservationsPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Réservations"
        subtitle="Retrouvez un voyageur, encaissez une vente guichet ou annulez une réservation."
      />
      <ListeReservations espace="compagnie" />
    </DashboardShell>
  );
}
