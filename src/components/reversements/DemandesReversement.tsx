'use client';

import { useCallback, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { FiltresBar, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadMore from '@/components/ui/LoadMore';
import { Select } from '@/components/ui/Field';
import {
  reversementsApi,
  LIBELLE_STATUT_DEMANDE,
  LIBELLE_STATUT_REVERSEMENT,
  MOYENS_RETRAIT,
  TONE_STATUT_DEMANDE,
} from '@/features/reversements';
import type { DemandeReversement, MoyenYego } from '@/features/reversements';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { formatDate, formatDateHeure, formatFcfa } from '@/lib/format';

type StatutFiltre = '' | 'en_attente' | 'approuvee' | 'rejetee' | 'annulee';
// Clés distinctes de celles d'HistoriqueReversements (même page, même URL).
type Filtres = { demandes: StatutFiltre; demandesCompagnie: string };
const DEFAUTS_ADMIN: Filtres = { demandes: 'en_attente', demandesCompagnie: '' };
const DEFAUTS_COMPAGNIE: Filtres = { demandes: '', demandesCompagnie: '' };

const OPTIONS_STATUT = [
  { valeur: '' as const, label: 'Toutes' },
  { valeur: 'en_attente' as const, label: 'En attente' },
  { valeur: 'approuvee' as const, label: 'Approuvées' },
  { valeur: 'rejetee' as const, label: 'Rejetées' },
  { valeur: 'annulee' as const, label: 'Annulées' },
];

/**
 * Demandes de reversement. company_admin : celles de sa compagnie (annulables
 * tant qu'en attente). admin : toutes, approbation (transfert Jèko du net
 * recalculé à l'instant vers le numéro Yègo Wave / Orange, remis ensuite en main
 * propre) ou rejet motivé. `onTraitee` : la page rafraîchit soldes / historique.
 */
export default function DemandesReversement({
  admin = false,
  compagnies,
  cleRechargement = 0,
  onTraitee,
}: {
  admin?: boolean;
  compagnies?: { valeur: string; label: string }[];
  cleRechargement?: number;
  onTraitee?: () => void;
}) {
  const filtres = useFiltres<Filtres>(admin ? DEFAUTS_ADMIN : DEFAUTS_COMPAGNIE);
  const { demandes: statut, demandesCompagnie } = filtres.appliques;
  const [enCours, setEnCours] = useState<number | null>(null);
  // Opérateur du numéro Yègo choisi par demande (approbation).
  const [moyens, setMoyens] = useState<Record<number, MoyenYego>>({});

  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      reversementsApi.demandes({
        take,
        skip,
        statut,
        compagnieId: demandesCompagnie ? Number(demandesCompagnie) : null,
      }),
    [statut, demandesCompagnie],
  );
  const liste = usePagedList<DemandeReversement>(fetcher, `${filtres.cle}|${cleRechargement}`, 20);

  async function agir(d: DemandeReversement, action: () => Promise<unknown>, erreurParDefaut: string) {
    setEnCours(d.id);
    try {
      await action();
      liste.recharger();
      onTraitee?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : erreurParDefaut);
      // L'approbation peut avoir échoué après coup (transfert refusé) : on resynchronise.
      liste.recharger();
    } finally {
      setEnCours(null);
    }
  }

  function approuver(d: DemandeReversement) {
    const nom = d.compagnie?.nom ?? `Compagnie #${d.compagnieId}`;
    const moyen = moyens[d.id] ?? 'wave';
    const operateur = MOYENS_RETRAIT.find((m) => m.valeur === moyen)?.label ?? moyen;
    if (
      !confirm(
        `Approuver la demande #${d.id} de ${nom} ?\n` +
          `Jèko transfère le montant vers le numéro ${operateur} de Yègo ; vous le remettrez ensuite en main propre à la compagnie. ` +
          `Montant recalculé à l’instant (estimé à ${formatFcfa(d.montantNetEstime)} lors de la demande).`,
      )
    )
      return;
    agir(d, () => reversementsApi.approuverDemande(d.id, moyen), 'Erreur lors de l’approbation');
  }

  function rejeter(d: DemandeReversement) {
    const motif = prompt(`Motif du rejet de la demande #${d.id} (transmis à la compagnie) :`)?.trim();
    if (motif == null || motif === '') return;
    if (motif.length < 3) return alert('Motif trop court (3 caractères minimum).');
    agir(d, () => reversementsApi.rejeterDemande(d.id, motif.slice(0, 500)), 'Erreur lors du rejet');
  }

  function annuler(d: DemandeReversement) {
    if (!confirm(`Annuler votre demande de reversement #${d.id} ?`)) return;
    agir(d, () => reversementsApi.annulerDemande(d.id), 'Erreur lors de l’annulation');
  }

  return (
    <>
      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreSegments
          label="Demandes"
          value={filtres.valeurs.demandes}
          onChange={(v) => filtres.set('demandes', v)}
          options={OPTIONS_STATUT}
        />
        {admin && compagnies && (
          <FiltreSelect
            label="Compagnie"
            value={filtres.valeurs.demandesCompagnie}
            onChange={(v) => filtres.set('demandesCompagnie', v)}
            options={compagnies}
            tous="Toutes"
          />
        )}
      </FiltresBar>

      <Card className="mb-6">
        <CardHeader
          title="Demandes de reversement"
          subtitle={
            admin
              ? 'Approuver transfère le net disponible vers le numéro Yègo choisi, à remettre ensuite à la compagnie.'
              : 'Vos demandes à l’équipe Yègo.'
          }
          right={`${liste.items.length} affichée${liste.items.length > 1 ? 's' : ''}`}
        />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <TableMessage>
            {statut === 'en_attente' ? 'Aucune demande en attente.' : 'Aucune demande pour ces filtres.'}
          </TableMessage>
        ) : (
          <>
            <Table minWidth={admin ? '900px' : '760px'}>
              <THead>
                <Th>Demandée le</Th>
                {admin && <Th>Compagnie</Th>}
                <Th>Montant estimé</Th>
                <Th>Commentaire</Th>
                <Th>Statut</Th>
                <Th>{''}</Th>
              </THead>
              <tbody>
                {liste.items.map((d) => (
                  <Tr key={d.id}>
                    <Td className="whitespace-nowrap">
                      {formatDateHeure(d.dateDemande)}
                      <span className="block text-xs text-ink-faint">#{d.id}</span>
                    </Td>
                    {admin && <Td>{d.compagnie?.nom ?? `Compagnie #${d.compagnieId}`}</Td>}
                    <Td className="tabular-nums font-medium text-accent-ink">{formatFcfa(d.montantNetEstime)}</Td>
                    <Td className="max-w-[16rem] text-xs">{d.commentaire || '—'}</Td>
                    <Td>
                      <Badge tone={TONE_STATUT_DEMANDE[d.statut] ?? 'neutral'}>
                        {LIBELLE_STATUT_DEMANDE[d.statut] ?? d.statut}
                      </Badge>
                      {d.statut === 'rejetee' && d.motifRejet && (
                        <span className="mt-1 block max-w-[16rem] text-xs text-danger">{d.motifRejet}</span>
                      )}
                      {d.reversement && (
                        <span className="mt-1 block text-xs text-ink-faint">
                          Reversement #{d.reversement.id} · {formatFcfa(d.reversement.montantNet)} ·{' '}
                          {LIBELLE_STATUT_REVERSEMENT[d.reversement.statut] ?? d.reversement.statut}
                        </span>
                      )}
                      {d.dateTraitement && !d.reversement && (
                        <span className="mt-1 block text-xs text-ink-faint">le {formatDate(d.dateTraitement)}</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {d.statut === 'en_attente' &&
                        (admin ? (
                          <span className="flex items-center gap-3">
                            <Select
                              aria-label="Opérateur du numéro Yègo qui reçoit"
                              value={moyens[d.id] ?? 'wave'}
                              onChange={(e) => setMoyens((m) => ({ ...m, [d.id]: e.target.value as MoyenYego }))}
                              disabled={enCours === d.id}
                              className="!w-32 !py-1 text-xs"
                            >
                              {MOYENS_RETRAIT.map((m) => (
                                <option key={m.valeur} value={m.valeur}>
                                  {m.label}
                                </option>
                              ))}
                            </Select>
                            <Button variant="link-success" onClick={() => approuver(d)} disabled={enCours === d.id}>
                              {enCours === d.id ? 'Transfert…' : 'Approuver'}
                            </Button>
                            <Button variant="link-danger" onClick={() => rejeter(d)} disabled={enCours === d.id}>
                              Rejeter
                            </Button>
                          </span>
                        ) : (
                          <Button variant="link-danger" onClick={() => annuler(d)} disabled={enCours === d.id}>
                            {enCours === d.id ? 'Annulation…' : 'Annuler'}
                          </Button>
                        ))}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <LoadMore
              aSuite={liste.aSuite}
              chargement={liste.chargementSuite}
              onClick={liste.chargerSuite}
              nbCharges={liste.items.length}
            />
          </>
        )}
      </Card>
    </>
  );
}
