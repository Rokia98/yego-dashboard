'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadMore from '@/components/ui/LoadMore';
import Pagination from '@/components/ui/Pagination';
import Modal, { BoutonCreation, PiedModal } from '@/components/ui/Modal';
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

  async function handleAnnuler(id: number) {
    if (!confirm('Annuler ce départ ?')) return;
    setEnCours(id);
    try {
      await departsApi.updateStatut(id, 'annule');
      liste.recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setEnCours(null);
    }
  }

  async function handleDemarrer(id: number) {
    if (!confirm('Démarrer ce départ ? Le suivi GPS devient actif et les voyageurs sont notifiés.')) return;
    setEnCours(id);
    try {
      await suiviApi.demarrer(id);
      liste.recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du démarrage');
    } finally {
      setEnCours(null);
    }
  }

  async function handleRetard(id: number) {
    const saisie = prompt('Retard estimé en minutes ?');
    if (!saisie) return;
    const minutes = Number(saisie);
    if (!Number.isInteger(minutes) || minutes < 1) {
      alert('Indiquez un nombre entier de minutes (1 ou plus).');
      return;
    }
    const motif = prompt('Motif (optionnel) ?') || undefined;
    setEnCours(id);
    try {
      await suiviApi.signalerRetard(id, minutes, motif);
      liste.recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du signalement');
    } finally {
      setEnCours(null);
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
        <Modal ouvert={formulaireOuvert} titre="Planifier un départ" onFermer={envoi ? undefined : fermerFormulaire}>
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

            {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

            <PiedModal envoi={envoi} libelle="Planifier le départ" onAnnuler={fermerFormulaire} />
          </form>
        </Modal>
      )}

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
              <Th>Places</Th>
              <Th>Statut</Th>
              <Th>Action</Th>
            </THead>
            <tbody>
              {liste.pageItems.map((d) => (
                <Tr key={d.id}>
                  <Td strong>{d.trajet.villeDepart.nom} → {d.trajet.villeArrivee.nom}</Td>
                  <Td>{formatDate(d.dateDepart)}</Td>
                  <Td>{formatHeure(d.trajet.heureDepart)}</Td>
                  <Td className="tabular-nums">{d.placesDisponibles} / {d.placesTotales}</Td>
                  <Td>
                    <Badge tone={BADGE_TONE[d.statut] || 'neutral'}>{d.statut.replace('_', ' ')}</Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-3">
                      {d.statut === 'planifie' && (
                        <Button variant="link-success" onClick={() => handleDemarrer(d.id)} disabled={enCours === d.id}>
                          Démarrer
                        </Button>
                      )}
                      {(d.statut === 'planifie' || d.statut === 'en_route') && (
                        <Button variant="link" onClick={() => handleRetard(d.id)} disabled={enCours === d.id}>
                          Retard
                        </Button>
                      )}
                      {d.statut === 'en_route' && (
                        <Link
                          href={`/compagnie/departs/${d.id}/suivi`}
                          className="flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
                        >
                          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> Suivi
                        </Link>
                      )}
                      {gestionnaire && d.statut !== 'annule' && d.statut !== 'arrive' && (
                        <Button variant="link-danger" onClick={() => handleAnnuler(d.id)} disabled={enCours === d.id}>
                          Annuler
                        </Button>
                      )}
                    </div>
                  </Td>
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
