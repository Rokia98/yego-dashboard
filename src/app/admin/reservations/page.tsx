'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import ListeReservations from '@/components/reservations/ListeReservations';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';

export default function AdminReservationsPage() {
  const { user, ready } = useAuthGuard(['admin']);

  if (!ready) return null;

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Réservations"
        subtitle="Toutes les réservations du réseau, en ligne et au guichet."
      />
      <ListeReservations espace="admin" />
    </DashboardShell>
  );
}
