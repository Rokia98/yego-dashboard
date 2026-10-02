'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import TraceGps from '@/components/ui/TraceGps';
import { suiviApi } from '@/features/suivi';
import type { SuiviDepart, SuiviHistorique } from '@/features/suivi';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatDateHeure } from '@/lib/format';

const INTERVALLE = 12_000;

export default function SuiviDepartPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const params = useParams();
  const departId = Number(params.id);
  const [suivi, setSuivi] = useState<SuiviDepart | null>(null);
  const [historique, setHistorique] = useState<SuiviHistorique | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [maj, setMaj] = useState(false);

  const charger = useCallback(
    async (silencieux = false) => {
      if (!Number.isFinite(departId)) return;
      if (silencieux) setMaj(true);
      try {
        const [s, h] = await Promise.all([
          suiviApi.get(departId),
          suiviApi.historique(departId).catch(() => null),
        ]);
        setSuivi(s);
        if (h) setHistorique(h);
        setErreur(null);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : 'Suivi indisponible');
      } finally {
        setMaj(false);
      }
    },
    [departId],
  );

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    charger().finally(() => setChargement(false));
  }, [ready, charger]);

  useEffect(() => {
    if (suivi?.statut !== 'en_route') return;
    const timer = setInterval(() => charger(true), INTERVALLE);
    return () => clearInterval(timer);
  }, [suivi?.statut, charger]);

  if (!ready) return null;

  const derniere = suivi?.derniere ?? null;
  const eta = suivi?.eta ?? null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <Link href="/compagnie/departs" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Retour aux départs
      </Link>

      <PageHeader
        eyebrow="Suivi en temps réel"
        title={`Départ #${departId}`}
        subtitle="Position GPS transmise par le téléphone du chauffeur, actualisée automatiquement."
        right={
          <button onClick={() => charger(true)} className="flex items-center gap-1.5 hover:text-ink" disabled={maj}>
            <RefreshCw className={`h-3.5 w-3.5 ${maj ? 'animate-spin' : ''}`} strokeWidth={1.75} /> Actualiser
          </button>
        }
      />

      {chargement ? (
        <p className="text-sm text-ink-faint">Chargement...</p>
      ) : erreur ? (
        <div className="rounded-xl border border-warning/20 bg-warning-soft p-5 text-sm text-warning">{erreur}</div>
      ) : (
        <>
          {suivi?.retard && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              <p>
                Retard signalé
                {eta?.retardMinutes ? ` — environ ${eta.retardMinutes} min sur l’heure d’arrivée prévue.` : '.'}
              </p>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Statut" value={(suivi?.statut ?? '—').replace('_', ' ')} detail={suivi?.demarreA ? `Démarré ${formatDateHeure(suivi.demarreA)}` : undefined} />
            <StatCard
              label="Dernière position"
              value={derniere ? `${derniere.latitude.toFixed(4)}, ${derniere.longitude.toFixed(4)}` : '—'}
              detail={derniere ? formatDateHeure(derniere.mesureA) : 'Aucune position reçue'}
            />
            <StatCard
              label="Vitesse"
              value={derniere?.vitesse != null ? `${Math.round(derniere.vitesse)} km/h` : '—'}
              detail={derniere?.fraiche === false ? 'Signal ancien' : 'Signal frais'}
            />
            <StatCard
              label="Arrivée estimée"
              value={eta?.arriveeEstimee ? formatDateHeure(eta.arriveeEstimee) : suivi?.heureArriveePrevue ? formatDateHeure(suivi.heureArriveePrevue) : '—'}
              detail={eta?.minutesRestantes != null ? `${eta.minutesRestantes} min · ${eta.distanceKm?.toFixed(0) ?? '—'} km` : undefined}
            />
          </div>

          <Card className="p-4">
            <TraceGps
              points={historique?.points ?? []}
              position={derniere ? { latitude: derniere.latitude, longitude: derniere.longitude } : null}
              destination={suivi?.destination ?? null}
            />
            {suivi?.statut !== 'en_route' && (
              <p className="mt-3 text-xs text-ink-faint">
                Le suivi n’est actif que pendant un départ « en route ». Statut actuel : {suivi?.statut ?? '—'}.
              </p>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
