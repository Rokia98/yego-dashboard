'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  Bus,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  History,
  MapPin,
  Navigation,
  Pencil,
  QrCode,
  RotateCw,
  Search,
  ShieldCheck,
  Ticket,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { EpingleYego } from './Logo';
import { MotifQr } from './Illustrations';
import { LogoPaiement } from './Paiements';
import { MOBILE_MONEY } from './moyensPaiement';

/*
  Vitrine de l'application mobile, au style des visuels des stores :
  fond bleu nuit Yègo, titres dont la fin est en orange, téléphones en
  carrousel. Les écrans sont recréés en HTML (nets à toutes les tailles).
*/

const NAVY = '#2C3E50';
const ORANGE = '#E67E22';

type Diapo = { titre: string; accent: string; sousTitre: string; Ecran: () => React.ReactElement };

const DIAPOS: Diapo[] = [
  { titre: 'Votre bus en', accent: 'quelques secondes', sousTitre: 'Réservez partout en Côte d’Ivoire', Ecran: EcranAccueil },
  { titre: 'Comparez', accent: 'les départs', sousTitre: 'Horaires, prix et places en un coup d’œil', Ecran: EcranDeparts },
  { titre: 'Choisissez', accent: 'votre siège', sousTitre: 'Fenêtre ou couloir, c’est vous qui décidez', Ecran: EcranSieges },
  { titre: 'Votre billet', accent: 'dans la poche', sousTitre: 'Un QR code, et vous montez à bord', Ecran: EcranBillet },
  { titre: 'Suivez votre bus', accent: 'en direct', sousTitre: 'Sachez exactement où il se trouve', Ecran: EcranSuivi },
  { titre: 'Embarquement', accent: 'sans file', sousTitre: 'Les agents scannent, vous montez', Ecran: EcranScan },
];

export default function EcransApp() {
  const piste = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(0);

  // Diapo la plus centrée dans la piste → point actif.
  const surDefilement = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    let meilleur = 0;
    let ecart = Infinity;
    [...el.children].forEach((c, i) => {
      const n = c as HTMLElement;
      const d = Math.abs(n.offsetLeft + n.offsetWidth / 2 - centre);
      if (d < ecart) {
        ecart = d;
        meilleur = i;
      }
    });
    setActif(meilleur);
  }, []);

  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    el.addEventListener('scroll', surDefilement, { passive: true });
    return () => el.removeEventListener('scroll', surDefilement);
  }, [surDefilement]);

  function aller(i: number) {
    const el = piste.current;
    const cible = el?.children[Math.max(0, Math.min(DIAPOS.length - 1, i))] as HTMLElement | undefined;
    if (!el || !cible) return;
    el.scrollTo({ left: cible.offsetLeft - (el.clientWidth - cible.offsetWidth) / 2, behavior: 'smooth' });
  }

  return (
    <section
      id="app"
      aria-label="L’application Yègo"
      className="relative scroll-mt-20 overflow-hidden py-20 text-white lg:py-28"
      style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #26364a 100%)` }}
    >
      {/* Grands disques et pointillés, comme sur les visuels des stores */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-white/[0.06]" />
        <span className="absolute -left-48 bottom-[-120px] h-[460px] w-[460px] rounded-full bg-white/[0.05]" />
        <svg className="absolute left-0 top-[46%] w-full opacity-60" height="80" viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path
            d="M0 40 C 200 0, 400 80, 600 40 S 1000 0, 1200 40"
            fill="none"
            stroke={ORANGE}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 18"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Carrousel */}
        <div className="relative">
          <div
            ref={piste}
            className="lp-carrousel mx-[calc(50%-50vw)] flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc(50vw-140px))] pb-6 sm:px-[max(1rem,calc(50vw-150px))] lg:px-[max(1.5rem,calc(50vw-560px))]"
          >
            {DIAPOS.map(({ titre, accent, sousTitre, Ecran }, i) => (
              <figure
                key={accent}
                className={`w-[280px] shrink-0 snap-center transition-all duration-500 sm:w-[300px] ${
                  actif === i ? 'opacity-100' : 'opacity-70 lg:opacity-100'
                }`}
              >
                <figcaption className="mb-6 flex min-h-[7.5rem] flex-col justify-end text-center">
                  <p className="text-2xl font-extrabold leading-tight tracking-tight">
                    {titre} <span style={{ color: ORANGE }}>{accent}</span>
                  </p>
                  <p className="mt-2 text-sm text-white/70">{sousTitre}</p>
                </figcaption>
                <Telephone>
                  <Ecran />
                </Telephone>
              </figure>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => aller(actif - 1)}
              disabled={actif === 0}
              aria-label="Écran précédent"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {DIAPOS.map((d, i) => (
                <button
                  key={d.accent}
                  type="button"
                  onClick={() => aller(i)}
                  aria-label={`Écran ${i + 1} : ${d.titre} ${d.accent}`}
                  aria-current={actif === i}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: actif === i ? 28 : 8, background: actif === i ? ORANGE : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => aller(actif + 1)}
              disabled={actif === DIAPOS.length - 1}
              aria-label="Écran suivant"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#application"
            className="lp-brillant inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white shadow-[0_14px_30px_-12px_rgba(230,126,34,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: ORANGE }}
          >
            Disponible sur iPhone et Android
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Démo animée (section voyageurs) */

const ETAPES_DEMO: { label: string; Ecran: () => React.ReactElement }[] = [
  { label: 'Réserver', Ecran: EcranAccueil },
  { label: 'Payer', Ecran: EcranPaiement },
  { label: 'Embarquer', Ecran: EcranBillet },
];

/**
 * Un seul téléphone qui enchaîne les vrais écrans de l'app (recherche,
 * paiement, billet) en boucle, avec les étapes en dessous.
 */
export function TelephoneDemo() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(230,126,34,0.28),transparent_65%)]"
        />
        <div
          aria-hidden
          className="absolute -inset-x-16 top-16 bottom-16 -z-0 rounded-[3rem]"
          style={{ background: `linear-gradient(160deg, ${NAVY}, #26364a)` }}
        />
        <div className="relative">
          <Telephone>
            {ETAPES_DEMO.map(({ label, Ecran }, i) => (
              <div
                key={label}
                className="lp-ecran absolute inset-0"
                style={{ ['--d' as string]: `${i * 4}s` }}
              >
                <Ecran />
              </div>
            ))}
          </Telephone>
        </div>
      </div>
      <ol className="mt-10 flex gap-2">
        {ETAPES_DEMO.map(({ label }, i) => (
          <li
            key={label}
            className="lp-etape-demo rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ ['--d' as string]: `${i * 4}s` }}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------ Cadre */

function Telephone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[260px] rounded-[2.6rem] bg-[#1a2433] p-[9px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
      <div className="relative h-[540px] overflow-hidden rounded-[2.1rem] bg-[#F2F4F7] text-[#1f2d3d]">
        <span className="absolute left-1/2 top-2 z-20 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#12161d]" />
        {children}
      </div>
    </div>
  );
}

function BarreEtat({ clair = false }: { clair?: boolean }) {
  return (
    <div className={`relative z-10 flex items-center justify-between px-6 pt-3 text-[11px] font-bold ${clair ? 'text-white' : 'text-[#1f2d3d]'}`}>
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border-[1.5px] border-current p-[1px]">
          <span className="block h-full w-full rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

function Onglets({ actif, items }: { actif: number; items: { icone: LucideIcon; label: string }[] }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex border-t border-[#e3e7ec] bg-white px-2 pb-4 pt-2">
      {items.map(({ icone: Icone, label }, i) => (
        <span key={label} className="flex flex-1 flex-col items-center gap-0.5 text-[9px] font-semibold" style={{ color: i === actif ? ORANGE : '#8a95a3' }}>
          <Icone className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {label}
        </span>
      ))}
    </div>
  );
}

const ONGLETS_VOYAGEUR = [
  { icone: Search, label: 'Accueil' },
  { icone: Bus, label: 'Mes trajets' },
  { icone: Ticket, label: 'Billets' },
  { icone: User, label: 'Profil' },
];

function EnteteNavy({ titre, sousTitre, droite }: { titre: string; sousTitre: string; droite?: React.ReactNode }) {
  return (
    <div className="rounded-b-[1.6rem] px-4 pb-4" style={{ background: NAVY }}>
      <BarreEtat clair />
      <div className="mt-4 flex items-center gap-3 text-white">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <ChevronLeft className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold">{titre}</p>
          <p className="truncate text-[10px] text-white/75">{sousTitre}</p>
        </div>
        {droite}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Écrans */

function EcranAccueil() {
  return (
    <>
      <div className="bg-white pb-2">
        <BarreEtat />
        <div className="mt-3 flex items-center justify-between px-4">
          <span className="flex items-center gap-1.5">
            <EpingleYego className="h-6 w-6" />
            <span className="text-[15px] font-extrabold" style={{ color: NAVY }}>
              Y<span style={{ color: ORANGE }}>è</span>go
            </span>
          </span>
          <span className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-[#1f2d3d]" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: NAVY }}>
              AK
            </span>
          </span>
        </div>
      </div>
      <div className="px-4 pb-14 pt-3 text-white" style={{ background: NAVY }}>
        <p className="text-[15px] font-extrabold">Où allons-nous ?</p>
        <p className="mt-0.5 text-[9px] text-white/75">Trouvez et réservez votre bus en quelques secondes.</p>
      </div>
      <div className="relative mx-3 -mt-11 rounded-2xl bg-white p-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#1f2d3d]" />
            <span className="h-7 w-px bg-[#d5dbe2]" />
            <MapPin className="h-3 w-3" style={{ color: ORANGE }} />
          </div>
          <div className="flex-1">
            <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">DÉPART</p>
            <p className="text-[12px] font-extrabold">Abidjan</p>
            <div className="my-1.5 h-px bg-[#e3e7ec]" />
            <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">ARRIVÉE</p>
            <p className="text-[12px] font-extrabold">Bouaké</p>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border" style={{ borderColor: '#f3c9a3', color: ORANGE }}>
            <ArrowLeftRight className="h-3 w-3 rotate-90" />
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 divide-x divide-[#e3e7ec] rounded-xl border border-[#e3e7ec]">
          <div className="flex items-center gap-1.5 p-2">
            <CalendarDays className="h-3.5 w-3.5" style={{ color: ORANGE }} />
            <div>
              <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">DATE</p>
              <p className="text-[10px] font-extrabold">Sam. 14 nov.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2">
            <Users className="h-3.5 w-3.5" style={{ color: ORANGE }} />
            <div>
              <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">VOYAGEURS</p>
              <p className="text-[10px] font-extrabold">2</p>
            </div>
          </div>
        </div>
        <span className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold text-white" style={{ background: ORANGE }}>
          <Search className="h-3.5 w-3.5" /> Rechercher
        </span>
      </div>
      <p className="mx-4 mt-3 text-[11px] font-extrabold">Trajets récents</p>
      <div className="mx-3 mt-1.5 divide-y divide-[#eef1f4] rounded-2xl bg-white px-3">
        {[
          ['Abidjan → Yamoussoukro', 'Hier · 1 voyageur'],
          ['Abidjan → Korhogo', '12 nov. · 2 voyageurs'],
        ].map(([t, s]) => (
          <div key={t} className="flex items-center gap-2 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fdeee1]" style={{ color: ORANGE }}>
              <Clock className="h-3 w-3" />
            </span>
            <div className="flex-1">
              <p className="text-[10px] font-extrabold">{t}</p>
              <p className="text-[8px] text-[#8a95a3]">{s}</p>
            </div>
            <ChevronRight className="h-3 w-3 text-[#8a95a3]" />
          </div>
        ))}
      </div>
      <Onglets actif={0} items={ONGLETS_VOYAGEUR} />
    </>
  );
}

function EcranDeparts() {
  const departs = [
    { h: '06:00', c: 'Trans Lagune', s: 'TL', p: '24 places restantes', prix: '5 000' },
    { h: '08:30', c: 'CHONCO', s: 'IV', p: '12 places restantes', prix: '5 500', choisi: true },
    { h: '11:00', c: 'UTB', s: 'ST', p: '31 places restantes', prix: '4 500' },
    { h: '14:00', c: 'Trans Lagune', s: 'TL', p: '8 places restantes', prix: '5 000' },
    { h: '19:30', c: 'UTS', s: 'EN', p: 'Plus que 3 places', prix: '6 000', alerte: true },
  ];
  return (
    <>
      <div className="rounded-b-[1.6rem] px-4 pb-4" style={{ background: NAVY }}>
        <BarreEtat clair />
        <div className="mt-3 flex items-center justify-between">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold text-white">
            <Pencil className="h-2.5 w-2.5" /> Modifier
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[15px] font-extrabold text-white">
          Abidjan <ArrowRight className="h-3.5 w-3.5" style={{ color: ORANGE }} /> Bouaké
        </p>
        <p className="text-[9px] text-white/75">Sam. 14 nov. · 2 voyageurs · 5 départs</p>
      </div>
      <p className="mx-4 mt-3 text-[8px] font-bold tracking-wider text-[#5b6572]">SAMEDI 14 NOVEMBRE</p>
      <div className="mt-1.5 space-y-1.5 px-3">
        {departs.map((d) => (
          <div
            key={d.h}
            className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2"
            style={d.choisi ? { boxShadow: `0 0 0 1.5px ${ORANGE}` } : undefined}
          >
            <div className="w-10">
              <p className="text-[12px] font-extrabold leading-none">{d.h}</p>
              <p className="mt-0.5 text-[6px] font-bold tracking-wider text-[#8a95a3]">DÉPART</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[9px] font-extrabold">
                <span className="truncate">{d.c}</span>
                <span className="rounded px-1 py-0.5 text-[6px] text-white" style={{ background: NAVY }}>
                  {d.s}
                </span>
              </p>
              <p className="text-[8px] font-semibold" style={{ color: d.alerte ? '#d35400' : '#5b6572' }}>
                {d.p}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold" style={{ color: ORANGE }}>
                {d.prix} FCFA
              </p>
              <p className="text-[7px] text-[#8a95a3]">par place</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-white px-3 pb-4 pt-2">
        <span className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-extrabold text-white" style={{ background: ORANGE }}>
          <ArrowRight className="h-3.5 w-3.5" /> Choisir les places
        </span>
      </div>
    </>
  );
}

const OCCUPES = new Set([1, 2, 3, 5, 6, 8, 12, 13, 14, 17, 18, 20, 21, 23, 26, 27, 30, 31, 33, 35]);
const CHOISIS = new Set([9, 10]);

function EcranSieges() {
  return (
    <>
      <EnteteNavy titre="Choisir les places" sousTitre="Abidjan → Bouaké · 08:30 · Ivoire Voyages" />
      <div className="mt-2.5 flex justify-center gap-3 text-[8px] font-semibold text-[#5b6572]">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] border border-[#c9d0d8] bg-white" /> Libre
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#dde2e8]" /> Occupé
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: ORANGE }} /> Votre choix
        </span>
      </div>
      <div className="mx-6 mt-2 rounded-2xl bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between border-b border-dashed border-[#dde2e8] pb-1.5 text-[7px] font-semibold text-[#5b6572]">
          <span>Chauffeur</span>
          <span>Avant du bus</span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_0.6fr_1fr_1fr] gap-1">
          {Array.from({ length: 36 }, (_, k) => {
            const rangee = Math.floor(k / 4);
            const col = k % 4;
            const n = rangee * 4 + col + 1;
            const etat = CHOISIS.has(n) ? 'choisi' : OCCUPES.has(n) ? 'occupe' : 'libre';
            const siege = (
              <span
                key={n}
                className="flex h-5 items-center justify-center rounded-[5px] text-[7px] font-bold"
                style={
                  etat === 'choisi'
                    ? { background: ORANGE, color: '#fff' }
                    : etat === 'occupe'
                      ? { background: '#dde2e8', color: '#8a95a3' }
                      : { background: '#fff', border: '1px solid #c9d0d8', color: '#1f2d3d' }
                }
              >
                {n}
              </span>
            );
            return col === 2 ? [<span key={`a${n}`} />, siege] : siege;
          })}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#e3e7ec] bg-white px-4 pb-4 pt-2.5">
        <div>
          <p className="text-[8px] text-[#5b6572]">2 places · sièges 9 et 10</p>
          <p className="text-[14px] font-extrabold">11 000 FCFA</p>
        </div>
        <span className="flex items-center gap-1 rounded-xl px-3.5 py-2 text-[11px] font-extrabold text-white" style={{ background: ORANGE }}>
          Continuer <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </>
  );
}

function EcranPaiement() {
  return (
    <>
      <EnteteNavy titre="Paiement" sousTitre="Abidjan → Bouaké · 08:30 · Sièges 9 et 10" />
      <div className="mx-3 mt-3 rounded-2xl bg-white p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className="rounded-md px-1.5 py-0.5 text-[7px] text-white" style={{ background: NAVY }}>
              IV
            </span>
            Ivoire Voyages
          </span>
          <span className="text-[8px] font-semibold text-[#8a95a3]">Sam. 14 nov.</span>
        </div>
        <div className="mt-2 space-y-1 text-[9px]">
          {[
            ['2 places × 5 500 FCFA', '11 000'],
            ['Frais de service', '0'],
          ].map(([l, m]) => (
            <p key={l} className="flex justify-between text-[#5b6572]">
              <span>{l}</span>
              <span className="font-bold text-[#1f2d3d]">{m} FCFA</span>
            </p>
          ))}
        </div>
      </div>
      <p className="mx-4 mt-3 text-[8px] font-bold tracking-wider text-[#5b6572]">PAYER AVEC MOBILE MONEY</p>
      <div className="mx-3 mt-1.5 space-y-1.5">
        {MOBILE_MONEY.slice(0, 4).map((m, i) => (
          <div
            key={m.nom}
            className="flex items-center justify-between rounded-xl bg-white px-2.5 py-1.5"
            style={i === 0 ? { boxShadow: `0 0 0 1.5px ${ORANGE}` } : undefined}
          >
            <span className="flex items-center gap-2 text-[10px] font-extrabold">
              <LogoPaiement moyen={m} taille={22} className="rounded-md" /> {m.nom}
            </span>
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2"
              style={i === 0 ? { borderColor: ORANGE, background: ORANGE } : { borderColor: '#c9d0d8' }}
            >
              {i === 0 && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-[8px] font-semibold text-[#5b6572]">
        <ShieldCheck className="h-3 w-3 text-[#27ae60]" /> Paiement sécurisé
      </p>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#e3e7ec] bg-white px-4 pb-4 pt-2.5">
        <div>
          <p className="text-[8px] text-[#5b6572]">Total à payer</p>
          <p className="text-[14px] font-extrabold">11 000 FCFA</p>
        </div>
        <span className="flex items-center gap-1 rounded-xl px-3.5 py-2 text-[11px] font-extrabold text-white" style={{ background: ORANGE }}>
          Payer <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </>
  );
}

function EcranBillet() {
  return (
    <>
      <EnteteNavy titre="Mon billet" sousTitre="Billet 1 sur 2 · Aller simple" />
      <div className="relative mx-3 mt-3 rounded-2xl bg-white px-3.5 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className="rounded-md px-1.5 py-0.5 text-[7px] text-white" style={{ background: NAVY }}>
              IV
            </span>
            Ivoire Voyages
          </span>
          <span className="rounded-full bg-[#e3f5e9] px-2 py-0.5 text-[8px] font-bold text-[#1e8a4c]">Payée</span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">DE</p>
            <p className="text-[15px] font-extrabold">Abidjan</p>
          </div>
          <span className="mb-1.5 flex flex-1 items-center gap-1 px-2">
            <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: ORANGE }} />
            <Bus className="h-3.5 w-3.5" style={{ color: ORANGE }} />
            <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: ORANGE }} />
          </span>
          <div className="text-right">
            <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">À</p>
            <p className="text-[15px] font-extrabold">Bouaké</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-y-1.5">
          {[
            ['PASSAGER', 'Aya Kouassi'],
            ['DATE', 'Sam. 14 nov.'],
            ['DÉPART', '08:30'],
            ['SIÈGE', '10'],
          ].map(([k, val]) => (
            <div key={k}>
              <p className="text-[7px] font-bold tracking-wider text-[#8a95a3]">{k}</p>
              <p className="text-[11px] font-extrabold">{val}</p>
            </div>
          ))}
        </div>
        <div className="relative -mx-3.5 my-3 border-t border-dashed border-[#dde2e8]">
          <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#F2F4F7]" />
          <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#F2F4F7]" />
        </div>
        <div className="flex flex-col items-center">
          <MotifQr taille={9} scan />
          <p className="mt-2 text-[9px] font-bold">Présentez ce code à l’embarquement</p>
          <p className="mt-0.5 text-[8px] font-semibold tracking-wider text-[#8a95a3]">RÉF. YGO-48213</p>
        </div>
      </div>
      <Onglets actif={2} items={ONGLETS_VOYAGEUR} />
    </>
  );
}

function EcranSuivi() {
  return (
    <>
      <div className="absolute inset-0 bg-[#e8ece9]">
        <svg viewBox="0 0 260 300" className="h-[300px] w-full" aria-hidden>
          <path d="M0 40 Q 80 70 130 30 T 260 50 V 0 H 0Z" fill="#dce9d5" />
          <path d="M0 230 Q 70 190 140 220 T 260 200 V 300 H 0Z" fill="#dce9d5" />
          <ellipse cx="210" cy="180" rx="45" ry="30" fill="#d5e5f0" />
          <g stroke="#fff" strokeWidth="6">
            <line x1="20" y1="0" x2="80" y2="300" />
            <line x1="160" y1="0" x2="230" y2="300" />
            <line x1="0" y1="60" x2="260" y2="110" />
            <line x1="0" y1="200" x2="260" y2="150" />
          </g>
          <path d="M60 260 L 115 170 Q 135 120 170 95" stroke={ORANGE} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M170 95 L 190 80" stroke={ORANGE} strokeWidth="3" fill="none" strokeDasharray="3 5" strokeLinecap="round" />
          <circle cx="60" cy="260" r="6" fill="#fff" stroke={NAVY} strokeWidth="3" />
          <circle cx="115" cy="170" r="4" fill={ORANGE} stroke="#fff" strokeWidth="2" />
          <circle cx="198" cy="74" r="6" fill={NAVY} stroke="#fff" strokeWidth="3" />
          <text x="68" y="282" fontSize="9" fontWeight="700" fill={NAVY}>Abidjan</text>
          <text x="88" y="190" fontSize="8" fontWeight="700" fill={NAVY}>Yamoussoukro</text>
          <text x="180" y="62" fontSize="9" fontWeight="700" fill={NAVY}>Bouaké</text>
        </svg>
        <span
          className="lp-pulse absolute flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white text-white shadow-lg"
          style={{ left: 154, top: 79, background: ORANGE }}
        >
          <Bus className="h-3.5 w-3.5" />
        </span>
      </div>
      <BarreEtat />
      <span className="absolute left-3 top-11 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow">
        <ChevronLeft className="h-4 w-4" />
      </span>
      <div className="absolute inset-x-0 bottom-[50px] rounded-t-[1.4rem] bg-white px-3.5 pb-3 pt-2 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
        <span className="mx-auto mb-2 block h-1 w-8 rounded-full bg-[#dde2e8]" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[8px] font-extrabold tracking-wider text-[#1e8a4c]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#27ae60]" /> EN DIRECT
          </span>
          <span className="rounded-full bg-[#fdeee1] px-2 py-0.5 text-[8px] font-bold" style={{ color: '#c0620f' }}>
            En route
          </span>
        </div>
        <p className="mt-1 text-[13px] font-extrabold">Abidjan → Bouaké</p>
        <p className="text-[8px] text-[#5b6572]">Ivoire Voyages · départ 08:30 · siège 10</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            ['13:40', 'Arrivée prévue', true],
            ['38 km', 'Restants', false],
            ['82 km/h', 'Vitesse', false],
          ].map(([v, l, o]) => (
            <div key={String(l)} className="rounded-lg bg-[#F2F4F7] px-2 py-1.5">
              <p className="text-[11px] font-extrabold" style={o ? { color: ORANGE } : undefined}>
                {v}
              </p>
              <p className="text-[7px] text-[#5b6572]">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
          <div className="h-full w-[88%] rounded-full" style={{ background: ORANGE }} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <span className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-extrabold text-white" style={{ background: ORANGE }}>
            <QrCode className="h-3 w-3" /> Voir le ticket
          </span>
          <span className="flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[9px] font-extrabold" style={{ borderColor: ORANGE, color: '#c0620f' }}>
            <CircleAlert className="h-3 w-3" /> Signaler
          </span>
        </div>
      </div>
      <Onglets actif={1} items={ONGLETS_VOYAGEUR} />
    </>
  );
}

function EcranScan() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: '#1b2533' }} />
      <BarreEtat clair />
      <div className="relative mt-4 flex items-center justify-between px-4 text-white">
        <div>
          <p className="text-[15px] font-extrabold">Valider les billets</p>
          <p className="text-[9px] text-white/75">Abidjan → Bouaké · 08:30</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: ORANGE }}>
          AG
        </span>
      </div>
      {/* Viseur */}
      <div className="relative mx-auto mt-5 h-[130px] w-[130px]">
        {['left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl', 'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl'].map((c) => (
          <span key={c} className={`absolute h-6 w-6 ${c}`} style={{ borderColor: ORANGE }} />
        ))}
        <div className="absolute inset-5 grid grid-cols-5 gap-1 opacity-40">
          {Array.from({ length: 25 }, (_, i) => (
            <span key={i} className={`rounded-[2px] ${[0, 1, 3, 4, 5, 9, 12, 15, 19, 20, 21, 23, 24, 7, 17].includes(i) ? 'bg-white' : ''}`} />
          ))}
        </div>
        <span
          className="lp-scan absolute inset-x-4 top-4 h-0.5 rounded-full shadow-[0_0_12px_2px_rgba(230,126,34,0.7)]"
          style={{ background: ORANGE, ['--course' as string]: '96px' }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-[50px] top-[235px] rounded-t-[1.4rem] bg-[#F2F4F7] px-3 pt-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-[#e3f5e9] p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#27ae60] text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[12px] font-extrabold text-[#1e8a4c]">Billet validé</p>
            <p className="text-[9px] font-bold">Aya Kouassi · Siège 10</p>
            <p className="text-[8px] text-[#5b6572]">Ivoire Voyages · Réf. YGO-48213</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-[10px] font-extrabold">Billets scannés</p>
          <p className="text-[8px] font-semibold text-[#5b6572]">18 validés · 19 scans</p>
        </div>
        <div className="mt-1.5 divide-y divide-[#eef1f4] rounded-xl bg-white px-2.5">
          {[
            ['Aya Kouassi · siège 10', 'À l’instant', true],
            ['Koffi Yao · siège 9', 'Il y a 1 min', true],
            ['Siège 4', 'Il y a 3 min', false],
          ].map(([n, t, ok]) => (
            <div key={String(n)} className="flex items-center gap-2 py-1.5">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ background: ok ? '#27ae60' : '#d35400' }}
              >
                {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <RotateCw className="h-3 w-3" strokeWidth={2.5} />}
              </span>
              <div className="flex-1">
                <p className="text-[9px] font-extrabold">{n}</p>
                <p className="text-[7px] text-[#5b6572]">{t}</p>
              </div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[7px] font-bold"
                style={ok ? { background: '#e3f5e9', color: '#1e8a4c' } : { background: '#fdeee1', color: '#c0620f' }}
              >
                {ok ? 'Validé' : 'Déjà scanné'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Onglets
        actif={0}
        items={[
          { icone: QrCode, label: 'Valider' },
          { icone: History, label: 'Scannés' },
          { icone: Navigation, label: 'Conduite' },
          { icone: User, label: 'Profil' },
        ]}
      />
    </>
  );
}
