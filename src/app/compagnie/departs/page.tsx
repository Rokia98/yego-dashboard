'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, Clock, MapPin, Play, XCircle } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { Field, Input, Select } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import LoadMore from '@/components/ui/LoadMore';
import Pagination from '@/components/ui/Pagination';
import Modal, { BoutonCreation, ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
import {
  departsApi,
  FILTRES_DEPARTS_DEFAUT,
  OPTIONS_QUAND,
  OPTIONS_STATUT_DEPART,
  correspondDepart,
} from '@/features/departs';
import type { Depart, FiltresDeparts } from '@/features/departs';
import { FiltresBar, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import { useFiltres } from '@/lib/filtres';
import { FILTRES_DEPARTS_SERVEUR } from '@/lib/capacites';
import { usePagedList } from '@/lib/pagination';
import { trajetsApi } from '@/features/trajets';
import type { Trajet } from '@/features/trajets';
import { vehiculesApi, chauffeursApi } from '@/features/flotte';
import type { Vehicule, Chauffeur } from '@/features/flotte';
import { suiviApi } from '@/features/suivi';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatDate, formatFcfa, formatHeure } from '@/lib/format';

const CHAMPS_VIDES = {
  trajetId: '',
  dateDepart: '',
  placesTotales: '',
  vehiculeId: '',
  chauffeurId: '',
};

const LIBELLE_STATUT: Record<string, string> = {
  planifie: 'Planifié',
  en_route: 'En route',
  arrive: 'Arrivé',
  annule: 'Annulé',
};

const BADGE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'accent' | 'neutral'> = {
  planifie: 'success',
  en_route: 'accent',
  arrive: 'neutral',
  annule: 'danger',
};

export default function DepartsPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  // Modale « signaler un retard ».
  const [retardPour, setRetardPour] = useState<Depart | null>(null);
  const [retard, setRetard] = useState({ minutes: '', motif: '' });
  const [erreurRetard, setErreurRetard] = useState<string | null>(null);
  const [envoiRetard, setEnvoiRetard] = useState(false);
  const compagnieId = user?.compagnieId ?? null;
  // depart:manage (planifier, modifier, annuler) : gestionnaire seulement depuis l'API 0.29.0 ;
  // les agents gardent depart:operer (démarrer, signaler un retard).
  const gestionnaire = user?.role === 'company_admin';

  const filtres = useFiltres<FiltresDeparts>(FILTRES_DEPARTS_DEFAUT);
  const appliques = filtres.appliques;
  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) =>
      compagnieId
        ? departsApi.listByCompagnie(compagnieId, { take, skip, filtres: appliques })
        : Promise.resolve([]),
    [compagnieId, appliques],
  );
  // L'API ne filtre pas encore et trie du plus ancien au plus récent : le
  // filtre local parcourt les pages jusqu'à trouver les départs voulus.
  const filtreLocal = useMemo(
    () => (FILTRES_DEPARTS_SERVEUR ? undefined : (d: Depart) => correspondDepart(d, appliques)),
    [appliques],
  );
  const liste = usePagedList<Depart>(
    fetcher,
    ready && compagnieId ? `${compagnieId}|${filtres.cle}` : 'wait',
    20,
    { filtreLocal, tailleSource: 100 },
  );

  useEffect(() => {
    if (!ready || !compagnieId) return;
    trajetsApi.listByCompagnie(compagnieId).then(setTrajets).catch(() => setTrajets([]));
    vehiculesApi.list().then(setVehicules).catch(() => setVehicules([]));
    chauffeursApi.list().then(setChauffeurs).catch(() => setChauffeurs([]));
  }, [ready, compagnieId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!compagnieId) return;
    setErreur(null);
    setEnvoi(true);
    try {
      await departsApi.create({
        trajetId: Number(champs.trajetId),
        dateDepart: champs.dateDepart,
        placesTotales: Number(champs.placesTotales),
        vehiculeId: champs.vehiculeId ? Number(champs.vehiculeId) : undefined,
        chauffeurId: champs.chauffeurId ? Number(champs.chauffeurId) : undefined,
      });
      setChamps(CHAMPS_VIDES);
      setFormulaireOuvert(false);
      liste.recharger();
      notifier.succes('Départ planifié.');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la création du départ');
    } finally {
      setEnvoi(false);
    }
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setErreur(null);
    setChamps(CHAMPS_VIDES);
  }

  const libelle = (d: Depart) => `${d.trajet.villeDepart.nom} → ${d.trajet.villeArrivee.nom} du ${formatDate(d.dateDepart)}`;

  async function handleAnnuler(d: Depart) {
    const ok = await confirmer({
      titre: 'Annuler ce départ ?',
      message: `${libelle(d)}\nLes voyageurs déjà réservés seront notifiés.`,
      libelleConfirmer: 'Annuler le départ',
      libelleAnnuler: 'Retour',
      ton: 'danger',
    });
    if (!ok) return;
    setEnCours(d.id);
    try {
      await departsApi.updateStatut(d.id, 'annule');
      liste.recharger();
      notifier.succes('Départ annulé.');
    } catch (err) {
      notifier.erreur(err, "Erreur lors de l'annulation");
    } finally {
      setEnCours(null);
    }
  }

  async function handleDemarrer(d: Depart) {
    const ok = await confirmer({
      titre: 'Démarrer ce départ ?',
      message: `${libelle(d)}\nLe suivi GPS devient actif et les voyageurs sont notifiés.`,
      libelleConfirmer: 'Démarrer',
      ton: 'success',
    });
    if (!ok) return;
    setEnCours(d.id);
    try {
      await suiviApi.demarrer(d.id);
      liste.recharger();
      notifier.succes('Départ démarré : bon voyage !');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors du démarrage');
    } finally {
      setEnCours(null);
    }
  }

  function ouvrirRetard(d: Depart) {
    setRetard({ minutes: '', motif: '' });
    setErreurRetard(null);
    setRetardPour(d);
  }

  async function handleRetard(e: React.FormEvent) {
    e.preventDefault();
    if (!retardPour) return;
    const minutes = Number(retard.minutes);
    if (!Number.isInteger(minutes) || minutes < 1) {
      setErreurRetard('Indiquez un nombre entier de minutes (1 ou plus).');
      return;
    }
    setEnvoiRetard(true);
    try {
      await suiviApi.signalerRetard(retardPour.id, minutes, retard.motif.trim() || undefined);
      setRetardPour(null);
      liste.recharger();
      notifier.succes(`Retard de ${minutes} min signalé aux voyageurs.`);
    } catch (err) {
      setErreurRetard(err instanceof Error ? err.message : 'Erreur lors du signalement');
    } finally {
      setEnvoiRetard(false);
    }
  }

  function onChoixVehicule(vehiculeId: string) {
    const v = vehicules.find((x) => x.id === Number(vehiculeId));
    setChamps((c) => ({
      ...c,
      vehiculeId,
      placesTotales: v?.capacite ? String(v.capacite) : c.placesTotales,
    }));
  }

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Départs"
        subtitle={
          gestionnaire
            ? 'Planifiez les occurrences datées de vos trajets et suivez-les en temps réel.'
            : 'Démarrez les départs, signalez les retards et suivez-les en temps réel.'
        }
      />

      {gestionnaire && <BoutonCreation label="Planifier un départ" onClick={() => setFormulaireOuvert(true)} />}

      {gestionnaire && (
        <Modal ouvert={formulaireOuvert} icone={CalendarClock} titre="Planifier un départ" onFermer={envoi ? undefined : fermerFormulaire}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Trajet">
                <Select required value={champs.trajetId} onChange={(e) => setChamps({ ...champs, trajetId: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {trajets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.villeDepart.nom} → {t.villeArrivee.nom} ({formatFcfa(t.prix)})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date de départ">
                <Input type="date" required value={champs.dateDepart} onChange={(e) => setChamps({ ...champs, dateDepart: e.target.value })} />
              </Field>
              <Field label="Véhicule (optionnel)">
                <Select value={champs.vehiculeId} onChange={(e) => onChoixVehicule(e.target.value)}>
                  <option value="">Aucun</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.immatriculation}{v.typeVehicule ? ` — ${v.typeVehicule}` : ''} ({v.capacite} pl.)
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Places totales">
                <Input
                  type="number"
                  min="1"
                  required
                  value={champs.placesTotales}
                  onChange={(e) => setChamps({ ...champs, placesTotales: e.target.value })}
                />
              </Field>
              <Field label="Chauffeur (optionnel)">
                <Select value={champs.chauffeurId} onChange={(e) => setChamps({ ...champs, chauffeurId: e.target.value })}>
                  <option value="">Aucun</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <ErreurFormulaire>{erreur}</ErreurFormulaire>

            <PiedModal envoi={envoi} libelle="Planifier le départ" onAnnuler={fermerFormulaire} />
          </form>
        </Modal>
      )}

      <Modal
        ouvert={retardPour != null}
        icone={Clock}
        titre="Signaler un retard"
        sousTitre={retardPour ? libelle(retardPour) : undefined}
        onFermer={envoiRetard ? undefined : () => setRetardPour(null)}
        largeur="max-w-md"
      >
        <form onSubmit={handleRetard}>
          <p className="mb-2 text-xs font-medium text-ink-soft">Retard estimé</p>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[10, 15, 30, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRetard((r) => ({ ...r, minutes: String(m) }))}
                className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                  retard.minutes === String(m)
                    ? 'border-warning bg-warning text-white shadow-subtle'
                    : 'border-line bg-surface text-ink-soft hover:border-warning/50 hover:text-warning'
                }`}
              >
                {m === 60 ? '1 h' : `${m} min`}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Minutes">
              <Input
                type="number"
                min="1"
                step="1"
                required
                value={retard.minutes}
                onChange={(e) => setRetard({ ...retard, minutes: e.target.value })}
              />
            </Field>
            <Field label="Motif (optionnel, visible des voyageurs)">
              <Input
                type="text"
                placeholder="Embouteillage, panne…"
                value={retard.motif}
                onChange={(e) => setRetard({ ...retard, motif: e.target.value })}
              />
            </Field>
          </div>
          <ErreurFormulaire>{erreurRetard}</ErreurFormulaire>
          <PiedModal envoi={envoiRetard} libelle="Signaler le retard" libelleEnvoi="Envoi…" onAnnuler={() => setRetardPour(null)} />
        </form>
      </Modal>

      <FiltresBar
        nbActifs={filtres.nbActifs}
        onReinitialiser={filtres.reinitialiser}
      >
        <FiltreSegments
          label="Quand"
          value={filtres.valeurs.quand}
          onChange={(v) => filtres.set('quand', v)}
          options={OPTIONS_QUAND}
        />
        <FiltreSelect
          label="Statut"
          value={filtres.valeurs.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={OPTIONS_STATUT_DEPART}
          className="w-full sm:w-40"
        />
        <FiltreSelect
          label="Trajet"
          value={filtres.valeurs.trajetId}
          onChange={(v) => filtres.set('trajetId', v)}
          options={trajets.map((t) => ({ valeur: String(t.id), label: `${t.villeDepart.nom} → ${t.villeArrivee.nom}` }))}
          tous="Tous les trajets"
          className="w-full sm:w-60"
        />
      </FiltresBar>

      <Card>
        <CardHeader
          title="Départs"
          right={`${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}${liste.aSuite ? '+' : ''}`}
        />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <>
            <TableMessage>
              {filtres.nbActifs > 0 ? 'Aucun départ ne correspond à ces filtres.' : 'Aucun départ à venir.'}
            </TableMessage>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={0} />
          </>
        ) : (
          <>
          <Table minWidth="900px">
            <THead>
              <Th>Trajet</Th>
              <Th>Date</Th>
              <Th>Heure</Th>
              <Th>Remplissage</Th>
              <Th>Statut</Th>
              <ThActions />
            </THead>
            <tbody>
              {liste.pageItems.map((d) => (
                <Tr key={d.id} attenue={d.statut === 'annule'}>
                  <Td strong>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      {d.trajet.villeDepart.nom}
                      <ArrowRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
                      {d.trajet.villeArrivee.nom}
                    </span>
                  </Td>
                  <Td>{formatDate(d.dateDepart)}</Td>
                  <Td>{formatHeure(d.trajet.heureDepart)}</Td>
                  <Td>
                    <Remplissage libres={d.placesDisponibles} total={d.placesTotales} />
                  </Td>
                  <Td>
                    <Badge tone={BADGE_TONE[d.statut] || 'neutral'}>{LIBELLE_STATUT[d.statut] ?? d.statut.replace('_', ' ')}</Badge>
                  </Td>
                  <TdActions>
                    <Actions>
                      {d.statut === 'planifie' && (
                        <ActionIcone
                          icone={Play}
                          label="Démarrer"
                          ton="success"
                          chargement={enCours === d.id}
                          onClick={() => handleDemarrer(d)}
                        />
                      )}
                      {d.statut === 'en_route' && (
                        <ActionIcone icone={MapPin} label="Suivi en direct" ton="info" href={`/compagnie/departs/${d.id}/suivi`} />
                      )}
                      {(d.statut === 'planifie' || d.statut === 'en_route') && (
                        <ActionIcone
                          icone={Clock}
                          label="Signaler un retard"
                          ton="warning"
                          disabled={enCours === d.id}
                          onClick={() => ouvrirRetard(d)}
                        />
                      )}
                      {gestionnaire && (
                        <MenuActions
                          disabled={enCours === d.id}
                          items={[
                            {
                              label: 'Annuler le départ',
                              icone: XCircle,
                              ton: 'danger',
                              onClick: () => handleAnnuler(d),
                              masque: d.statut === 'annule' || d.statut === 'arrive',
                            },
                          ]}
                        />
                      )}
                    </Actions>
                  </TdActions>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination pagination={liste.pagination} />
          </>
        )}
      </Card>
    </DashboardShell>
  );
}

/** Remplissage d'un départ : places vendues / total, avec une jauge colorée. */
function Remplissage({ libres, total }: { libres: number; total: number }) {
  const vendues = Math.max(0, total - libres);
  const taux = total > 0 ? vendues / total : 0;
  const couleur = taux >= 0.9 ? 'bg-danger' : taux >= 0.6 ? 'bg-warning' : 'bg-success';
  return (
    <div className="min-w-[110px]">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular-nums font-medium text-ink">
          {vendues}/{total}
        </span>
        <span className="tabular-nums text-ink-faint">{libres} libre{libres > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div className={`h-full rounded-full ${couleur} transition-all`} style={{ width: `${Math.round(taux * 100)}%` }} />
      </div>
    </div>
  );
}
