import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  FileText,
  Gauge,
  HandCoins,
  MapPin,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Store,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { PATH_CONNEXION } from '@/lib/session';
import '@/components/landing/landing.css';
import EnTete from '@/components/landing/EnTete';
import PiedDePage from '@/components/landing/PiedDePage';
import Faq, { type Question } from '@/components/landing/Faq';
import { LIEN_APPEL, LIEN_WHATSAPP, TELEPHONE_AFFICHE } from '@/components/landing/contact';
import Revele from '@/components/landing/Revele';
import BilletInteractif from '@/components/landing/BilletInteractif';
import GrilleProjecteur from '@/components/landing/GrilleProjecteur';
import Parcours from '@/components/landing/Parcours';
import WhatsAppFlottant from '@/components/landing/WhatsAppFlottant';
import {
  CarteGps,
  Defilant,
  MiniGraphique,
  MotifQr,
  NotificationsPaiement,
  PlanSieges,
  TelephoneDemo,
} from '@/components/landing/Illustrations';

export const metadata: Metadata = {
  title: 'Yègo — La billetterie digitale des compagnies de car',
  description:
    'Vente en ligne et au guichet, billets QR, suivi GPS des départs et paiement Mobile Money pour les compagnies de transport.',
};

const ETAPES = [
  {
    titre: 'Rejoignez Yègo',
    texte: 'Écrivez-nous sur WhatsApp : nous créons votre espace compagnie et validons vos documents (registre, autorisation de transport).',
  },
  {
    titre: 'Configurez votre réseau',
    texte: 'Ajoutez vos trajets, vos cars et vos chauffeurs, planifiez vos départs. Vos agents de guichet reçoivent leurs accès.',
  },
  {
    titre: 'Vendez partout',
    texte: 'Billets vendus au guichet et dans l’app, paiements Mobile Money suivis en temps réel, reversements sur simple demande.',
  },
  {
    titre: 'Pilotez au quotidien',
    texte: 'Suivez vos cars sur la carte, contrôlez les billets à l’embarquement et analysez vos ventes sur 30 jours.',
  },
];

const PETITES_FONCTIONNALITES: { icon: LucideIcon; titre: string; texte: string }[] = [
  { icon: Smartphone, titre: 'Réservation en ligne', texte: 'Vos voyageurs réservent depuis l’app Yègo, 24 h/24.' },
  { icon: ScanLine, titre: 'Contrôle des billets', texte: 'QR unique scanné à l’embarquement : aucun doublon.' },
  { icon: Bus, titre: 'Flotte & chauffeurs', texte: 'Cars, chauffeurs et agents gérés au même endroit.' },
  { icon: HandCoins, titre: 'Reversements', texte: 'Solde consultable et demande de reversement en un clic.' },
];

const CONFIANCE: { icon: LucideIcon; titre: string; texte: string }[] = [
  { icon: ShieldCheck, titre: 'Sans surréservation', texte: 'Chaque place vendue est bloquée instantanément.' },
  { icon: Ticket, titre: 'Un billet, une place', texte: 'Le QR code ne sert qu’une seule fois.' },
  { icon: FileText, titre: 'Compagnies vérifiées', texte: 'Documents contrôlés par l’équipe Yègo.' },
  { icon: MapPin, titre: 'Retards annoncés', texte: 'Le voyageur est prévenu en cas de décalage.' },
];

const QUESTIONS: Question[] = [
  {
    question: 'Faut-il acheter du matériel ?',
    reponse:
      'Non. Un ordinateur ou un téléphone connecté suffit pour vendre au guichet ; une imprimante permet en plus de remettre un billet papier. Le dashboard est conçu pour rester léger, même en 3G.',
  },
  {
    question: 'Comment les voyageurs paient-ils ?',
    reponse:
      'Dans l’app Yègo, par Wave ou Orange Money. Au guichet, vos agents encaissent en espèces ou en Mobile Money et le billet est généré aussitôt.',
  },
  {
    question: 'Comment je récupère l’argent des ventes en ligne ?',
    reponse:
      'Votre solde est visible à tout moment dans votre espace. Vous faites une demande de reversement du montant voulu, l’équipe Yègo la valide et vous remet les fonds.',
  },
  {
    question: 'Mes agents de guichet peuvent-ils avoir leur propre accès ?',
    reponse:
      'Oui. Le gestionnaire de la compagnie crée un compte par agent. Chaque agent vend et gère les départs, sans accès aux réglages ni aux finances de la compagnie.',
  },
  {
    question: 'Que se passe-t-il si un voyageur annule ?',
    reponse:
      'L’annulation suit un barème de remboursement clair. Les remboursements sont suivis depuis votre espace, par transfert Mobile Money ou constat manuel.',
  },
  {
    question: 'Combien ça coûte ?',
    reponse:
      'Yègo fonctionne par abonnement pour la compagnie. Écrivez-nous sur WhatsApp : nous vous présentons l’offre adaptée à la taille de votre réseau.',
  },
];

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export default function LandingPage() {
  return (
    <div id="haut" className="lp min-h-screen bg-paper text-ink">
      {/* Sans JavaScript, les blocs « Revele » restent visibles. */}
      <noscript dangerouslySetInnerHTML={{ __html: '<style>.lp-revele,.lp-lettre{opacity:1!important;transform:none!important}</style>' }} />

      <EnTete />

      <main>
        <Heros />

        <section aria-label="Trajets interurbains" className="border-y border-line-soft bg-surface py-6">
          <Defilant />
        </section>

        <Fonctionnalites />
        <Fonctionnement />
        <Voyageurs />
        <QuestionsFrequentes />
        <Contact />
      </main>

      <PiedDePage />
      <WhatsAppFlottant lien={LIEN_WHATSAPP} />
    </div>
  );
}

/* ---------------------------------------------------------------- Héros */

function Heros() {
  const mots = ['Vendez', 'vos', 'billets'];
  return (
    <section className="relative overflow-hidden pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="lp-grille absolute inset-0" />
        <div
          className="lp-tache -right-40 -top-40 h-[620px] w-[620px] bg-[radial-gradient(circle,rgb(var(--accent)/0.22),transparent_65%)]"
          style={{ '--duree': '16s' } as CSSProperties}
        />
        <div
          className="lp-tache -left-40 top-40 h-[480px] w-[480px] bg-[radial-gradient(circle,rgb(var(--chart-1)/0.14),transparent_65%)]"
          style={{ '--duree': '21s' } as CSSProperties}
        />
        <div
          className="lp-tache bottom-[-200px] left-1/3 h-[420px] w-[420px] bg-[radial-gradient(circle,rgb(var(--chart-3)/0.12),transparent_65%)]"
          style={{ '--duree': '25s' } as CSSProperties}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <span
            className="lp-entree inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-medium text-ink-soft shadow-subtle backdrop-blur"
            style={d(0)}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Pour les compagnies de transport interurbain
          </span>

          <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            <span className="block">
              {mots.map((mot, i) => (
                <span key={mot} className="mr-[0.25em] inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <span className="lp-mot" style={d(100 + i * 90)}>
                    {mot}
                  </span>
                </span>
              ))}
            </span>
            <span className="lp-entree block" style={d(420)}>
              <span className="lp-rotation">
                <span className="lp-rotation-liste lp-degrade">
                  <span>au guichet.</span>
                  <span>en ligne.</span>
                  <span>par Mobile Money.</span>
                  <span>partout.</span>
                  <span aria-hidden>au guichet.</span>
                </span>
              </span>
            </span>
          </h1>

          <p className="lp-entree mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg" style={d(560)}>
            Yègo réunit la vente au guichet, la réservation dans l’app, le paiement Wave &amp; Orange Money et le
            suivi GPS de vos départs dans un seul outil — pensé pour fonctionner même en 3G.
          </p>

          <div className="lp-entree mt-9 flex flex-col gap-3 sm:flex-row" style={d(680)}>
            <a
              href="#contact"
              className="lp-brillant group inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-medium text-white shadow-card transition-transform duration-300 hover:-translate-y-0.5"
            >
              Devenir partenaire
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link
              href={PATH_CONNEXION}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-surface/80 px-6 py-3.5 text-sm font-medium text-ink backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface"
            >
              Accéder à mon espace
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {['Billets QR infalsifiables', 'Wave & Orange Money', 'Suivi en temps réel'].map((t, i) => (
              <li key={t} className="lp-entree flex items-center gap-1.5" style={d(820 + i * 90)}>
                <CheckCircle2 className="h-4 w-4 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <BilletInteractif />
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Fonctionnalités */

function Carte({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`lp-projecteur relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 ${className}`}>
      {children}
    </div>
  );
}

function EnTeteCarte({ icon: Icone, titre, texte }: { icon: LucideIcon; titre: string; texte: string }) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
        <Icone className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{titre}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{texte}</p>
    </div>
  );
}

function Fonctionnalites() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <TitreSection
          surtitre="Fonctionnalités"
          titre="Tout ce qu’il faut pour gérer vos départs"
          texte="Du guichet à l’embarquement, chaque étape du voyage passe par Yègo."
        />

        <GrilleProjecteur className="mt-14 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Revele className="group lg:col-span-2">
              <Carte className="grid items-center gap-6 sm:grid-cols-[1fr_1.1fr]">
                <EnTeteCarte
                  icon={Store}
                  titre="Vente au guichet"
                  texte="Choix du départ, plan des sièges mis à jour en direct et billet imprimé en quelques secondes. Un siège vendu en ligne disparaît aussitôt du guichet."
                />
                <PlanSieges />
              </Carte>
            </Revele>
            <Revele className="group" delai={120}>
              <Carte className="flex flex-col justify-between gap-6">
                <EnTeteCarte
                  icon={MapPin}
                  titre="Suivi GPS des départs"
                  texte="Position du car en temps réel et retards signalés aux passagers."
                />
                <CarteGps />
              </Carte>
            </Revele>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Revele className="group" delai={60}>
              <Carte className="flex flex-col justify-between gap-6">
                <EnTeteCarte
                  icon={Wallet}
                  titre="Mobile Money"
                  texte="Wave et Orange Money encaissés automatiquement, ventes guichet comprises."
                />
                <NotificationsPaiement />
              </Carte>
            </Revele>
            <Revele className="group lg:col-span-2" delai={180}>
              <Carte className="grid items-center gap-6 sm:grid-cols-[1fr_1.2fr]">
                <EnTeteCarte
                  icon={Gauge}
                  titre="Tableau de bord"
                  texte="Ventes, taux de remplissage et trajets les plus rentables sur 30 jours. Exportez vos réservations en CSV en un clic."
                />
                <MiniGraphique />
              </Carte>
            </Revele>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PETITES_FONCTIONNALITES.map((f, i) => (
              <Revele key={f.titre} className="group" delai={i * 90}>
                <Carte>
                  <EnTeteCarte {...f} />
                  {f.icon === ScanLine && (
                    <div className="absolute -bottom-6 -right-6 rotate-12 opacity-20 transition-all duration-700 group-hover:rotate-0 group-hover:opacity-60">
                      <MotifQr taille={6} scan />
                    </div>
                  )}
                </Carte>
              </Revele>
            ))}
          </div>
        </GrilleProjecteur>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Comment ça marche */

function Fonctionnement() {
  return (
    <section id="fonctionnement" className="scroll-mt-20 border-t border-line-soft bg-surface py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <TitreSection
            aligne="gauche"
            surtitre="Comment ça marche"
            titre="De l’inscription au premier départ"
            texte="Pas de matériel à acheter : un ordinateur ou un téléphone suffit au guichet. Nous vous accompagnons à chaque étape."
          />
          <Revele delai={200} className="mt-8">
            <a
              href={LIEN_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-medium text-accent-ink"
            >
              Parler à l’équipe Yègo
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Revele>
        </div>
        <Parcours etapes={ETAPES} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Voyageurs */

function Voyageurs() {
  return (
    <section id="voyageurs" className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <TitreSection
            aligne="gauche"
            surtitre="Côté voyageurs"
            titre="Une expérience qui fait revenir vos passagers"
            texte="Avec l’application mobile Yègo, vos clients réservent, paient et embarquent sans file d’attente — et vos cars partent plus remplis."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {CONFIANCE.map(({ icon: Icone, titre, texte }, i) => (
              <Revele key={titre} delai={i * 90} variante="gauche">
                <div className="group flex h-full gap-3 rounded-2xl border border-line bg-surface p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-card">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink transition-transform duration-500 group-hover:scale-110">
                    <Icone className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{titre}</h3>
                    <p className="mt-0.5 text-sm text-ink-soft">{texte}</p>
                  </div>
                </div>
              </Revele>
            ))}
          </div>
        </div>
        <Revele variante="zoom" delai={150}>
          <TelephoneDemo />
        </Revele>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Contact */

function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Revele variante="zoom">
          <div className="lp-aurore relative overflow-hidden rounded-[2rem] bg-accent px-6 py-16 text-center text-white shadow-pop sm:px-12 lg:py-20">
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Devenir partenaire</p>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Prêt à digitaliser votre compagnie ?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
                Écrivez-nous sur WhatsApp : nous vous présentons Yègo et préparons votre espace compagnie.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={LIEN_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-brillant group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-base font-semibold text-[#b5610f] shadow-card transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                >
                  <MessageCircle className="relative h-5 w-5 text-[#25D366]" />
                  <span className="relative">Discuter sur WhatsApp</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <Link
                  href={PATH_CONNEXION}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-7 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  J’ai déjà un compte
                </Link>
              </div>
              <p className="mt-6 text-sm tabular-nums text-white/75">
                ou appelez le{' '}
                <a href={LIEN_APPEL} className="font-medium text-white underline-offset-4 hover:underline">
                  {TELEPHONE_AFFICHE}
                </a>
              </p>
            </div>
          </div>
        </Revele>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */

function QuestionsFrequentes() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line-soft py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <TitreSection
            aligne="gauche"
            surtitre="Questions fréquentes"
            titre="Vous vous posez des questions ?"
            texte="Les réponses aux questions que nous posent le plus souvent les compagnies."
          />
          <Revele delai={200} className="mt-8">
            <a
              href={LIEN_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Une autre question ? Écrivez-nous
            </a>
          </Revele>
        </div>
        <Revele delai={120}>
          <Faq questions={QUESTIONS} />
        </Revele>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Commun */

function TitreSection({
  surtitre,
  titre,
  texte,
  aligne = 'centre',
}: {
  surtitre: string;
  titre: string;
  texte: string;
  aligne?: 'centre' | 'gauche';
}) {
  return (
    <div className={aligne === 'centre' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <Revele>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">{surtitre}</p>
      </Revele>
      <Revele delai={80}>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">{titre}</h2>
      </Revele>
      <Revele delai={160}>
        <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">{texte}</p>
      </Revele>
    </div>
  );
}
