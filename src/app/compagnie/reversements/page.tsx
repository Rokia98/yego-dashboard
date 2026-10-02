'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import ApercuReversement from '@/components/reversements/ApercuReversement';
import CoordonneesReversement from '@/components/reversements/CoordonneesReversement';
import HistoriqueReversements from '@/components/reversements/HistoriqueReversements';
import ReversementsIndisponible from '@/components/reversements/ReversementsIndisponible';
import { reversementsApi } from '@/features/reversements';
import type { ApercuReversement as Apercu } from '@/features/reversements';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { JEKO } from '@/lib/capacites';

// Lecture seule : c'est l'équipe Yègo qui déclenche les reversements.
export default function MesReversementsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerApercu = useCallback(() => {
    setErreur(null);
    reversementsApi
      .apercu()
      .then(setApercu)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Erreur de chargement'));
  }, []);

  useEffect(() => {
    if (ready && JEKO) chargerApercu();
  }, [ready, chargerApercu]);

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Reversements"
        subtitle="Recettes des billets vendus en ligne, versées par Yègo sur votre compte Mobile Money (commission déduite) à partir du lendemain du départ."
      />

      {!JEKO ? (
        <ReversementsIndisponible />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {erreur ? (
              <Card className="p-5 text-sm text-danger">{erreur}</Card>
            ) : apercu ? (
              <ApercuReversement apercu={apercu} titre="À venir" />
            ) : (
              <Card className="p-5 text-sm text-ink-faint">Chargement…</Card>
            )}
            {user?.compagnieId != null && (
              <CoordonneesReversement compagnieId={user.compagnieId} onEnregistre={chargerApercu} />
            )}
          </div>

          <HistoriqueReversements />
        </>
      )}
    </DashboardShell>
  );
}
