'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Minus, Plus, Printer, RefreshCw } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import TicketQr, { imprimerTickets, type TicketImpression } from '@/components/ui/TicketQr';
import SeatMap from '@/components/ui/SeatMap';
import { FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import { departsApi, dateHeureDepart, estVendable, FILTRES_DEPARTS_DEFAUT } from '@/features/departs';
import type { Depart, SiegesDepart } from '@/features/departs';
import { reservationsApi } from '@/features/reservations';
import type { Reservation } from '@/features/reservations';
import { paiementsApi, MOYENS_PAIEMENT_GUICHET } from '@/features/paiements';
import type { MoyenPaiementGuichet } from '@/features/paiements';
import { ticketsApi } from '@/features/tickets';
import type { Ticket } from '@/features/tickets';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatDate, formatFcfa, formatHeure } from '@/lib/format';
import { jourIso } from '@/lib/filtres';
import { chiffresTelephone, estTelephoneValide, telephonePourApi } from '@/lib/telephone';

// Pas de websocket côté API : on rafraîchit par polling léger.
const POLL_DEPARTS = 20_000;
const POLL_SIEGES = 8_000;
// Plafond par vente au comptoir (l'API limite aussi les sièges à 10 par réservation).
const MAX_PLACES = 10;

type Jour = 'tous' | 'aujourdhui' | 'demain';
type ModeSieges = 'libre' | 'choix';

type Vente = {
  reservation: Reservation;
  paye: boolean;
  avertissement: string | null;
  tickets: Ticket[];
  erreurTickets: string | null;
  generation: boolean;
};

function libelleJour(jour: string): string {
  if (jour === jourIso(0)) return 'Aujourd’hui';
  if (jour === jourIso(1)) return 'Demain';
  return new Date(`${jour}T00:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function libelleTrajetDepart(d: Pick<Depart, 'trajet'>): string {
  return `${d.trajet.villeDepart.nom} → ${d.trajet.villeArrivee.nom}`;
}

function Etape({ n, titre, children, droite }: { n: number; titre: string; children: React.ReactNode; droite?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">
            {n}
          </span>
          {titre}
        </h2>
        {droite}
      </div>
      {children}
    </Card>
  );
}

export default function GuichetPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const compagnieId = user?.compagnieId ?? null;

  // --- Étape 1 : départ
  const [departs, setDeparts] = useState<Depart[]>([]);
  const [chargement, setChargement] = useState(true);
  const [majDeparts, setMajDeparts] = useState(false);
  const [jour, setJour] = useState<Jour>('tous');
  const [trajetFiltre, setTrajetFiltre] = useState('');
  const [departId, setDepartId] = useState<number | null>(null);
  const [avisDepart, setAvisDepart] = useState<string | null>(null);

  // --- Étape 2 : places
  const [sieges, setSieges] = useState<SiegesDepart | null>(null);
  const [mode, setMode] = useState<ModeSieges>('libre');
  const [nbLibre, setNbLibre] = useState(1);
  const [selection, setSelection] = useState<string[]>([]);
  const [avisSieges, setAvisSieges] = useState<string | null>(null);

  // --- Étape 3 : passager & paiement
  const [passagerNom, setPassagerNom] = useState('');
  const [passagerTel, setPassagerTel] = useState('');
  const [moyen, setMoyen] = useState<MoyenPaiementGuichet>('espece');
  const [paiementRecu, setPaiementRecu] = useState(false);

  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [vente, setVente] = useState<Vente | null>(null);

  const departIdRef = useRef(departId);
  departIdRef.current = departId;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const chargerDeparts = useCallback(
    async (silencieux = false) => {
      if (!compagnieId) return;
      if (silencieux) setMajDeparts(true);
      try {
        const tous = await departsApi.tousParCompagnie(compagnieId, {
          ...FILTRES_DEPARTS_DEFAUT,
          statut: 'planifie',
        });
        const maintenant = new Date();
        setDeparts(
          tous
            .filter((d) => estVendable(d, maintenant))
            .sort((a, b) => dateHeureDepart(a).getTime() - dateHeureDepart(b).getTime()),
        );
      } catch {
        if (!silencieux) setDeparts([]);
      } finally {
        setMajDeparts(false);
      }
    },
    [compagnieId],
  );

  const chargerSieges = useCallback(async (id: number | null) => {
    if (!id) {
      setSieges(null);
      return;
    }
    try {
      const s = await departsApi.sieges(id);
      if (departIdRef.current !== id) return; // réponse d'un départ quitté entre-temps
      setSieges(s);
      // Un siège choisi a pu être vendu ailleurs (en ligne, autre guichet).
      const occupes = new Set(s.occupes);
      const perdus = selectionRef.current.filter((x) => occupes.has(x));
      if (perdus.length > 0) {
        const pl = perdus.length > 1 ? 's' : '';
        setAvisSieges(`Siège${pl} ${perdus.join(', ')} vendu${pl} entre-temps — retiré${pl} de la sélection.`);
        setSelection((sel) => sel.filter((x) => !occupes.has(x)));
      }
    } catch {
      if (departIdRef.current === id) setSieges(null);
    }
  }, []);

  useEffect(() => {
    if (!ready || !compagnieId) return;
    setChargement(true);
    chargerDeparts().finally(() => setChargement(false));
    const t = setInterval(() => chargerDeparts(true), POLL_DEPARTS);
    return () => clearInterval(t);
  }, [ready, compagnieId, chargerDeparts]);

  useEffect(() => {
    setSelection([]);
    setAvisSieges(null);
    setSieges(null);
    chargerSieges(departId);
    if (!departId) return;
    const t = setInterval(() => chargerSieges(departIdRef.current), POLL_SIEGES);
    return () => clearInterval(t);
  }, [departId, chargerSieges]);

  // Le départ choisi n'est plus vendable (complet, parti, annulé) : on le libère.
  useEffect(() => {
    if (departId && !chargement && !departs.some((d) => d.id === departId) && !vente) {
      setDepartId(null);
      setAvisDepart('Le départ sélectionné n’est plus vendable (complet, parti ou annulé).');
    }
  }, [departs, departId, chargement, vente]);

  const departVendable = departs.find((d) => d.id === departId) ?? null;
  const placesDispo = sieges?.placesDisponibles ?? departVendable?.placesDisponibles ?? 0;
  const maxPlaces = Math.min(placesDispo, MAX_PLACES);
  const nb = mode === 'choix' ? selection.length : Math.min(nbLibre, Math.max(maxPlaces, 1));
  const prixUnitaire = departVendable ? Number(departVendable.trajet.prix) : 0;
  const total = prixUnitaire * nb;
  const libelleMoyen = MOYENS_PAIEMENT_GUICHET.find((m) => m.valeur === moyen)?.label ?? moyen;
  const mobile = moyen !== 'espece';

  const trajetsProposes = useMemo(() => {
    const m = new Map<string, string>();
    departs.forEach((d) => m.set(String(d.trajetId), libelleTrajetDepart(d)));
    return [...m.entries()].map(([valeur, label]) => ({ valeur, label })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [departs]);

  const groupes = useMemo(() => {
    const filtres = departs.filter((d) => {
      const j = d.dateDepart.slice(0, 10);
      if (jour === 'aujourdhui' && j !== jourIso(0)) return false;
      if (jour === 'demain' && j !== jourIso(1)) return false;
      if (trajetFiltre && String(d.trajetId) !== trajetFiltre) return false;
      return true;
    });
    const parJour = new Map<string, Depart[]>();
    filtres.forEach((d) => {
      const j = d.dateDepart.slice(0, 10);
      parJour.set(j, [...(parJour.get(j) ?? []), d]);
    });
    return [...parJour.entries()];
  }, [departs, jour, trajetFiltre]);

  const problemes: string[] = [];
  if (!departVendable) problemes.push('Choisissez un départ.');
  if (departVendable && nb < 1) problemes.push(mode === 'choix' ? 'Sélectionnez au moins un siège.' : 'Indiquez le nombre de places.');
  if (departVendable && nb > placesDispo) problemes.push('Plus assez de places disponibles.');
  if (passagerNom.trim().length < 2) problemes.push('Saisissez le nom du passager.');
  if (passagerTel && !estTelephoneValide(passagerTel)) problemes.push('Le téléphone doit comporter 10 chiffres.');
  if (mobile && !paiementRecu) problemes.push(`Confirmez la réception du paiement ${libelleMoyen}.`);

  function choisirDepart(id: number) {
    setAvisDepart(null);
    setErreur(null);
    setDepartId(id);
  }

  function changerMode(m: ModeSieges) {
    setMode(m);
    if (m === 'libre') setNbLibre(Math.max(1, selection.length || nbLibre));
    else setSelection([]);
  }

  function nouvelleVente() {
    setVente(null);
    setPassagerNom('');
    setPassagerTel('');
    setMoyen('espece');
    setPaiementRecu(false);
    setNbLibre(1);
    setSelection([]);
    setErreur(null);
  }

  // Données du billet imprimé (même présentation que l'app mobile).
  function infosImpression(r: Reservation, t: Ticket, index: number, total: number): TicketImpression {
    const trajet = r.depart?.trajet;
    return {
      codeQr: t.codeQr,
      siege: t.siege,
      statut: t.statut,
      passager: r.passagerNom,
      villeDepart: trajet?.villeDepart?.nom,
      villeArrivee: trajet?.villeArrivee?.nom,
      heure: trajet ? formatHeure(trajet.heureDepart) : undefined,
      date: r.depart ? formatDate(r.depart.dateDepart) : undefined,
      compagnie: trajet?.compagnie?.nom,
      logoUrl: trajet?.compagnie?.logoUrl,
      prix: trajet?.prix,
      reservationId: r.id,
      numero: index + 1,
      total,
    };
  }

  // Émet les tickets manquants (reprend ceux déjà émis : jamais plus de
  // billets valides que de places, même après une tentative interrompue).
  async function genererTickets(reservation: Reservation) {
    setVente((v) => (v ? { ...v, generation: true, erreurTickets: null } : v));
    const tous: Ticket[] = [];
    try {
      const existants = (await ticketsApi.listPourReservation(reservation.id)).filter((t) => t.statut !== 'annule');
      tous.push(...existants);
      const pris = new Set(existants.map((t) => t.siege).filter(Boolean));
      const restants = (reservation.sieges ?? []).filter((x) => !pris.has(x));
      for (let i = existants.length; i < reservation.nombrePlaces; i++) {
        tous.push(await ticketsApi.genererPourReservation(reservation.id, restants.shift()));
      }
      setVente((v) => (v ? { ...v, tickets: tous, generation: false } : v));
    } catch (err) {
      setVente((v) =>
        v
          ? {
              ...v,
              tickets: tous,
              generation: false,
              erreurTickets: err instanceof Error ? err.message : 'Erreur lors de la génération des tickets',
            }
          : v,
      );
    }
  }

  async function handleVendre() {
    if (!departVendable || problemes.length > 0) return;
    setErreur(null);
    setEnvoi(true);

    let reservation: Reservation;
    try {
      reservation = await reservationsApi.creerGuichet({
        departId: departVendable.id,
        nombrePlaces: nb,
        passager: {
          nom: passagerNom.trim(),
          telephone: passagerTel ? telephonePourApi(passagerTel) : undefined,
        },
        sieges: mode === 'choix' ? selection : undefined,
        paiementEspece: !mobile,
      });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la vente');
      chargerSieges(departVendable.id); // resync en cas de collision de sièges (409)
      setEnvoi(false);
      return;
    }

    // À partir d'ici la réservation EXISTE : un échec d'encaissement ne doit
    // pas laisser croire que la vente a échoué (sinon l'agent revend les places).
    let aJour = reservation;
    let avertissement: string | null = null;
    if (mobile) {
      try {
        await paiementsApi.encaisserGuichet(reservation.id, moyen);
        aJour = await reservationsApi.get(reservation.id);
      } catch (err) {
        avertissement = `L’encaissement ${libelleMoyen} a échoué (${
          err instanceof Error ? err.message : 'erreur inconnue'
        }). La réservation est bloquée 30 min : encaissez-la depuis Réservations, sans revendre les places.`;
      }
    }
    const paye = aJour.paiement?.statut === 'paye';
    setVente({ reservation: aJour, paye, avertissement, tickets: [], erreurTickets: null, generation: false });
    setEnvoi(false);
    chargerDeparts(true);
    chargerSieges(departVendable.id);
    if (paye) genererTickets(aJour);
  }

  if (!ready) return null;

  const r = vente?.reservation;
  const impressions = r && vente ? vente.tickets.map((t, i, tous) => infosImpression(r, t, i, tous.length)) : [];

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Vente au guichet"
        subtitle="Choisissez un départ, les places et le passager, puis encaissez. Les places se synchronisent avec les ventes en ligne."
        right={
          <button onClick={() => chargerDeparts(true)} className="flex items-center gap-1.5 hover:text-ink" disabled={majDeparts}>
            <RefreshCw className={`h-3.5 w-3.5 ${majDeparts ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Actualiser
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* 1. Départ */}
          <Etape
            n={1}
            titre="Départ"
            droite={<span className="text-xs text-ink-faint">{departs.length} départ{departs.length > 1 ? 's' : ''} en vente</span>}
          >
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <FiltreSegments
                value={jour}
                onChange={setJour}
                options={[
                  { valeur: 'tous', label: 'Tous' },
                  { valeur: 'aujourdhui', label: 'Aujourd’hui' },
                  { valeur: 'demain', label: 'Demain' },
                ]}
              />
              {trajetsProposes.length > 1 && (
                <FiltreSelect value={trajetFiltre} onChange={setTrajetFiltre} options={trajetsProposes} tous="Tous les trajets" />
              )}
            </div>
            {avisDepart && <p className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">{avisDepart}</p>}

            {chargement ? (
              <p className="py-8 text-center text-sm text-ink-faint">Chargement des départs…</p>
            ) : groupes.length === 0 ? (
              <p className="rounded-xl bg-surface-2 py-8 text-center text-sm text-ink-faint">
                {departs.length === 0
                  ? 'Aucun départ en vente : places épuisées ou aucun départ planifié à venir.'
                  : 'Aucun départ pour ce filtre.'}
              </p>
            ) : (
              <div className="max-h-[22rem] space-y-4 overflow-y-auto pr-1">
                {groupes.map(([j, liste]) => (
                  <div key={j}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint first-letter:uppercase">
                      {libelleJour(j)}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {liste.map((d) => {
                        const actif = d.id === departId;
                        const peu = d.placesDisponibles <= 5;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => choisirDepart(d.id)}
                            aria-pressed={actif}
                            disabled={!!vente}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                              actif ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/60'
                            }`}
                          >
                            <span className="text-base font-semibold tabular-nums text-ink">{formatHeure(d.trajet.heureDepart)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">{libelleTrajetDepart(d)}</span>
                              <span className="block text-xs text-ink-faint">{formatFcfa(d.trajet.prix)}</span>
                            </span>
                            <Badge tone={peu ? 'warning' : 'success'}>
                              {d.placesDisponibles} pl.
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Etape>

          {/* 2. Places */}
          <Etape
            n={2}
            titre="Places"
            droite={
              departVendable && (
                <span className="text-xs text-ink-faint">
                  <span className="font-semibold text-ink">{placesDispo}</span> libre{placesDispo > 1 ? 's' : ''}
                  {sieges ? ` / ${sieges.placesTotales}` : ''}
                </span>
              )
            }
          >
            {!departVendable ? (
              <p className="py-4 text-center text-sm text-ink-faint">Choisissez d’abord un départ.</p>
            ) : (
              <>
                <FiltreSegments
                  value={mode}
                  onChange={changerMode}
                  options={[
                    { valeur: 'libre', label: 'Placement libre' },
                    { valeur: 'choix', label: 'Choisir les sièges' },
                  ]}
                />
                {mode === 'libre' ? (
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      className="!px-2.5"
                      onClick={() => setNbLibre((n) => Math.max(1, n - 1))}
                      disabled={nb <= 1}
                      aria-label="Une place de moins"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2} />
                    </Button>
                    <span className="w-10 text-center text-xl font-semibold tabular-nums text-ink">{nb}</span>
                    <Button
                      variant="secondary"
                      className="!px-2.5"
                      onClick={() => setNbLibre((n) => Math.min(maxPlaces, n + 1))}
                      disabled={nb >= maxPlaces}
                      aria-label="Une place de plus"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                    </Button>
                    <span className="text-xs text-ink-faint">
                      place{nb > 1 ? 's' : ''} — sièges attribués automatiquement (max {maxPlaces})
                    </span>
                  </div>
                ) : !sieges ? (
                  <p className="py-6 text-center text-sm text-ink-faint">Chargement du plan…</p>
                ) : (
                  <div className="mt-4">
                    {(() => {
                      const sansSiege =
                        sieges.placesSansSiege ??
                        Math.max(0, sieges.placesTotales - sieges.placesDisponibles - sieges.occupes.length);
                      return sansSiege > 0 ? (
                        <p className="mb-3 rounded-lg bg-warning-soft px-2.5 py-1.5 text-xs text-warning">
                          {sansSiege} place{sansSiege > 1 ? 's' : ''} vendue{sansSiege > 1 ? 's' : ''} sans siège attribué : le
                          plan peut montrer plus de sièges libres qu’il n’en reste ({placesDispo}).
                        </p>
                      ) : null;
                    })()}
                    {avisSieges && <p className="mb-3 rounded-lg bg-warning-soft px-2.5 py-1.5 text-xs text-warning">{avisSieges}</p>}
                    <SeatMap
                      placesTotales={sieges.placesTotales}
                      occupes={sieges.occupes}
                      selection={selection}
                      max={Math.max(1, maxPlaces)}
                      onChange={(s) => {
                        setAvisSieges(null);
                        setSelection(s);
                      }}
                    />
                    <p className="mt-2 text-xs text-ink-faint">
                      {selection.length} siège{selection.length > 1 ? 's' : ''} sélectionné{selection.length > 1 ? 's' : ''} (max {maxPlaces}).
                    </p>
                  </div>
                )}
              </>
            )}
          </Etape>

          {/* 3. Passager & paiement */}
          <Etape n={3} titre="Passager et paiement">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom du passager">
                <Input type="text" value={passagerNom} onChange={(e) => setPassagerNom(e.target.value)} maxLength={120} disabled={!!vente} />
              </Field>
              <Field label="Téléphone (optionnel, 10 chiffres)">
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0701020304"
                  value={passagerTel}
                  onChange={(e) => setPassagerTel(chiffresTelephone(e.target.value))}
                  disabled={!!vente}
                />
              </Field>
            </div>
            <div className="mt-4">
              <FiltreSegments
                label="Moyen de paiement"
                value={moyen}
                onChange={(m) => {
                  setMoyen(m);
                  setPaiementRecu(false);
                }}
                options={MOYENS_PAIEMENT_GUICHET}
              />
            </div>
            {mobile && (
              <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={paiementRecu}
                  onChange={(e) => setPaiementRecu(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]"
                  disabled={!!vente}
                />
                <span>
                  J’ai vérifié la réception de <strong>{formatFcfa(total)}</strong> par {libelleMoyen} sur le compte de la
                  compagnie. <span className="text-ink-soft">La vente sera enregistrée comme payée, sous mon nom.</span>
                </span>
              </label>
            )}
          </Etape>
        </div>

        {/* Récapitulatif / résultat */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {!vente ? (
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink">Récapitulatif</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Trajet</dt>
                  <dd className="text-right font-medium text-ink">{departVendable ? libelleTrajetDepart(departVendable) : '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Départ</dt>
                  <dd className="text-right text-ink">
                    {departVendable
                      ? `${libelleJour(departVendable.dateDepart.slice(0, 10))} à ${formatHeure(departVendable.trajet.heureDepart)}`
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Places</dt>
                  <dd className="text-right text-ink">
                    {departVendable ? nb : '—'}
                    {mode === 'choix' && selection.length > 0 && (
                      <span className="block text-xs text-ink-faint">sièges {[...selection].sort((a, b) => Number(a) - Number(b)).join(', ')}</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Passager</dt>
                  <dd className="truncate text-right text-ink">{passagerNom.trim() || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Paiement</dt>
                  <dd className="text-right text-ink">{libelleMoyen}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-4">
                <span className="text-sm text-ink-soft">Total</span>
                <span className="text-2xl font-semibold tabular-nums text-ink">{formatFcfa(total)}</span>
              </div>
              {departVendable && nb > 0 && (
                <p className="mt-0.5 text-right text-xs text-ink-faint">
                  {nb} × {formatFcfa(prixUnitaire)}
                </p>
              )}

              {erreur && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{erreur}</p>}
              {problemes.length > 0 && (departVendable || passagerNom) && (
                <ul className="mt-4 space-y-1 text-xs text-ink-faint">
                  {problemes.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              )}
              <Button onClick={handleVendre} disabled={envoi || problemes.length > 0} className="mt-4 w-full">
                {envoi ? 'Vente en cours…' : mobile ? `Valider la vente (${libelleMoyen})` : 'Encaisser en espèces et valider'}
              </Button>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-start gap-2.5">
                {vente.paye ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={1.75} />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={1.75} />
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">
                    Réservation #{r!.id} {vente.paye ? 'payée' : 'créée — non payée'}
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    {r!.passagerNom} · {r!.nombrePlaces} place{r!.nombrePlaces > 1 ? 's' : ''}
                    {r!.sieges?.length ? ` (sièges ${r!.sieges.join(', ')})` : ''}
                    {vente.paye && r!.paiement ? ` · ${formatFcfa(r!.paiement.montant)}` : ''}
                  </p>
                </div>
              </div>

              {vente.avertissement && (
                <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                  {vente.avertissement}{' '}
                  <Link href="/compagnie/reservations" className="font-medium underline">
                    Ouvrir Réservations
                  </Link>
                </p>
              )}

              {vente.paye && (
                <div className="mt-4">
                  {vente.generation && <p className="text-xs text-ink-faint">Génération des tickets…</p>}
                  {vente.erreurTickets && (
                    <p className="mb-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{vente.erreurTickets}</p>
                  )}
                  {!vente.generation && vente.tickets.length < r!.nombrePlaces && (
                    <Button variant="secondary" onClick={() => genererTickets(r!)} className="mb-3 w-full">
                      Générer {r!.nombrePlaces - vente.tickets.length} ticket(s) manquant(s)
                    </Button>
                  )}
                  {vente.tickets.length > 0 && (
                    <>
                      <Button onClick={() => imprimerTickets(impressions)} className="mb-3 w-full">
                        <Printer className="h-4 w-4" strokeWidth={1.75} />
                        Imprimer {vente.tickets.length > 1 ? `les ${vente.tickets.length} tickets` : 'le ticket'}
                      </Button>
                      <div className="max-h-[26rem] space-y-2 overflow-y-auto">
                        {impressions.map((t) => (
                          <TicketQr key={t.codeQr} {...t} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button variant="secondary" onClick={nouvelleVente} className="mt-4 w-full">
                Nouvelle vente
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
