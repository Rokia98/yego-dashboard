'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Field, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import ApercuReversement from '@/components/reversements/ApercuReversement';
import CoordonneesReversement from '@/components/reversements/CoordonneesReversement';
import DemandesReversement from '@/components/reversements/DemandesReversement';
import HistoriqueReversements from '@/components/reversements/HistoriqueReversements';
import ReversementsIndisponible from '@/components/reversements/ReversementsIndisponible';
import { estBloque, MOYENS_RETRAIT, reversementsApi } from '@/features/reversements';
import type { ApercuReversement as Apercu, MoyenYego } from '@/features/reversements';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { DEMANDES_REVERSEMENT, JEKO } from '@/lib/capacites';
import { formatFcfa } from '@/lib/format';
import { telephonePourApi } from '@/lib/telephone';

export default function AdminReversementsPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [solde, setSolde] = useState<number | null | undefined>(undefined); // undefined = chargement, null = illisible
  const [erreurSolde, setErreurSolde] = useState<string | null>(null);
  const [compagnieId, setCompagnieId] = useState('');
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [chargementApercu, setChargementApercu] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [confirmationCompte, setConfirmationCompte] = useState(false);
  const [cleHistorique, setCleHistorique] = useState(0);
  const [moyenYego, setMoyenYego] = useState<MoyenYego>('wave');

  const chargerSolde = useCallback(() => {
    setSolde(undefined);
    setErreurSolde(null);
    reversementsApi
      .solde()
      .then((s) => setSolde(s.soldeFcfa))
      .catch((e) => {
        setSolde(null);
        setErreurSolde(e instanceof Error ? e.message : 'Erreur de lecture du solde');
      });
  }, []);

  const chargerApercu = useCallback((id: string) => {
    setApercu(null);
    setErreurApercu(null);
    if (!id) return;
    setChargementApercu(true);
    reversementsApi
      .apercu(Number(id))
      .then(setApercu)
      .catch((e) => setErreurApercu(e instanceof Error ? e.message : 'Erreur de chargement'))
      .finally(() => setChargementApercu(false));
  }, []);

  useEffect(() => {
    if (!ready || !JEKO) return;
    compagniesApi
      .list()
      .then(setCompagnies)
      .catch(() => setCompagnies([]));
    chargerSolde();
  }, [ready, chargerSolde]);

  useEffect(() => {
    chargerApercu(compagnieId);
  }, [compagnieId, chargerApercu]);

  const optionsCompagnies = useMemo(
    () => compagnies.map((c) => ({ valeur: String(c.id), label: c.nom })),
    [compagnies],
  );
  const nomCompagnie = compagnies.find((c) => String(c.id) === compagnieId)?.nom ?? '';

  // Un reversement (direct ou par approbation d'une demande) change l'aperçu,
  // le solde Jèko, l'historique et les demandes en attente.
  function apresReversement() {
    chargerApercu(compagnieId);
    chargerSolde();
    setCleHistorique((k) => k + 1);
  }

  async function reverser() {
    if (!apercu) return;
    const net = formatFcfa(apercu.montantNet);
    const operateur = MOYENS_RETRAIT.find((m) => m.valeur === moyenYego)?.label ?? moyenYego;
    const message = DEMANDES_REVERSEMENT
      ? `Reverser ${net} à ${nomCompagnie} ?\nJèko transfère le montant vers le numéro ${operateur} de Yègo ; vous le remettrez ensuite en main propre à la compagnie.`
      : `Reverser ${net} à ${nomCompagnie} ?\nLe transfert Mobile Money part immédiatement depuis le magasin Jèko Yègo.`;
    if (!confirm(message)) return;
    setEnvoi(true);
    try {
      const r = await reversementsApi.creer(apercu.compagnieId, DEMANDES_REVERSEMENT ? moyenYego : undefined);
      alert(
        r.statut === 'effectue'
          ? `Reversement #${r.id} enregistré (${formatFcfa(r.montantNet)}).`
          : `Reversement #${r.id} lancé (${formatFcfa(r.montantNet)}) : en attente de confirmation de l’opérateur.`,
      );
      apresReversement();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du reversement');
    } finally {
      setEnvoi(false);
    }
  }

  // Réenregistrer les mêmes coordonnées en tant qu'admin lève le délai de 24 h.
  async function confirmerCompte() {
    const c = apercu?.coordonnees;
    if (!apercu || !c?.moyen || !c.telephone) return;
    if (!confirm(`Confirmer le compte de reversement de ${nomCompagnie} ?
Vérifiez d’abord ce numéro auprès de la compagnie : le délai de sécurité sera levé.`))
      return;
    setConfirmationCompte(true);
    try {
      await reversementsApi.setCoordonnees(apercu.compagnieId, { moyen: c.moyen, telephone: telephonePourApi(c.telephone) });
      chargerApercu(compagnieId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la confirmation du compte');
    } finally {
      setConfirmationCompte(false);
    }
  }

  if (!ready) return null;

  const net = apercu ? Number(apercu.montantNet) : 0;
  // Nouveau circuit : l'argent transite par le numéro Yègo, le compte de la
  // compagnie n'est plus requis et le délai de 24 h a disparu.
  const sansCoordonnees = !DEMANDES_REVERSEMENT && apercu != null && !apercu.coordonnees?.telephone;
  const soldeInsuffisant = apercu != null && solde != null && solde < net;
  const bloque = !DEMANDES_REVERSEMENT && apercu != null && estBloque(apercu);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Reversements"
        subtitle={
          DEMANDES_REVERSEMENT
            ? 'Billets payés en ligne (Jèko) : transfert vers le numéro Yègo, puis remise en main propre aux compagnies.'
            : 'Versement aux compagnies des billets payés en ligne (Jèko), commission Yègo déduite.'
        }
      />

      {!JEKO ? (
        <ReversementsIndisponible />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Solde du magasin Jèko"
              value={solde === undefined ? '…' : solde === null ? '—' : formatFcfa(solde)}
              detail={
                solde === undefined
                  ? 'Lecture du solde…'
                  : erreurSolde
                    ? erreurSolde
                    : solde === null
                      ? 'Réponse de Jèko non reconnue par l’API'
                      : 'Disponible pour les reversements'
              }
              icon={Wallet}
            >
              {solde === null && (
                <Button variant="link" onClick={chargerSolde}>
                  Réessayer
                </Button>
              )}
            </StatCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Card className="p-5">
                <Field label="Compagnie à reverser">
                  <Select value={compagnieId} onChange={(e) => setCompagnieId(e.target.value)}>
                    <option value="">Choisir une compagnie…</option>
                    {optionsCompagnies.map((o) => (
                      <option key={o.valeur} value={o.valeur}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Card>
              {compagnieId && !DEMANDES_REVERSEMENT && (
                <CoordonneesReversement compagnieId={Number(compagnieId)} onEnregistre={() => chargerApercu(compagnieId)} />
              )}
            </div>

            <div>
              {chargementApercu ? (
                <Card className="p-5 text-sm text-ink-faint">Calcul de l’aperçu…</Card>
              ) : erreurApercu ? (
                <Card className="p-5 text-sm text-danger">{erreurApercu}</Card>
              ) : apercu ? (
                <ApercuReversement
                  apercu={apercu}
                  actionBlocage={
                    <Button variant="secondary" onClick={confirmerCompte} disabled={confirmationCompte} className="shrink-0">
                      {confirmationCompte ? 'Confirmation…' : 'Confirmer le compte'}
                    </Button>
                  }
                >
                  {DEMANDES_REVERSEMENT && (
                    <div className="mb-3">
                      <Field label="Reçu sur le numéro Yègo">
                        <Select value={moyenYego} onChange={(e) => setMoyenYego(e.target.value as MoyenYego)}>
                          {MOYENS_RETRAIT.map((m) => (
                            <option key={m.valeur} value={m.valeur}>
                              {m.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  )}
                  <Button
                    onClick={reverser}
                    disabled={envoi || net <= 0 || sansCoordonnees || soldeInsuffisant || bloque}
                    className="w-full"
                  >
                    {envoi ? 'Transfert en cours…' : `Reverser ${formatFcfa(apercu.montantNet)}`}
                  </Button>
                  {(net <= 0 || sansCoordonnees || soldeInsuffisant || bloque) && (
                    <p className="mt-2 text-xs text-ink-faint">
                      {net <= 0
                        ? 'Rien à reverser pour le moment.'
                        : sansCoordonnees
                          ? 'Renseignez d’abord le compte de reversement de la compagnie.'
                          : bloque
                            ? 'Compte récemment modifié : confirmez-le ou attendez la fin du délai.'
                            : 'Solde du magasin Jèko insuffisant.'}
                    </p>
                  )}
                </ApercuReversement>
              ) : (
                <Card className="p-5 text-sm text-ink-faint">Choisissez une compagnie pour voir ce qui lui est dû.</Card>
              )}
            </div>
          </div>

          {DEMANDES_REVERSEMENT && (
            <DemandesReversement
              admin
              compagnies={optionsCompagnies}
              cleRechargement={cleHistorique}
              onTraitee={apresReversement}
            />
          )}

          <HistoriqueReversements
            admin
            compagnies={optionsCompagnies}
            cleRechargement={cleHistorique}
            onRemis={() => chargerApercu(compagnieId)}
          />
        </>
      )}
    </DashboardShell>
  );
}
