'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, ClipboardList, Ticket, TrendingUp, Wallet, Users2, Gauge } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, Sparkline, Donut, BarsH, Meter, compact } from '@/components/charts';
import { dashboardApi } from '@/features/dashboard';
import type { DashboardResume, DashboardTrajetClassement, DashboardSeriePoint } from '@/features/dashboard';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatFcfa, formatPourcentage } from '@/lib/format';

const JOURS = [14, 30] as const;

export default function CompagnieDashboard() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const [resume, setResume] = useState<DashboardResume | null>(null);
  const [serie, setSerie] = useState<DashboardSeriePoint[]>([]);
  const [topTrajets, setTopTrajets] = useState<DashboardTrajetClassement[]>([]);
  const [jours, setJours] = useState<(typeof JOURS)[number]>(30);
  const [chargement, setChargement] = useState(true);

  const peutVoirStats = user?.role === 'company_admin';

  useEffect(() => {
    if (!ready || !peutVoirStats) {
      setChargement(false);
      return;
    }
    Promise.all([
      dashboardApi.resume().then(setResume).catch(() => setResume(null)),
      dashboardApi.trajets({ limit: 6 }).then(setTopTrajets).catch(() => setTopTrajets([])),
    ]).finally(() => setChargement(false));
  }, [ready, peutVoirStats]);

  useEffect(() => {
    if (!ready || !peutVoirStats) return;
    dashboardApi.series(jours).then(setSerie).catch(() => setSerie([]));
  }, [ready, peutVoirStats, jours]);

  const courbeResa = useMemo(
    () => serie.map((p) => ({ label: p.date.slice(5), value: p.reservations })),
    [serie],
  );
  const courbeCa = useMemo(() => serie.map((p) => Number(p.revenu)), [serie]);
  const courbeResaVals = useMemo(() => serie.map((p) => p.reservations), [serie]);
  const courbePlaces = useMemo(() => serie.map((p) => p.placesVendues), [serie]);

  if (!ready) return null;

  if (!peutVoirStats) {
    return (
      <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
        <PageHeader eyebrow="Espace opérateur" title="Vue d'ensemble" subtitle="Accès rapide à vos tâches du jour." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { href: '/compagnie/guichet', icon: Ticket, t: 'Guichet', d: 'Vendre un ticket au comptoir et encaisser.' },
            { href: '/compagnie/departs', icon: CalendarClock, t: 'Départs', d: 'Planning, démarrage et suivi des départs.' },
            { href: '/compagnie/reservations', icon: ClipboardList, t: 'Réservations', d: 'Voir et annuler les réservations.' },
            { href: '/compagnie/controles', icon: Users2, t: 'Contrôles', d: 'Historique des tickets scannés.' },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="group block">
              <Card className="p-5 transition-colors group-hover:border-accent">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 font-semibold text-ink">
                    <c.icon className="h-4 w-4 text-accent" strokeWidth={1.75} /> {c.t}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">{c.d}</p>
              </Card>
            </Link>
          ))}
        </div>
      </DashboardShell>
    );
  }

  const caPaye = resume?.chiffreAffaires.parStatutPaiement.paye;
  const occ = resume?.occupation;

  const donutParts = [
    { label: 'En ligne', value: resume?.reservations.parCanal.en_ligne ?? 0, couleur: 'rgb(var(--chart-1))' },
    { label: 'Guichet', value: resume?.reservations.parCanal.guichet ?? 0, couleur: 'rgb(var(--chart-2))' },
  ];

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Vue d'ensemble"
        subtitle="Votre activité des 30 derniers jours."
        right={`Compagnie #${user?.compagnieId}`}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Réservations (30 j)"
          value={chargement ? '…' : resume?.reservations.total ?? 0}
          icon={TrendingUp}
          detail={serie.length ? `${serie.slice(-7).reduce((s, p) => s + p.reservations, 0)} sur 7 j` : undefined}
        >
          {courbeResaVals.length > 1 && <Sparkline values={courbeResaVals} couleur="accent" />}
        </StatCard>
        <StatCard
          label="CA encaissé (30 j)"
          value={chargement ? '…' : `${compact(Number(caPaye?.montant ?? 0))} F`}
          icon={Wallet}
          detail={caPaye ? formatFcfa(caPaye.montant) : undefined}
        >
          {courbeCa.length > 1 && <Sparkline values={courbeCa} couleur="chart-3" />}
        </StatCard>
        <StatCard
          label="Places vendues (30 j)"
          value={chargement ? '…' : occ?.placesOccupees ?? 0}
          icon={Users2}
        >
          {courbePlaces.length > 1 && <Sparkline values={courbePlaces} couleur="chart-1" />}
        </StatCard>
        <StatCard
          label="Taux de remplissage"
          value={chargement ? '…' : formatPourcentage(occ?.tauxRemplissage ?? 0)}
          icon={Gauge}
          detail={occ ? `${occ.placesOccupees} / ${occ.placesTotales} places` : undefined}
        />
      </div>

      <Card className="mb-5">
        <CardHeader
          title="Réservations par jour"
          subtitle="Volume de ventes (tous canaux)"
          right={
            <span className="inline-flex rounded-lg border border-line p-0.5">
              {JOURS.map((j) => (
                <button
                  key={j}
                  onClick={() => setJours(j)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    jours === j ? 'bg-accent-soft text-accent-ink' : 'text-ink-faint hover:text-ink'
                  }`}
                >
                  {j} j
                </button>
              ))}
            </span>
          }
        />
        <div className="p-4">
          <AreaChart data={courbeResa} couleur="accent" ariaLabel="Réservations par jour" height={240} />
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Canal de vente" subtitle="Répartition des réservations" />
          <div className="p-5">
            <Donut parts={donutParts} centreLabel="réservations" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Occupation" subtitle="Places occupées sur places offertes" />
          <div className="space-y-4 p-5">
            <Meter
              valeur={occ?.tauxRemplissage ?? 0}
              label="Taux de remplissage"
              detail={occ ? `${occ.departs} départ${occ.departs > 1 ? 's' : ''} sur la période` : undefined}
            />
            <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
              <div>
                <p className="text-xs text-ink-faint">Places occupées</p>
                <p className="mt-0.5 text-lg font-semibold text-ink">{occ?.placesOccupees ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">Places offertes</p>
                <p className="mt-0.5 text-lg font-semibold text-ink">{occ?.placesTotales ?? 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Trajets les plus vendus" subtitle="Revenu encaissé sur 30 jours" />
        <div className="p-5">
          {chargement ? (
            <p className="py-6 text-center text-sm text-ink-faint">Chargement...</p>
          ) : (
            <BarsH
              items={topTrajets.map((t) => ({
                label: `${t.villeDepart} → ${t.villeArrivee}`,
                value: Number(t.revenu),
                sous: `${t.reservations} réservation${t.reservations > 1 ? 's' : ''} · ${t.placesVendues} place${t.placesVendues > 1 ? 's' : ''}`,
              }))}
              valueFormat={(n) => `${compact(n)} FCFA`}
            />
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
