'use client';

import { useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { FiltresBar, FiltreSelect } from '@/components/ui/Filtres';
import { auditApi, ACTIONS_AUDIT, ENTITES_AUDIT, libelleAction } from '@/features/audit';
import type { AuditLog } from '@/features/audit';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { formatDateHeure } from '@/lib/format';

type Filtres = { entite: string; action: string };
const DEFAUTS: Filtres = { entite: '', action: '' };

export default function AuditPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const filtres = useFiltres<Filtres>(DEFAUTS);
  const f = filtres.appliques;

  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      auditApi.list({ take, skip, entite: f.entite || undefined, action: f.action || undefined }),
    [f],
  );
  const liste = usePagedList<AuditLog>(fetcher, ready ? filtres.cle : 'wait', 20);

  if (!ready) return null;

  const actionsProposees = ACTIONS_AUDIT.filter((a) => !filtres.valeurs.entite || a.entite === filtres.valeurs.entite);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Journal d’audit"
        subtitle="Traçabilité des actions sensibles sur la plateforme."
      />

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreSelect
          label="Entité"
          value={filtres.valeurs.entite}
          onChange={(v) => {
            filtres.set('entite', v);
            // L'action choisie doit appartenir à l'entité.
            if (v && ACTIONS_AUDIT.find((a) => a.valeur === filtres.valeurs.action)?.entite !== v) filtres.set('action', '');
          }}
          options={ENTITES_AUDIT}
          tous="Toutes"
          className="w-full sm:w-48"
        />
        <FiltreSelect
          label="Événement"
          value={filtres.valeurs.action}
          onChange={(v) => filtres.set('action', v)}
          options={actionsProposees}
          tous="Tous"
          className="w-full sm:w-60"
        />
      </FiltresBar>

      <Card>
        <CardHeader title="Événements" right={`${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}${liste.aSuite ? '+' : ''}`} />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <TableMessage>{filtres.nbActifs > 0 ? 'Aucun événement pour ces filtres.' : 'Aucun événement.'}</TableMessage>
        ) : (
          <>
            <Table minWidth="880px">
              <THead>
                <Th>Date</Th>
                <Th>Événement</Th>
                <Th>Objet</Th>
                <Th>Acteur</Th>
                <Th>Détails</Th>
              </THead>
              <tbody>
                {liste.pageItems.map((l) => (
                  <Tr key={l.id}>
                    <Td strong>{formatDateHeure(l.dateCreation)}</Td>
                    <Td>{libelleAction(l.action)}</Td>
                    <Td>
                      {l.entite}
                      {l.entiteId != null ? ` #${l.entiteId}` : ''}
                    </Td>
                    <Td>
                      {l.acteur
                        ? `${l.acteur.nom}${l.acteur.role ? ` (${l.acteur.role})` : ''}`
                        : l.acteurId != null
                          ? `#${l.acteurId}${l.acteurRole ? ` (${l.acteurRole})` : ''}`
                          : '—'}
                    </Td>
                    <Td>
                      <code
                        className="block max-w-md truncate rounded bg-line-soft px-1.5 py-0.5 text-[11px] text-ink-soft"
                        title={l.metadata ? JSON.stringify(l.metadata) : undefined}
                      >
                        {l.metadata ? JSON.stringify(l.metadata) : '—'}
                      </code>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination pagination={liste.pagination} />
          </>
        )}
      </Card>
    </DashboardShell>
  );
}
