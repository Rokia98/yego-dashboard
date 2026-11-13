'use client';

import { useCallback, useMemo, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import {
  ActionsRemboursement,
  StatutRemboursement,
  OPTIONS_STATUT_REMBOURSEMENT,
  confirmationRemboursement,
  estATraiter,
  type FiltreStatutRemboursement,
} from '@/components/remboursements/ActionsRemboursement';
import StatCard from '@/components/ui/StatCard';
import Pagination from '@/components/ui/Pagination';
import { remboursementsApi, nomBeneficiaire } from '@/features/remboursements';
import type { ModeRemboursement, Remboursement } from '@/features/remboursements';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { usePagedList } from '@/lib/pagination';
import { normaliser, useFiltres } from '@/lib/filtres';
import { formatDate, formatFcfa } from '@/lib/format';

type Filtres = { statut: FiltreStatutRemboursement; q: string };
const DEFAUTS: Filtres = { statut: 'en_attente', q: '' };

// Recherche locale (l'API ne filtre les remboursements que par statut).
function correspond(r: Remboursement, q: string): boolean {
  const n = normaliser(q).replace(/^#/, '');
  if (!n) return true;
  if (/^\d+$/.test(n) && (String(r.id) === n || String(r.reservationId) === n)) return true;
  const rr = r.reservation;
  const tel = (rr?.utilisateur?.telephone ?? rr?.passagerTelephone ?? '').replace(/\D/g, '');
  const chiffres = q.replace(/\D/g, '');
  if (chiffres.length >= 4 && tel.includes(chiffres)) return true;
  return normaliser(nomBeneficiaire(r)).includes(n);
}

export default function AdminRemboursementsPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [enCours, setEnCours] = useState<number | null>(null);
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const filtres = useFiltres<Filtres>(DEFAUTS, 'q');
  const filtre = filtres.appliques.statut;
  const q = filtres.appliques.q;

  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      filtre === 'tous'
        ? remboursementsApi.list({ take, skip })
        : remboursementsApi.listParStatut(filtre, { take, skip }),
    [filtre],
  );
  const filtreLocal = useMemo(() => (q.trim() ? (r: Remboursement) => correspond(r, q) : undefined), [q]);
  const liste = usePagedList<Remboursement>(fetcher, ready ? filtres.cle : 'wait', 20, { filtreLocal });

  async function handleConfirmer(r: Remboursement, mode?: ModeRemboursement) {
    if (!(await confirmer(confirmationRemboursement(r, mode)))) return;
    setEnCours(r.id);
    try {
      const maj = await remboursementsApi.confirmer(r.id, mode);
      liste.fusionner((x) => x.id === r.id, { ...r, ...maj });
      notifier.succes(maj.statut === 'en_cours' ? 'Transfert lancé : en attente de l’opérateur.' : 'Remboursement enregistré.');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors de la confirmation');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const enAttente = liste.items.filter(estATraiter);
  const montant = enAttente.reduce((s, r) => s + Number(r.montantRembourse || 0), 0);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Remboursements"
        subtitle="Supervision des remboursements de tout le réseau."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="En attente (affichés)" value={enAttente.length} detail="Parmi les lignes chargées" />
        <StatCard
          label="Montant en attente (affichés)"
          value={formatFcfa(montant)}
          detail={liste.aSuite ? 'Partiel — chargez la suite pour le total' : 'Total dû aux voyageurs'}
        />
        <StatCard label="Affichés" value={liste.items.length} detail={liste.aSuite ? 'D’autres pages sont disponibles' : 'Fin de liste'} />
      </div>

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreSegments
          label="Statut"
          value={filtres.valeurs.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={[...OPTIONS_STATUT_REMBOURSEMENT]}
        />
        <FiltreRecherche
          label="Recherche"
          value={filtres.valeurs.q}
          onChange={(v) => filtres.set('q', v)}
          placeholder="Voyageur, téléphone ou n°"
        />
      </FiltresBar>

      <Card>
        <CardHeader title="Remboursements" right={`${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}`} />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <TableMessage>{filtres.nbActifs > 0 ? 'Aucun remboursement pour ces filtres.' : 'Aucun remboursement à verser.'}</TableMessage>
        ) : (
          <>
            <Table minWidth="880px">
              <THead>
                <Th>#</Th>
                <Th>Réservation</Th>
                <Th>Bénéficiaire</Th>
                <Th>Demandé le</Th>
                <Th align="right">Frais</Th>
                <Th align="right">Montant</Th>
                <Th>Statut</Th>
                <ThActions />
              </THead>
              <tbody>
                {liste.pageItems.map((r) => (
                  <Tr key={r.id}>
                    <Td strong>{r.id}</Td>
                    <Td>#{r.reservationId}</Td>
                    <Td>{nomBeneficiaire(r)}</Td>
                    <Td>{formatDate(r.dateDemande)}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{formatFcfa(r.fraisRetenus)}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums font-semibold text-accent-ink">{formatFcfa(r.montantRembourse)}</Td>
                    <Td>
                      <StatutRemboursement r={r} />
                    </Td>
                    <TdActions>
                      <ActionsRemboursement r={r} enCours={enCours === r.id} onConfirmer={handleConfirmer} />
                    </TdActions>
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
