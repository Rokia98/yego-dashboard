'use client';

import { useCallback, useMemo, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import {
  ActionsRemboursement,
  StatutRemboursement,
  OPTIONS_STATUT_REMBOURSEMENT,
  demanderConfirmation,
  estATraiter,
  type FiltreStatutRemboursement,
} from '@/components/remboursements/ActionsRemboursement';
import StatCard from '@/components/ui/StatCard';
import Pagination from '@/components/ui/Pagination';
import { remboursementsApi, nomBeneficiaire, libelleTrajetRemboursement } from '@/features/remboursements';
import type { ModeRemboursement, Remboursement } from '@/features/remboursements';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { usePagedList } from '@/lib/pagination';
import { normaliser, useFiltres } from '@/lib/filtres';
import { formatDate, formatFcfa } from '@/lib/format';
import { BAREME_ANNULATION } from '@/lib/annulation';
import { JEKO } from '@/lib/capacites';

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

export default function RemboursementsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [enCours, setEnCours] = useState<number | null>(null);
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
    if (!demanderConfirmation(r, mode)) return;
    setEnCours(r.id);
    try {
      const maj = await remboursementsApi.confirmer(r.id, mode);
      liste.fusionner((x) => x.id === r.id, { ...r, ...maj });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la confirmation');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const enAttente = liste.items.filter(estATraiter);
  const montantEnAttente = enAttente.reduce((s, r) => s + Number(r.montantRembourse || 0), 0);

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Remboursements"
        subtitle={
          JEKO
            ? 'Réservations annulées : les billets payés en ligne sont remboursés par transfert Mobile Money ; ceux du guichet se versent hors plateforme puis se confirment ici.'
            : 'Réservations annulées : versez le montant dû au voyageur, puis confirmez ici.'
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="En attente (affichés)" value={enAttente.length} detail={JEKO ? 'À verser ou à relancer' : 'À verser puis confirmer'} />
        <StatCard
          label="Montant en attente (affichés)"
          value={formatFcfa(montantEnAttente)}
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

      <Card className="mb-6">
        <CardHeader title="Demandes de remboursement" right={`${liste.items.length} affichée${liste.items.length > 1 ? 's' : ''}`} />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <TableMessage>{filtres.nbActifs > 0 ? 'Aucun remboursement pour ces filtres.' : 'Aucun remboursement à verser.'}</TableMessage>
        ) : (
          <>
            <Table minWidth="820px">
              <THead>
                <Th>Réservation</Th>
                <Th>Voyageur</Th>
                <Th>Demandé le</Th>
                <Th>Frais retenus</Th>
                <Th>À rembourser</Th>
                <Th>Statut</Th>
                <Th>Action</Th>
              </THead>
              <tbody>
                {liste.pageItems.map((r) => (
                  <Tr key={r.id}>
                    <Td strong>
                      #{r.reservationId}
                      {libelleTrajetRemboursement(r) && (
                        <span className="block text-xs font-normal text-ink-faint">{libelleTrajetRemboursement(r)}</span>
                      )}
                    </Td>
                    <Td>{nomBeneficiaire(r)}</Td>
                    <Td>{formatDate(r.dateDemande)}</Td>
                    <Td className="tabular-nums">{formatFcfa(r.fraisRetenus)}</Td>
                    <Td className="tabular-nums font-medium text-accent-ink">{formatFcfa(r.montantRembourse)}</Td>
                    <Td>
                      <StatutRemboursement r={r} />
                    </Td>
                    <Td>
                      <ActionsRemboursement r={r} enCours={enCours === r.id} onConfirmer={handleConfirmer} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination pagination={liste.pagination} />
          </>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">Barème appliqué (frais retenus par la plateforme)</h2>
        <ul className="space-y-1.5 text-sm text-ink-soft">
          {BAREME_ANNULATION.map((b) => (
            <li key={b.seuil} className="flex justify-between border-b border-line-soft pb-1.5 last:border-0">
              <span>{b.seuil}</span>
              <span className="font-medium text-ink">{b.frais}</span>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardShell>
  );
}
