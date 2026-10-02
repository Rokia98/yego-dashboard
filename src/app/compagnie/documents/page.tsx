'use client';

import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';

export default function DocumentsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Documents"
        subtitle="Pièces justificatives de votre compagnie, revues par l'équipe Yègo pour valider votre inscription."
      />

      <Card>
        <CardHeader
          title="Registre de commerce, autorisation de transport, pièce d'identité du gérant…"
          subtitle="PDF, PNG ou JPEG — 5 Mo maximum par fichier."
        />
        <div className="p-5">
          {user?.compagnieId ? (
            <DocumentsPanel compagnieId={user.compagnieId} peutTeleverser />
          ) : (
            <p className="py-6 text-center text-sm text-ink-faint">Aucune compagnie associée à ce compte.</p>
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
