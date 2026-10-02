'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { trajetsApi } from '@/features/trajets';
import type { Trajet } from '@/features/trajets';
import { villesApi } from '@/features/villes';
import type { Ville } from '@/features/villes';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatFcfa, formatHeure } from '@/lib/format';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import { normaliser, useFiltres } from '@/lib/filtres';

type Filtres = { q: string; statut: '' | 'actif' | 'inactif' };
const FILTRES_DEFAUT: Filtres = { q: '', statut: '' };

const CHAMPS_VIDES = {
  villeDepartId: '',
  villeArriveeId: '',
  heureDepart: '',
  heureArriveeEstimee: '',
  prix: '',
  joursRecurrence: '',
};

export default function TrajetsPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const filtres = useFiltres<Filtres>(FILTRES_DEFAUT, 'q');

  const peutGerer = user?.role === 'company_admin';

  function chargerTrajets(compagnieId: number) {
    return trajetsApi.listByCompagnie(compagnieId).then(setTrajets).catch(() => setTrajets([]));
  }

  useEffect(() => {
    if (!ready || !user?.compagnieId) return;
    setChargement(true);
    Promise.all([
      chargerTrajets(user.compagnieId),
      villesApi.list().then(setVilles).catch(() => setVilles([])),
    ]).finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.compagnieId) return;
    setErreur(null);
    if (champs.villeDepartId === champs.villeArriveeId) {
      setErreur('Les villes de départ et d’arrivée doivent être différentes.');
      return;
    }
    setEnvoi(true);
    try {
      await trajetsApi.create({
        compagnieId: user.compagnieId,
        villeDepartId: Number(champs.villeDepartId),
        villeArriveeId: Number(champs.villeArriveeId),
        heureDepart: champs.heureDepart,
        heureArriveeEstimee: champs.heureArriveeEstimee || undefined,
        prix: Number(champs.prix),
        joursRecurrence: champs.joursRecurrence || undefined,
      });
      setChamps(CHAMPS_VIDES);
      await chargerTrajets(user.compagnieId);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la création du trajet');
    } finally {
      setEnvoi(false);
    }
  }

  async function handleToggleStatut(t: Trajet) {
    if (!user?.compagnieId) return;
    const cible = t.statut === 'actif' ? 'inactif' : 'actif';
    setEnCours(t.id);
    try {
      await trajetsApi.update(t.id, { statut: cible });
      await chargerTrajets(user.compagnieId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  async function handleSupprimer(t: Trajet) {
    if (!user?.compagnieId) return;
    if (!confirm('Supprimer ce trajet ? Impossible s’il a déjà des départs planifiés.')) return;
    setEnCours(t.id);
    try {
      await trajetsApi.remove(t.id);
      await chargerTrajets(user.compagnieId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const fa = filtres.appliques;
  const trajetsFiltres = trajets.filter(
    (t) =>
      (!fa.statut || t.statut === fa.statut) &&
      (!fa.q.trim() || normaliser(`${t.villeDepart.nom} ${t.villeArrivee.nom}`).includes(normaliser(fa.q))),
  );

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader eyebrow="Espace opérateur" title="Trajets" subtitle="Les itinéraires que votre compagnie propose à la vente." />

      {peutGerer && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Créer un trajet</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Ville de départ">
                <Select required value={champs.villeDepartId} onChange={(e) => setChamps({ ...champs, villeDepartId: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Ville d'arrivée">
                <Select required value={champs.villeArriveeId} onChange={(e) => setChamps({ ...champs, villeArriveeId: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Prix (FCFA)">
                <Input type="number" min="0" required value={champs.prix} onChange={(e) => setChamps({ ...champs, prix: e.target.value })} />
              </Field>
              <Field label="Heure de départ">
                <Input type="time" required value={champs.heureDepart} onChange={(e) => setChamps({ ...champs, heureDepart: e.target.value })} />
              </Field>
              <Field label="Heure d'arrivée estimée">
                <Input type="time" value={champs.heureArriveeEstimee} onChange={(e) => setChamps({ ...champs, heureArriveeEstimee: e.target.value })} />
              </Field>
              <Field label="Jours de récurrence">
                <Input
                  type="text"
                  placeholder="lun,mar,mer,jeu,ven"
                  value={champs.joursRecurrence}
                  onChange={(e) => setChamps({ ...champs, joursRecurrence: e.target.value })}
                />
              </Field>
            </div>

            {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

            <Button type="submit" disabled={envoi} className="mt-4">
              {envoi ? 'Création...' : 'Créer le trajet'}
            </Button>
          </form>
        </Card>
      )}

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreRecherche
          label="Recherche"
          value={filtres.valeurs.q}
          onChange={(v) => filtres.set('q', v)}
          placeholder="Ville de départ ou d’arrivée"
        />
        <FiltreSegments
          label="Statut"
          value={filtres.valeurs.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={[
            { valeur: '', label: 'Tous' },
            { valeur: 'actif', label: 'Actifs' },
            { valeur: 'inactif', label: 'Inactifs' },
          ]}
        />
      </FiltresBar>

      <Card>
        <CardHeader title="Trajets" right={`${trajetsFiltres.length} / ${trajets.length}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : trajets.length === 0 ? (
          <TableMessage>Aucun trajet enregistré pour le moment.</TableMessage>
        ) : trajetsFiltres.length === 0 ? (
          <TableMessage>Aucun trajet ne correspond à ces filtres.</TableMessage>
        ) : (
          <Table minWidth="820px">
            <THead>
              <Th>Départ</Th>
              <Th>Arrivée</Th>
              <Th>Heure</Th>
              <Th>Récurrence</Th>
              <Th>Prix</Th>
              <Th>Statut</Th>
              {peutGerer && <Th>Action</Th>}
            </THead>
            <tbody>
              {trajetsFiltres.map((t) => (
                <Tr key={t.id}>
                  <Td strong>{t.villeDepart.nom}</Td>
                  <Td>{t.villeArrivee.nom}</Td>
                  <Td>{formatHeure(t.heureDepart)}</Td>
                  <Td>{t.joursRecurrence || 'Tous les jours'}</Td>
                  <Td>
                    <span className="tabular-nums font-medium text-accent-ink">{formatFcfa(t.prix)}</span>
                  </Td>
                  <Td>
                    <Badge tone={t.statut === 'actif' ? 'success' : 'neutral'}>{t.statut}</Badge>
                  </Td>
                  {peutGerer && (
                    <Td>
                      <div className="flex gap-3">
                        <Button variant="link" onClick={() => handleToggleStatut(t)} disabled={enCours === t.id}>
                          {t.statut === 'actif' ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button variant="link-danger" onClick={() => handleSupprimer(t)} disabled={enCours === t.id}>
                          Supprimer
                        </Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </DashboardShell>
  );
}
