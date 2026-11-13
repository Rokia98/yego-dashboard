'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Pencil, Power, Route, Trash2 } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import { Field, Input, Select } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import { ListePaginee } from '@/components/ui/Pagination';
import Modal, { BoutonCreation, ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { trajetsApi } from '@/features/trajets';
import type { Trajet } from '@/features/trajets';
import { villesApi } from '@/features/villes';
import type { Ville } from '@/features/villes';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { formatFcfa, formatHeure } from '@/lib/format';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import { normaliser, useFiltres } from '@/lib/filtres';

// Bornes imposées par l'API (0.29.0) à la création et à la modification d'un trajet.
const PRIX_MIN = 100;
const PRIX_MAX = 1_000_000;

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

/** "1970-01-01T07:30:00.000Z" → "07:30" pour un <input type="time">. */
function versChampHeure(valeur: string | null): string {
  if (!valeur) return '';
  const h = formatHeure(valeur);
  return h === '—' ? '' : h;
}

export default function TrajetsPage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  // undefined = modale fermée, null = création, nombre = modification.
  const [edition, setEdition] = useState<number | null | undefined>(undefined);
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
  }, [ready, user]);

  function ouvrir(t?: Trajet) {
    setErreur(null);
    setChamps(
      t
        ? {
            villeDepartId: String(t.villeDepartId),
            villeArriveeId: String(t.villeArriveeId),
            heureDepart: versChampHeure(t.heureDepart),
            heureArriveeEstimee: versChampHeure(t.heureArriveeEstimee),
            prix: String(Number(t.prix)),
            joursRecurrence: t.joursRecurrence ?? '',
          }
        : CHAMPS_VIDES,
    );
    setEdition(t?.id ?? null);
  }

  function fermer() {
    setEdition(undefined);
    setErreur(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.compagnieId || edition === undefined) return;
    setErreur(null);
    if (champs.villeDepartId === champs.villeArriveeId) {
      setErreur('Les villes de départ et d’arrivée doivent être différentes.');
      return;
    }
    const prix = Number(champs.prix);
    if (!Number.isFinite(prix) || prix < PRIX_MIN || prix > PRIX_MAX) {
      setErreur(`Le prix doit être compris entre ${formatFcfa(PRIX_MIN)} et ${formatFcfa(PRIX_MAX)}.`);
      return;
    }
    const donnees = {
      villeDepartId: Number(champs.villeDepartId),
      villeArriveeId: Number(champs.villeArriveeId),
      heureDepart: champs.heureDepart,
      heureArriveeEstimee: champs.heureArriveeEstimee || undefined,
      prix,
      joursRecurrence: champs.joursRecurrence.trim() || undefined,
    };
    setEnvoi(true);
    try {
      if (edition === null) {
        await trajetsApi.create({ compagnieId: user.compagnieId, ...donnees });
        notifier.succes('Trajet créé.');
      } else {
        await trajetsApi.update(edition, donnees);
        notifier.succes('Trajet mis à jour.');
      }
      fermer();
      await chargerTrajets(user.compagnieId);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du trajet');
    } finally {
      setEnvoi(false);
    }
  }

  async function handleToggleStatut(t: Trajet) {
    if (!user?.compagnieId) return;
    const cible = t.statut === 'actif' ? 'inactif' : 'actif';
    if (
      cible === 'inactif' &&
      !(await confirmer({
        titre: 'Désactiver ce trajet ?',
        message: `${t.villeDepart.nom} → ${t.villeArrivee.nom} ne sera plus proposé à la vente. Vous pourrez le réactiver à tout moment.`,
        libelleConfirmer: 'Désactiver',
        ton: 'warning',
      }))
    )
      return;
    setEnCours(t.id);
    try {
      await trajetsApi.update(t.id, { statut: cible });
      await chargerTrajets(user.compagnieId);
      notifier.succes(cible === 'actif' ? 'Trajet activé.' : 'Trajet désactivé.');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  async function handleSupprimer(t: Trajet) {
    if (!user?.compagnieId) return;
    const ok = await confirmer({
      titre: 'Supprimer ce trajet ?',
      message: `${t.villeDepart.nom} → ${t.villeArrivee.nom}\nImpossible s’il a déjà des départs planifiés : désactivez-le plutôt.`,
      libelleConfirmer: 'Supprimer',
      ton: 'danger',
    });
    if (!ok) return;
    setEnCours(t.id);
    try {
      await trajetsApi.remove(t.id);
      await chargerTrajets(user.compagnieId);
      notifier.succes('Trajet supprimé.');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors de la suppression');
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
  const actifs = trajets.filter((t) => t.statut === 'actif').length;
  const enModification = edition != null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Trajets"
        subtitle="Les itinéraires que votre compagnie propose à la vente."
        right={trajets.length > 0 ? `${actifs} actif${actifs > 1 ? 's' : ''} sur ${trajets.length}` : undefined}
      />

      {peutGerer && <BoutonCreation label="Créer un trajet" onClick={() => ouvrir()} />}

      {peutGerer && (
        <Modal
          ouvert={edition !== undefined}
          icone={Route}
          titre={enModification ? 'Modifier le trajet' : 'Créer un trajet'}
          sousTitre={
            enModification
              ? 'Les départs déjà planifiés conservent leurs réservations.'
              : 'Un trajet est un itinéraire régulier ; planifiez ensuite ses départs datés.'
          }
          onFermer={envoi ? undefined : fermer}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Field label="Heure de départ">
                <Input type="time" required value={champs.heureDepart} onChange={(e) => setChamps({ ...champs, heureDepart: e.target.value })} />
              </Field>
              <Field label="Heure d'arrivée estimée">
                <Input type="time" value={champs.heureArriveeEstimee} onChange={(e) => setChamps({ ...champs, heureArriveeEstimee: e.target.value })} />
              </Field>
              <Field label="Prix (FCFA)">
                <Input type="number" min={PRIX_MIN} max={PRIX_MAX} step="1" required value={champs.prix} onChange={(e) => setChamps({ ...champs, prix: e.target.value })} />
              </Field>
              <Field label="Jours de récurrence">
                <Input
                  type="text"
                  placeholder="lun,mar,mer,jeu,ven (vide = tous les jours)"
                  value={champs.joursRecurrence}
                  onChange={(e) => setChamps({ ...champs, joursRecurrence: e.target.value })}
                />
              </Field>
            </div>

            <ErreurFormulaire>{erreur}</ErreurFormulaire>

            <PiedModal envoi={envoi} libelle={enModification ? 'Enregistrer' : 'Créer le trajet'} onAnnuler={fermer} />
          </form>
        </Modal>
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
          <TableMessage icone={Route}>Aucun trajet enregistré pour le moment.</TableMessage>
        ) : trajetsFiltres.length === 0 ? (
          <TableMessage>Aucun trajet ne correspond à ces filtres.</TableMessage>
        ) : (
          <ListePaginee items={trajetsFiltres} cle={filtres.cle}>
            {(page) => (
              <Table minWidth="760px">
                <THead>
                  <Th>Itinéraire</Th>
                  <Th>Horaires</Th>
                  <Th>Récurrence</Th>
                  <Th align="right">Prix</Th>
                  <Th>Statut</Th>
                  {peutGerer && <ThActions />}
                </THead>
                <tbody>
                  {page.map((t) => (
                    <Tr key={t.id} attenue={t.statut !== 'actif'}>
                      <Td strong>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          {t.villeDepart.nom}
                          <ArrowRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
                          {t.villeArrivee.nom}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">
                        {formatHeure(t.heureDepart)}
                        {t.heureArriveeEstimee && (
                          <span className="text-ink-faint"> → {formatHeure(t.heureArriveeEstimee)}</span>
                        )}
                      </Td>
                      <Td>{t.joursRecurrence || 'Tous les jours'}</Td>
                      <Td align="right">
                        <span className="whitespace-nowrap tabular-nums font-medium text-accent-ink">{formatFcfa(t.prix)}</span>
                      </Td>
                      <Td>
                        <Badge tone={t.statut === 'actif' ? 'success' : 'neutral'}>{t.statut === 'actif' ? 'Actif' : 'Inactif'}</Badge>
                      </Td>
                      {peutGerer && (
                        <TdActions>
                          <Actions>
                            <ActionIcone icone={Pencil} label="Modifier" onClick={() => ouvrir(t)} disabled={enCours === t.id} />
                            <ActionIcone
                              icone={Power}
                              label={t.statut === 'actif' ? 'Désactiver' : 'Activer'}
                              ton={t.statut === 'actif' ? 'warning' : 'success'}
                              chargement={enCours === t.id}
                              onClick={() => handleToggleStatut(t)}
                            />
                            <MenuActions
                              disabled={enCours === t.id}
                              items={[{ label: 'Supprimer', icone: Trash2, ton: 'danger', onClick: () => handleSupprimer(t) }]}
                            />
                          </Actions>
                        </TdActions>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ListePaginee>
        )}
      </Card>
    </DashboardShell>
  );
}
