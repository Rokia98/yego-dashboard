'use client';

import { useCallback, useMemo } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import LoadMore from '@/components/ui/LoadMore';
import { FiltresBar, FiltrePeriode, FiltreSegments } from '@/components/ui/Filtres';
import { ticketsApi } from '@/features/tickets';
import type { BilletScanne } from '@/features/tickets';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { usePagedList } from '@/lib/pagination';
import { dansPeriode, jourIso, useFiltres } from '@/lib/filtres';
import { FILTRES_VALIDATIONS_SERVEUR } from '@/lib/capacites';
import { formatDateHeure, formatHeure, formatDate } from '@/lib/format';

const BADGE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  valide: 'success',
  deja_utilise: 'warning',
  annule: 'danger',
  introuvable: 'danger',
  refuse_hors_compagnie: 'danger',
  reservation_annulee: 'danger',
  non_paye: 'danger',
  mauvaise_date: 'warning',
  mauvais_depart: 'warning',
};

const LIBELLE_RESULTAT: Record<string, string> = {
  valide: 'Validé',
  deja_utilise: 'Déjà utilisé',
  annule: 'Ticket annulé',
  introuvable: 'Introuvable',
  refuse_hors_compagnie: 'Autre compagnie',
  reservation_annulee: 'Réservation annulée',
  non_paye: 'Non payé',
  mauvaise_date: 'Mauvaise date',
  mauvais_depart: 'Mauvais départ',
};

type Filtres = { resultat: '' | 'valide' | 'refuse'; du: string; au: string };
const DEFAUTS: Filtres = { resultat: '', du: '', au: '' };

export default function ControlesPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const filtres = useFiltres<Filtres>(DEFAUTS);
  const f = filtres.appliques;

  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      ticketsApi.validations({ take, skip, resultat: f.resultat || undefined, du: f.du || undefined, au: f.au || undefined }),
    [f],
  );
  const filtreLocal = useMemo(
    () =>
      FILTRES_VALIDATIONS_SERVEUR || filtres.nbActifs === 0
        ? undefined
        : (s: BilletScanne) =>
            (!f.resultat || (f.resultat === 'valide') === (s.resultat === 'valide')) && dansPeriode(s.date, f.du, f.au),
    [f, filtres.nbActifs],
  );
  const liste = usePagedList<BilletScanne>(fetcher, ready ? filtres.cle : 'wait', 20, { filtreLocal });

  if (!ready) return null;

  const valides = liste.items.filter((s) => s.resultat === 'valide').length;
  const refuses = liste.items.length - valides;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Contrôles à l’embarquement"
        subtitle={
          user?.role === 'agent'
            ? 'Historique de vos scans (lecture seule — le scan se fait sur l’app agent).'
            : 'Historique des tickets scannés par vos contrôleurs (lecture seule — le scan se fait sur l’app agent).'
        }
      />

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreSegments
          label="Résultat"
          value={filtres.valeurs.resultat}
          onChange={(v) => filtres.set('resultat', v)}
          options={[
            { valeur: '', label: 'Tous' },
            { valeur: 'valide', label: 'Validés' },
            { valeur: 'refuse', label: 'Refusés' },
          ]}
        />
        <FiltrePeriode
          label="Date du scan"
          du={filtres.valeurs.du}
          au={filtres.valeurs.au}
          onChange={(du, au) => {
            filtres.set('du', du);
            filtres.set('au', au);
          }}
          raccourcis={[
            { label: 'Aujourd’hui', du: jourIso(0), au: jourIso(0) },
            { label: 'Hier', du: jourIso(-1), au: jourIso(-1) },
            { label: '7 derniers jours', du: jourIso(-6), au: jourIso(0) },
          ]}
        />
      </FiltresBar>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Scans affichés" value={`${liste.items.length}${liste.aSuite ? '+' : ''}`} />
        <StatCard label="Validés (affichés)" value={valides} detail="Embarquements OK" />
        <StatCard label="Refusés (affichés)" value={refuses} detail="À surveiller" />
      </div>

      <Card>
        <CardHeader title="Journal des scans" right={`${liste.items.length} entrée${liste.items.length > 1 ? 's' : ''}${liste.aSuite ? '+' : ''}`} />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <>
            <TableMessage>
              {filtres.nbActifs > 0 ? 'Aucun scan ne correspond à ces filtres.' : 'Aucun scan enregistré pour le moment.'}
            </TableMessage>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={0} />
          </>
        ) : (
          <>
            <Table minWidth="880px">
              <THead>
                <Th>Date du scan</Th>
                <Th>Trajet</Th>
                <Th>Départ</Th>
                <Th>Siège</Th>
                <Th>Résultat</Th>
              </THead>
              <tbody>
                {liste.items.map((s, i) => {
                  const t = s.reservation?.depart.trajet;
                  return (
                    <Tr key={`${s.ticketId ?? 'x'}-${s.date}-${i}`}>
                      <Td strong>{formatDateHeure(s.date)}</Td>
                      <Td>{t ? `${t.villeDepart.nom} → ${t.villeArrivee.nom}` : '—'}</Td>
                      <Td>{s.reservation && t ? `${formatDate(s.reservation.depart.dateDepart)} ${formatHeure(t.heureDepart)}` : '—'}</Td>
                      <Td>{s.siege || '—'}</Td>
                      <Td>
                        <Badge tone={BADGE_TONE[s.resultat ?? ''] || 'neutral'}>
                          {LIBELLE_RESULTAT[s.resultat ?? ''] ?? (s.resultat ?? 'inconnu').replace(/_/g, ' ')}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={liste.items.length} />
          </>
        )}
      </Card>
    </DashboardShell>
  );
}
