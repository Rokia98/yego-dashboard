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
import HistoriqueReversements from '@/components/reversements/HistoriqueReversements';
import ReversementsIndisponible from '@/components/reversements/ReversementsIndisponible';
import { reversementsApi } from '@/features/reversements';
import type { ApercuReversement as Apercu } from '@/features/reversements';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { JEKO } from '@/lib/capacites';
import { formatFcfa } from '@/lib/format';

export default function AdminReversementsPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [solde, setSolde] = useState<number | null | undefined>(undefined); // undefined = chargement
  const [compagnieId, setCompagnieId] = useState('');
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [chargementApercu, setChargementApercu] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [cleHistorique, setCleHistorique] = useState(0);

  const chargerSolde = useCallback(() => {
    setSolde(undefined);
    reversementsApi
      .solde()
      .then((s) => setSolde(s.soldeFcfa))
      .catch(() => setSolde(null));
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

  async function reverser() {
    if (!apercu) return;
    const net = formatFcfa(apercu.montantNet);
    if (!confirm(`Reverser ${net} à ${nomCompagnie} ?\nLe transfert Mobile Money part immédiatement depuis le magasin Jèko Yègo.`))
      return;
    setEnvoi(true);
    try {
      const r = await reversementsApi.creer(apercu.compagnieId);
      alert(
        r.statut === 'effectue'
          ? `Reversement #${r.id} enregistré (${formatFcfa(r.montantNet)}).`
          : `Reversement #${r.id} lancé (${formatFcfa(r.montantNet)}) : en attente de confirmation de l’opérateur.`,
      );
      chargerApercu(compagnieId);
      chargerSolde();
      setCleHistorique((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du reversement');
    } finally {
      setEnvoi(false);
    }
  }

  if (!ready) return null;

  const net = apercu ? Number(apercu.montantNet) : 0;
  const sansCoordonnees = apercu != null && !apercu.coordonnees.telephone;
  const soldeInsuffisant = apercu != null && solde != null && solde < net;

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Reversements"
        subtitle="Versement aux compagnies des billets payés en ligne (Jèko), commission Yègo déduite."
      />

      {!JEKO ? (
        <ReversementsIndisponible />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Solde du magasin Jèko"
              value={solde === undefined ? '…' : solde === null ? '—' : formatFcfa(solde)}
              detail={solde === null ? 'Solde illisible pour le moment' : 'Disponible pour les reversements'}
              icon={Wallet}
            />
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
              {compagnieId && (
                <CoordonneesReversement compagnieId={Number(compagnieId)} onEnregistre={() => chargerApercu(compagnieId)} />
              )}
            </div>

            <div>
              {chargementApercu ? (
                <Card className="p-5 text-sm text-ink-faint">Calcul de l’aperçu…</Card>
              ) : erreurApercu ? (
                <Card className="p-5 text-sm text-danger">{erreurApercu}</Card>
              ) : apercu ? (
                <ApercuReversement apercu={apercu}>
                  <Button onClick={reverser} disabled={envoi || net <= 0 || sansCoordonnees || soldeInsuffisant} className="w-full">
                    {envoi ? 'Transfert en cours…' : `Reverser ${formatFcfa(apercu.montantNet)}`}
                  </Button>
                  {(net <= 0 || sansCoordonnees || soldeInsuffisant) && (
                    <p className="mt-2 text-xs text-ink-faint">
                      {net <= 0
                        ? 'Rien à reverser pour le moment.'
                        : sansCoordonnees
                          ? 'Renseignez d’abord le compte de reversement de la compagnie.'
                          : 'Solde du magasin Jèko insuffisant.'}
                    </p>
                  )}
                </ApercuReversement>
              ) : (
                <Card className="p-5 text-sm text-ink-faint">Choisissez une compagnie pour voir ce qui lui est dû.</Card>
              )}
            </div>
          </div>

          <HistoriqueReversements admin compagnies={optionsCompagnies} cleRechargement={cleHistorique} />
        </>
      )}
    </DashboardShell>
  );
}
