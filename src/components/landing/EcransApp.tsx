import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  Bus,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
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
  Écrans de l'application mobile, au style des visuels des stores
  (bleu nuit et orange Yègo), recréés en HTML pour rester nets.
*/

const NAVY = '#2C3E50';
const ORANGE = '#E67E22';

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
