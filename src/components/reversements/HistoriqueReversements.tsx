'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { FiltresBar, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadMore from '@/components/ui/LoadMore';
import {
  estARemettre,
  reversementsApi,
  LIBELLE_STATUT_REVERSEMENT,
  MOYENS_REVERSEMENT,
  TONE_STATUT_REVERSEMENT,
} from '@/features/reversements';
import type { Reversement, ReversementDetail } from '@/features/reversements';
import { LIBELLE_MOYEN_PAIEMENT } from '@/features/paiements';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { DEMANDES_REVERSEMENT } from '@/lib/capacites';
import { formatDate, formatDateHeure, formatFcfa } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';

type Filtres = { statut: '' | 'en_cours' | 'effectue' | 'echoue'; compagnieId: string; remise: '' | 'a_remettre' | 'remis' };
const DEFAUTS: Filtres = { statut: '', compagnieId: '', remise: '' };

const OPTIONS_REMISE = [
  { valeur: '' as const, label: 'Tous' },
  { valeur: 'a_remettre' as const, label: 'À remettre' },
  { valeur: 'remis' as const, label: 'Remis' },
];

const OPTIONS_STATUT = [
  { valeur: '' as const, label: 'Tous' },
  { valeur: 'en_cours' as const, label: 'En cours' },
  { valeur: 'effectue' as const, label: 'Effectués' },
  { valeur: 'echoue' as const, label: 'Échoués' },
];

// Nouveau circuit : beneficiaire = numéro Yègo, moyen = wave | orange_money.
function libelleBeneficiaire(r: Reversement): string {
  const moyen = MOYENS_REVERSEMENT.find((m) => m.valeur === r.moyen)?.label ?? r.moyen;
  return `${moyen} · ${formatTelephone(r.beneficiaire)}`;
}

function Detail({ id }: { id: number }) {
  const [detail, setDetail] = useState<ReversementDetail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    reversementsApi
      .get(id)
      .then((d) => actif && setDetail(d))
      .catch((e) => actif && setErreur(e instanceof Error ? e.message : 'Erreur de chargement'));
    return () => {
      actif = false;
    };
  }, [id]);

  if (erreur) return <p className="text-xs text-danger">{erreur}</p>;
  if (!detail) return <p className="text-xs text-ink-faint">Chargement…</p>;
  if (detail.paiements.length === 0) return <p className="text-xs text-ink-faint">Aucun paiement rattaché.</p>;
  return (
    <div>
      <p className="mb-2 text-xs text-ink-faint">
        {detail.paiements.length} paiement{detail.paiements.length > 1 ? 's' : ''} inclus
        {detail.fraisJeko != null ? ` · frais opérateur ${formatFcfa(detail.fraisJeko)}` : ''}
      </p>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
        {detail.paiements.map((p) => (
          <li key={p.id} className="flex justify-between gap-3 border-b border-line-soft py-1">
            <span className="text-ink-soft">
              Résa #{p.reservationId} · {LIBELLE_MOYEN_PAIEMENT[p.moyenPaiement] ?? p.moyenPaiement} ·{' '}
              {formatDate(p.datePaiement)}
            </span>
            <span className="tabular-nums text-ink">{formatFcfa(p.montant)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Historique des reversements. company_admin : l'API restreint d'office à sa
 * compagnie. admin : filtre compagnie + colonne compagnie. `cleRechargement`
 * force un rechargement (ex. après un nouveau reversement).
 */
export default function HistoriqueReversements({
  admin = false,
  compagnies,
  cleRechargement = 0,
  onRemis,
}: {
  admin?: boolean;
  compagnies?: { valeur: string; label: string }[];
  cleRechargement?: number;
  onRemis?: () => void;
}) {
  const filtres = useFiltres<Filtres>(DEFAUTS);
  const { statut, compagnieId, remise } = filtres.appliques;
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);

  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      reversementsApi.list({
        take,
        skip,
        statut,
        compagnieId: compagnieId ? Number(compagnieId) : null,
        aRemettre: !DEMANDES_REVERSEMENT || remise === '' ? null : remise === 'a_remettre',
      }),
    [statut, compagnieId, remise],
  );
  const liste = usePagedList<Reversement>(fetcher, `${filtres.cle}|${cleRechargement}`, 20);

  // Remise en main propre à la compagnie, une fois les fonds arrivés chez Yègo.
  async function marquerRemis(r: Reversement) {
    const nom = r.compagnie?.nom ?? `Compagnie #${r.compagnieId}`;
    const note = prompt(
      `Remise de ${formatFcfa(r.montantNet)} à ${nom} (reversement #${r.id}).\n` +
        'Note facultative (ex. « espèces remises au gérant, reçu n°12 ») :',
    );
    if (note == null) return;
    setEnCours(r.id);
    try {
      const maj = await reversementsApi.remettre(r.id, note.trim().slice(0, 500) || undefined);
      if (remise === 'a_remettre') liste.retirer((x) => x.id === r.id);
      else liste.fusionner((x) => x.id === r.id, { ...r, ...maj });
      onRemis?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la déclaration de remise');
    } finally {
      setEnCours(null);
    }
  }

  return (
    <>
      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreSegments
          label="Statut"
          value={filtres.valeurs.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={OPTIONS_STATUT}
        />
        {DEMANDES_REVERSEMENT && (
          <FiltreSegments
            label="Remise"
            value={filtres.valeurs.remise}
            onChange={(v) => filtres.set('remise', v)}
            options={OPTIONS_REMISE}
          />
        )}
        {admin && compagnies && (
          <FiltreSelect
            label="Compagnie"
            value={filtres.valeurs.compagnieId}
            onChange={(v) => filtres.set('compagnieId', v)}
            options={compagnies}
            tous="Toutes"
          />
        )}
      </FiltresBar>

      <Card>
        <CardHeader title="Historique des reversements" right={`${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}`} />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <TableMessage>{filtres.nbActifs > 0 ? 'Aucun reversement pour ces filtres.' : 'Aucun reversement pour le moment.'}</TableMessage>
        ) : (
          <>
            <Table minWidth={admin ? '960px' : '860px'}>
              <THead>
                <Th>Date</Th>
                {admin && <Th>Compagnie</Th>}
                <Th>Paiements</Th>
                <Th>Brut</Th>
                <Th>Commission</Th>
                <Th>Net versé</Th>
                <Th>{DEMANDES_REVERSEMENT ? 'Transfert vers' : 'Bénéficiaire'}</Th>
                <Th>Statut</Th>
                <Th>{''}</Th>
              </THead>
              <tbody>
                {liste.items.map((r) => (
                  <Fragment key={r.id}>
                    <Tr>
                      <Td className="whitespace-nowrap">
                        {formatDateHeure(r.dateCreation)}
                        <span className="block text-xs text-ink-faint">#{r.id}</span>
                      </Td>
                      {admin && <Td>{r.compagnie?.nom ?? `Compagnie #${r.compagnieId}`}</Td>}
                      <Td className="tabular-nums">{r.nombrePaiements}</Td>
                      <Td className="tabular-nums">{formatFcfa(r.montantBrut)}</Td>
                      <Td className="tabular-nums">{formatFcfa(r.commission)}</Td>
                      <Td className="tabular-nums font-medium text-accent-ink">{formatFcfa(r.montantNet)}</Td>
                      <Td className="whitespace-nowrap">{libelleBeneficiaire(r)}</Td>
                      <Td>
                        <Badge tone={TONE_STATUT_REVERSEMENT[r.statut] ?? 'neutral'}>
                          {LIBELLE_STATUT_REVERSEMENT[r.statut] ?? r.statut}
                        </Badge>
                        {r.statut === 'echoue' && r.motifEchec && (
                          <span className="mt-1 block max-w-[14rem] text-xs text-danger">{r.motifEchec}</span>
                        )}
                        {r.statut === 'effectue' && r.dateEffectue && (
                          <span className="mt-1 block text-xs text-ink-faint">le {formatDate(r.dateEffectue)}</span>
                        )}
                        {DEMANDES_REVERSEMENT && r.remisLe && (
                          <span className="mt-1 block max-w-[14rem] text-xs text-success">
                            Remis le {formatDate(r.remisLe)}
                            {r.remiseNote ? ` · ${r.remiseNote}` : ''}
                          </span>
                        )}
                        {DEMANDES_REVERSEMENT && estARemettre(r) && (
                          admin ? (
                            <Button
                              variant="link-success"
                              onClick={() => marquerRemis(r)}
                              disabled={enCours === r.id}
                              className="mt-1 block"
                            >
                              {enCours === r.id ? 'Enregistrement…' : 'Marquer comme remis'}
                            </Button>
                          ) : (
                            <span className="mt-1 block text-xs text-warning">Remise à venir</span>
                          )
                        )}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setOuvert(ouvert === r.id ? null : r.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
                          aria-expanded={ouvert === r.id}
                        >
                          Détail
                          {ouvert === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </Td>
                    </Tr>
                    {ouvert === r.id && (
                      <tr className="border-b border-line-soft bg-surface-2">
                        <td colSpan={admin ? 9 : 8} className="px-5 py-3">
                          {r.jekoReference && <p className="mb-2 text-[11px] text-ink-faint">Réf. {r.jekoReference}</p>}
                          <Detail id={r.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={liste.items.length} />
          </>
        )}
      </Card>
    </>
  );
}
