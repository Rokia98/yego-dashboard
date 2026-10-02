'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, TrendingUp, Wallet, Undo2 } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, Sparkline, Donut, BarsH, compact } from '@/components/charts';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { dashboardApi } from '@/features/dashboard';
import type { DashboardResume, DashboardCompagnieClassement, DashboardSeriePoint } from '@/features/dashboard';
import { remboursementsApi } from '@/features/remboursements';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { formatFcfa, formatPourcentage } from '@/lib/format';

const STATUT_PAIEMENT = [
  { cle: 'paye', label: 'Payés', couleur: 'rgb(var(--success))' },
  { cle: 'en_attente', label: 'En attente', couleur: 'rgb(var(--warning))' },
  { cle: 'echoue', label: 'Échoués', couleur: 'rgb(var(--danger))' },
  { cle: 'rembourse', label: 'Remboursés', couleur: 'rgb(var(--ink-faint))' },
] as const;

// L'API ne renvoie pas de total : on lit une page de REMB_MAX et on affiche « N+ » si elle est pleine.
const REMB_MAX = 100;

export default function AdminDashboard() {
  const { user, ready } = useAuthGuard(['admin']);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [resume, setResume] = useState<DashboardResume | null>(null);
  const [serie, setSerie] = useState<DashboardSeriePoint[]>([]);
  const [topCompagnies, setTopCompagnies] = useState<DashboardCompagnieClassement[]>([]);
  const [remboursementsEnAttente, setRemboursementsEnAttente] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    Promise.all([
      compagniesApi.list().then(setCompagnies).catch(() => setCompagnies([])),
      dashboardApi.resume().then(setResume).catch(() => setResume(null)),
      dashboardApi.compagnies({ limit: 6 }).then(setTopCompagnies).catch(() => setTopCompagnies([])),
      dashboardApi.series(30).then(setSerie).catch(() => setSerie([])),
      remboursementsApi
        .listParStatut('en_attente', { take: REMB_MAX })
        .then((r) => setRemboursementsEnAttente(r.length))
        .catch(() => setRemboursementsEnAttente(0)),
    ]).finally(() => setChargement(false));
  }, [ready]);

  const courbeResa = useMemo(
    () => serie.map((p) => ({ label: p.date.slice(5), value: p.reservations })),
    [serie],
  );
  const sparkResa = useMemo(() => serie.map((p) => p.reservations), [serie]);
  const sparkCa = useMemo(() => serie.map((p) => Number(p.revenu)), [serie]);

  if (!ready) return null;

  const actives = compagnies.filter((c) => c.statut === 'actif').length;
  const caPaye = resume?.chiffreAffaires.parStatutPaiement.paye;
  const occ = resume?.occupation;

  const donutStatut = STATUT_PAIEMENT.map((s) => ({
    label: s.label,
    value: resume?.chiffreAffaires.parStatutPaiement[s.cle]?.nombre ?? 0,
    couleur: s.couleur,
  })).filter((s) => s.value > 0);

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Santé du réseau"
        subtitle="Activité de toutes les compagnies sur les 30 derniers jours."
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compagnies actives"
          value={chargement ? '…' : actives}
          icon={Building2}
          detail={`${compagnies.length} au total`}
        />
        <StatCard
          label="Réservations (30 j)"
          value={chargement ? '…' : resume?.reservations.total ?? 0}
          icon={TrendingUp}
          detail="Tous canaux"
        >
          {sparkResa.length > 1 && <Sparkline values={sparkResa} couleur="accent" />}
        </StatCard>
        <StatCard
          label="CA encaissé (30 j)"
          value={chargement ? '…' : `${compact(Number(caPaye?.montant ?? 0))} F`}
          icon={Wallet}
          detail={caPaye ? formatFcfa(caPaye.montant) : undefined}
        >
          {sparkCa.length > 1 && <Sparkline values={sparkCa} couleur="chart-3" />}
        </StatCard>
        <StatCard
          label="Remboursements en attente"
          value={chargement ? '…' : remboursementsEnAttente >= REMB_MAX ? `${REMB_MAX}+` : remboursementsEnAttente}
          icon={Undo2}
          detail="Réseau entier"
        />
      </div>

      <Card className="mb-5">
        <CardHeader title="Réservations du réseau" subtitle="Volume quotidien, toutes compagnies" />
        <div className="p-4">
          <AreaChart data={courbeResa} couleur="accent" ariaLabel="Réservations du réseau par jour" height={240} />
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Statut des paiements" subtitle="Sur les 30 derniers jours" />
          <div className="p-5">
            {donutStatut.length ? (
              <Donut parts={donutStatut} centreLabel="paiements" />
            ) : (
              <p className="py-6 text-center text-sm text-ink-faint">Aucun paiement sur la période.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Compagnies les plus actives"
            subtitle="Revenu encaissé sur 30 jours"
            right={
              <Link href="/admin/compagnies" className="inline-flex items-center gap-1 text-accent-ink hover:underline">
                Gérer <ArrowRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            }
          />
          <div className="p-5">
            {chargement ? (
              <p className="py-6 text-center text-sm text-ink-faint">Chargement...</p>
            ) : (
              <BarsH
                items={topCompagnies.map((c) => ({
                  label: c.nom,
                  value: Number(c.revenu),
                  sous: `${c.reservations} réservation${c.reservations > 1 ? 's' : ''} · ${c.placesVendues} place${c.placesVendues > 1 ? 's' : ''}`,
                }))}
                valueFormat={(n) => `${compact(n)} FCFA`}
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Occupation réseau" subtitle="Toutes compagnies confondues" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-soft">Taux de remplissage</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatPourcentage(occ?.tauxRemplissage ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Places occupées</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{occ?.placesOccupees ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Places offertes</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{occ?.placesTotales ?? 0}</p>
          </div>
        </div>
      </Card>
    </DashboardShell>
  );
}
