'use client';

import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Landmark, Lock, Plus, Wallet } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Field';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { FiltresBar, FiltreSegments } from '@/components/ui/Filtres';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import BientotDisponible from '@/components/ui/BientotDisponible';
import Modal, { PiedModal } from '@/components/ui/Modal';
import {
  retraitsApi,
  LIBELLE_STATUT_REVERSEMENT,
  MOYENS_RETRAIT,
  RETRAIT_MAX_FCFA,
  RETRAIT_MIN_FCFA,
  TONE_STATUT_REVERSEMENT,
} from '@/features/reversements';
import type { ApercuRetrait, MoyenRetrait, Retrait } from '@/features/reversements';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { DEMANDES_REVERSEMENT, JEKO } from '@/lib/capacites';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { formatDate, formatDateHeure, formatFcfa } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';

type Filtres = { statut: '' | 'en_cours' | 'effectue' | 'echoue' };
const DEFAUTS: Filtres = { statut: '' };

const OPTIONS_STATUT = [
  { valeur: '' as const, label: 'Tous' },
  { valeur: 'en_cours' as const, label: 'En cours' },
  { valeur: 'effectue' as const, label: 'Effectués' },
  { valeur: 'echoue' as const, label: 'Échoués' },
];

function libelleMoyen(moyen: string): string {
  return MOYENS_RETRAIT.find((m) => m.valeur === moyen)?.label ?? moyen;
}

function Ligne({ label, valeur, fort = false }: { label: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft py-2 text-sm last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className={`text-right tabular-nums ${fort ? 'font-semibold text-ink' : 'text-ink'}`}>{valeur}</span>
    </div>
  );
}

/**
 * Retrait de la part Yègo (frais de service, commissions) du magasin Jèko vers
 * le numéro Mobile Money de Yègo, fixé côté API. Seul le surplus au-delà des
 * engagements (argent des compagnies et voyageurs) est retirable.
 */
export default function AdminRetraitsPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const actif = JEKO && DEMANDES_REVERSEMENT;
  const [apercu, setApercu] = useState<ApercuRetrait | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const [moyen, setMoyen] = useState<MoyenRetrait>('wave');
  const [motDePasse, setMotDePasse] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [erreurForm, setErreurForm] = useState<string | null>(null);
  const [cleHistorique, setCleHistorique] = useState(0);

  const filtres = useFiltres<Filtres>(DEFAUTS);
  const { statut } = filtres.appliques;
  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) => retraitsApi.list({ take, skip, statut }),
    [statut],
  );
  const liste = usePagedList<Retrait>(fetcher, ready && actif ? `${filtres.cle}|${cleHistorique}` : 'wait', 20);

  const chargerApercu = useCallback(() => {
    setErreurApercu(null);
    retraitsApi
      .apercu()
      .then(setApercu)
      .catch((e) => {
        setApercu(null);
        setErreurApercu(e instanceof Error ? e.message : 'Erreur de chargement');
      });
  }, []);

  useEffect(() => {
    if (ready && actif) chargerApercu();
  }, [ready, actif, chargerApercu]);

  const retirable = apercu ? Number(apercu.retirable) : 0;
  const plafond = Math.min(retirable, RETRAIT_MAX_FCFA);

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setErreurForm(null);
    setMontant('');
    setMotDePasse('');
  }

  async function retirer(e: React.FormEvent) {
    e.preventDefault();
    setErreurForm(null);
    const m = Number(montant.replace(/\s/g, ''));
    if (!Number.isInteger(m) || m < RETRAIT_MIN_FCFA) return setErreurForm(`Montant entier d’au moins ${formatFcfa(RETRAIT_MIN_FCFA)}.`);
    if (m > plafond) return setErreurForm(`Maximum ${formatFcfa(plafond)} pour ce retrait.`);
    if (!motDePasse) return setErreurForm('Saisissez votre mot de passe pour confirmer.');
    if (!apercu?.beneficiaire) return;
    if (!confirm(`Retirer ${formatFcfa(m)} vers ${libelleMoyen(moyen)} ${formatTelephone(apercu.beneficiaire)} ?`)) return;

    setEnvoi(true);
    try {
      const r = await retraitsApi.creer({ montant: m, moyen, motDePasse });
      setMontant('');
      setMotDePasse('');
      setFormulaireOuvert(false);
      alert(
        r.statut === 'effectue'
          ? `Retrait #${r.id} effectué (${formatFcfa(r.montant)}).`
          : r.statut === 'echoue'
            ? `Retrait #${r.id} refusé : ${r.motifEchec ?? 'transfert refusé par l’opérateur'}.`
            : `Retrait #${r.id} lancé (${formatFcfa(r.montant)}) : en attente de confirmation de l’opérateur.`,
      );
    } catch (err) {
      setErreurForm(err instanceof Error ? err.message : 'Erreur lors du retrait');
    } finally {
      setMotDePasse('');
      setEnvoi(false);
      chargerApercu();
      setCleHistorique((k) => k + 1);
    }
  }

  if (!ready) return null;

  const eng = apercu?.engagements;
  const v = (x: string | number | undefined) => (apercu ? formatFcfa(x) : erreurApercu ? '—' : '…');
  const retraitEnCours = eng != null && Number(eng.retraitsEnCours) > 0;
  const formulaireBloque = !apercu || !apercu.beneficiaire || retirable < RETRAIT_MIN_FCFA || retraitEnCours;

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Retraits Yègo"
        subtitle="Virement de la part Yègo (frais de service, commissions) du magasin Jèko vers le compte Mobile Money de Yègo."
      />

      {!actif ? (
        <BientotDisponible
          icon={HandCoins}
          titre="Retraits en cours de déploiement"
          texte="L’écran est prêt ; il s’activera dès que la version de l’API qui gère les retraits Yègo sera en ligne."
        />
      ) : (
        <>
          {erreurApercu && (
            <Card className="mb-4 flex items-center justify-between gap-3 p-4 text-sm text-danger">
              <span>{erreurApercu}</span>
              <Button variant="link" onClick={chargerApercu}>
                Réessayer
              </Button>
            </Card>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Solde du magasin Jèko" value={v(apercu?.soldeJeko)} icon={Wallet} detail="Tout l’argent détenu chez Jèko" />
            <StatCard
              label="Engagements"
              value={v(eng?.total)}
              icon={Lock}
              detail="Dû aux compagnies et voyageurs : intouchable"
            />
            <StatCard label="Retirable" value={v(apercu?.retirable)} icon={HandCoins} detail="Montant maximum à saisir, frais déduits" />
            <StatCard label="Déjà retiré" value={v(apercu?.dejaRetire)} icon={Landmark} detail="Cumul des retraits effectués" />
          </div>

          <div className="mb-4 flex flex-col items-end gap-1">
            <Button onClick={() => setFormulaireOuvert(true)} disabled={formulaireBloque}>
              <Plus className="h-4 w-4" strokeWidth={2} /> Nouveau retrait
            </Button>
            {apercu && formulaireBloque && (
              <p className="text-xs text-ink-faint">
                {!apercu.beneficiaire
                  ? 'Numéro de retrait Yègo non configuré sur l’API (RETRAIT_YEGO_TELEPHONE).'
                  : retraitEnCours
                    ? 'Un retrait est déjà en cours : attendez son résultat.'
                    : `Rien à retirer (minimum ${formatFcfa(RETRAIT_MIN_FCFA)}).`}
              </p>
            )}
          </div>

          <div className="mb-6">
            <Card>
              <CardHeader
                title="Détail"
                subtitle={`retirable = solde Jèko − engagements${
                  apercu?.fraisTransfertPourcent != null
                    ? ` − frais Jèko du retrait (${apercu.fraisTransfertPourcent.toLocaleString('fr-FR')} %)`
                    : ''
                }`}
              />
              <div className="px-5 py-3">
                <Ligne label="Billets en ligne non reversés" valeur={v(eng?.billetsNonReverses)} />
                <Ligne label="Frais retenus non reversés" valeur={v(eng?.fraisRetenusNonReverses)} />
                {eng?.fraisTransfertsAVenir != null && (
                  <Ligne label="Frais Jèko des reversements à venir" valeur={v(eng.fraisTransfertsAVenir)} />
                )}
                <Ligne label="Reversements en cours" valeur={v(eng?.reversementsEnCours)} />
                <Ligne label="Retraits en cours" valeur={v(eng?.retraitsEnCours)} />
                <Ligne label="Total des engagements" valeur={v(eng?.total)} fort />
              </div>
              <div className="border-t border-line-soft px-5 py-3">
                <Ligne label="Frais de service encaissés (cumul)" valeur={v(apercu?.fraisServiceEncaisses)} />
                <Ligne label="Commissions perçues (cumul)" valeur={v(apercu?.commissionsPercues)} />
              </div>
            </Card>

          </div>

          <Modal
            ouvert={formulaireOuvert}
            titre="Nouveau retrait"
            sousTitre={
              apercu?.beneficiaire
                ? `Vers le numéro Yègo ${formatTelephone(apercu.beneficiaire)} (fixé côté serveur).`
                : 'Numéro de retrait Yègo fixé côté serveur.'
            }
            onFermer={envoi ? undefined : fermerFormulaire}
            largeur="max-w-lg"
          >
                <form onSubmit={retirer} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={`Montant (max ${formatFcfa(plafond)})`}>
                      <Input
                        inputMode="numeric"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder={String(RETRAIT_MIN_FCFA * 100)}
                        disabled={formulaireBloque}
                      />
                    </Field>
                    <Field label="Opérateur">
                      <Select value={moyen} onChange={(e) => setMoyen(e.target.value as MoyenRetrait)} disabled={formulaireBloque}>
                        {MOYENS_RETRAIT.filter((m) => !apercu || apercu.moyens.includes(m.valeur)).map((m) => (
                          <option key={m.valeur} value={m.valeur}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Votre mot de passe">
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      disabled={formulaireBloque}
                    />
                  </Field>
                  {erreurForm && <p className="text-sm text-danger">{erreurForm}</p>}
                  <PiedModal
                    envoi={envoi}
                    libelle="Retirer"
                    libelleEnvoi="Transfert en cours…"
                    onAnnuler={fermerFormulaire}
                  />
                </form>
          </Modal>

          <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
            <FiltreSegments
              label="Statut"
              value={filtres.valeurs.statut}
              onChange={(s) => filtres.set('statut', s)}
              options={OPTIONS_STATUT}
            />
          </FiltresBar>

          <Card>
            <CardHeader title="Historique des retraits" right={`${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}`} />
            {liste.chargement ? (
              <TableMessage>Chargement...</TableMessage>
            ) : liste.erreur ? (
              <TableMessage>{liste.erreur}</TableMessage>
            ) : liste.items.length === 0 ? (
              <TableMessage>{filtres.nbActifs > 0 ? 'Aucun retrait pour ce filtre.' : 'Aucun retrait pour le moment.'}</TableMessage>
            ) : (
              <>
                <Table minWidth="760px">
                  <THead>
                    <Th>Date</Th>
                    <Th>Montant</Th>
                    <Th>Bénéficiaire</Th>
                    <Th>Frais opérateur</Th>
                    <Th>Statut</Th>
                  </THead>
                  <tbody>
                    {liste.pageItems.map((r) => (
                      <Tr key={r.id}>
                        <Td className="whitespace-nowrap">
                          {formatDateHeure(r.dateCreation)}
                          <span className="block text-xs text-ink-faint">#{r.id}{r.jekoReference ? ` · ${r.jekoReference}` : ''}</span>
                        </Td>
                        <Td className="tabular-nums font-medium text-accent-ink">{formatFcfa(r.montant)}</Td>
                        <Td className="whitespace-nowrap">
                          {libelleMoyen(r.moyen)} · {formatTelephone(r.beneficiaire)}
                        </Td>
                        <Td className="tabular-nums">{r.fraisJeko != null ? formatFcfa(r.fraisJeko) : '—'}</Td>
                        <Td>
                          <Badge tone={TONE_STATUT_REVERSEMENT[r.statut] ?? 'neutral'}>
                            {LIBELLE_STATUT_REVERSEMENT[r.statut] ?? r.statut}
                          </Badge>
                          {r.statut === 'echoue' && r.motifEchec && (
                            <span className="mt-1 block max-w-[16rem] text-xs text-danger">{r.motifEchec}</span>
                          )}
                          {r.statut === 'effectue' && r.dateEffectue && (
                            <span className="mt-1 block text-xs text-ink-faint">le {formatDate(r.dateEffectue)}</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination pagination={liste.pagination} />
              </>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
