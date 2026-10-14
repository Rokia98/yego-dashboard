'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import BoiteSupport from '@/components/support/BoiteSupport';
import SupportIndisponible from '@/components/support/SupportIndisponible';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { MODULE_SUPPORT } from '@/lib/capacites';
import { gestionnaireSupport } from '@/features/support';

export default function CompagnieSupportPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Support"
        subtitle={
          gestionnaireSupport(user)
            ? 'Répondez aux demandes des voyageurs sur vos réservations, et suivez vos propres demandes à l’équipe Yègo.'
            : 'Vos demandes à l’équipe Yègo : ouvrez-en une, suivez les réponses, clôturez-la une fois réglée.'
        }
      />
      {MODULE_SUPPORT ? <BoiteSupport espace="compagnie" user={user} /> : <SupportIndisponible />}
    </DashboardShell>
  );
}
