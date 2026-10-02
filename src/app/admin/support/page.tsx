'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import BoiteSupport from '@/components/support/BoiteSupport';
import SupportIndisponible from '@/components/support/SupportIndisponible';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { MODULE_SUPPORT } from '@/lib/capacites';

export default function SupportPage() {
  const { user, ready } = useAuthGuard(['admin']);

  if (!ready) return null;

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Support"
        subtitle="Demandes des compagnies et des voyageurs : prenez-les en charge, répondez, résolvez."
      />
      {MODULE_SUPPORT ? <BoiteSupport espace="admin" user={user} /> : <SupportIndisponible />}
    </DashboardShell>
  );
}
