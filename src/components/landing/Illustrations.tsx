import type { CSSProperties } from 'react';
import { Bus } from 'lucide-react';
import { LogoPaiement } from './Paiements';
import { MOBILE_MONEY } from './moyensPaiement';

// Illustrations décoratives de la landing page, animées en CSS seul
// (classes `lp-*` de landing.css). Valeurs déterministes : pas d'écart d'hydratation.

const v = (vars: Record<string, string>) => vars as CSSProperties;

/* ---------- Motif façon QR ---------- */

const CELLULES_QR = Array.from({ length: 81 }, (_, i) => (i * 37 + (i % 9) * 11) % 7 < 3);
const estCoin = (i: number) => {
  const x = i % 9;
  const y = Math.floor(i / 9);
  return (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
};

export function MotifQr({ taille = 7, scan = false }: { taille?: number; scan?: boolean }) {
  const cote = taille * 9 + 2 * 8 + 16;
  return (
    <div className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-white p-2">
      <div className="grid grid-cols-9 gap-[2px]">
        {CELLULES_QR.map((plein, i) => (
          <span
            key={i}
            className={`rounded-[1px] ${plein || estCoin(i) ? 'bg-[#12141a]' : 'bg-transparent'}`}
            style={{ width: taille, height: taille }}
          />
        ))}
      </div>
      {scan && (
        <span
          className="lp-scan absolute inset-x-0 top-1 h-0.5 bg-accent shadow-[0_0_12px_2px_rgb(var(--accent)/0.6)]"
          style={v({ '--course': `${cote - 10}px` })}
        />
      )}
    </div>
  );
}

/* ---------- Plan de sièges qui se remplit ---------- */

// 5 colonnes dont l'allée au centre ; quelques sièges déjà vendus.
const SIEGES = Array.from({ length: 40 }, (_, i) => i);
const VENDUS = new Set([1, 6, 8, 13, 17, 22, 26, 31, 37]);

export function PlanSieges() {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] text-ink-faint">
        <span className="font-medium text-ink-soft">Départ 07:30 · Car 02</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-accent" /> Vendu
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm border border-line bg-surface-2" /> Libre
          </span>
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {SIEGES.map((i) => {
          if (i % 5 === 2) return <span key={i} />;
          const vendu = VENDUS.has(i);
          return (
            <span
              key={i}
              className={`h-5 rounded-md border ${
                vendu ? 'border-ink-faint/30 bg-ink-faint/30' : 'lp-siege border-line bg-surface-2'
              }`}
              style={vendu ? undefined : v({ '--d': `${((i * 7) % 23) * 0.3}s` })}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Suivi GPS ---------- */

const TRACE = 'M 14 96 C 60 100, 64 34, 112 50 S 170 22, 206 20';

export function CarteGps() {
  return (
    <div className="relative mx-auto h-[120px] w-[220px]">
      <svg viewBox="0 0 220 120" width="220" height="120" className="absolute inset-0 overflow-visible">
        <path d={TRACE} fill="none" stroke="rgb(var(--line))" strokeWidth="6" strokeLinecap="round" />
        <path
          d={TRACE}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        <circle cx="14" cy="96" r="5" fill="rgb(var(--surface))" stroke="rgb(var(--ink-faint))" strokeWidth="2" />
        <circle cx="206" cy="20" r="5" fill="rgb(var(--accent))" />
      </svg>
      <span
        className="lp-gps absolute left-0 top-0 flex h-7 w-7 items-center justify-center"
        style={{ offsetPath: `path("${TRACE}")`, offsetRotate: '0deg' }}
      >
        <span className="lp-onde absolute inset-0 rounded-full bg-accent/40" />
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-card">
          <Bus className="h-3.5 w-3.5" />
        </span>
      </span>
      <span className="absolute -bottom-1 left-0 text-[10px] font-medium text-ink-faint">Abidjan</span>
      <span className="absolute -top-3 right-0 text-[10px] font-medium text-ink-faint">Bouaké</span>
    </div>
  );
}

/* ---------- Notifications de paiement ---------- */

const PAIEMENTS = [
  { moyen: MOBILE_MONEY[0], montant: '+7 000 F', trajet: 'Abidjan → Bouaké' },
  { moyen: MOBILE_MONEY[1], montant: '+5 500 F', trajet: 'Abidjan → Yamoussoukro' },
  { moyen: MOBILE_MONEY[2], montant: '+9 000 F', trajet: 'Abidjan → Korhogo' },
  { moyen: MOBILE_MONEY[3], montant: '+6 000 F', trajet: 'Bouaké → Man' },
];

export function NotificationsPaiement() {
  return (
    <div className="relative h-[68px]">
      {PAIEMENTS.map(({ moyen, montant, trajet }, i) => (
        <div
          key={moyen.nom}
          className="lp-toast absolute inset-x-0 top-0 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 shadow-subtle"
          style={v({ '--d': `${i * 3}s` })}
        >
          <LogoPaiement moyen={moyen} taille={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center justify-between gap-2 text-sm font-semibold">
              {moyen.nom}
              <span className="tabular-nums text-success">{montant}</span>
            </p>
            <p className="truncate text-xs text-ink-faint">{trajet}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Mini graphique (se dessine à l'apparition du parent Revele) ---------- */

const BARRES = [38, 52, 44, 66, 58, 74, 62, 80, 71, 88, 79, 96];

export function MiniGraphique() {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] text-ink-faint">Billets vendus · 30 jours</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight">Tendance</p>
        </div>
        <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">En hausse</span>
      </div>
      <div className="relative mt-4 h-28">
        <div className="absolute inset-0 flex items-end gap-1.5">
          {BARRES.map((h, i) => (
            <span
              key={i}
              className="lp-barre flex-1 rounded-t-md bg-accent/25"
              style={{ height: `${h}%`, ...v({ '--d': `${i * 60}ms` }) }}
            />
          ))}
        </div>
        <svg viewBox="0 0 120 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path
            className="lp-trace"
            pathLength={1}
            d="M 4 66 L 14 52 L 24 58 L 34 38 L 44 44 L 54 30 L 64 40 L 74 22 L 84 30 L 94 14 L 104 22 L 116 6"
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------- Bande défilante des villes ---------- */

const VILLES = [
  'Abidjan',
  'Bouaké',
  'Yamoussoukro',
  'San-Pédro',
  'Korhogo',
  'Daloa',
  'Man',
  'Gagnoa',
  'Abengourou',
  'Odienné',
  'Bondoukou',
  'Divo',
];

export function Defilant() {
  const serie = (cache: boolean) => (
    <ul aria-hidden={cache || undefined} className="flex shrink-0 items-center">
      {VILLES.map((ville) => (
        <li key={ville} className="flex items-center gap-8 pr-8 text-lg font-medium text-ink-faint sm:text-xl">
          {ville}
          <Bus className="h-4 w-4 text-accent/60" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="lp-defilant overflow-hidden py-2">
      <div className="lp-defilant-piste">
        {serie(false)}
        {serie(true)}
      </div>
    </div>
  );
}
