'use client';

import { useEffect, useState } from 'react';
import { Bus, Pencil, Trash2, UserRound, Wrench, CircleCheck, CircleOff } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import { Field, Input, Select } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Initiales from '@/components/ui/Initiales';
import { ListePaginee } from '@/components/ui/Pagination';
import Modal, { BoutonCreation, ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { vehiculesApi, chauffeursApi } from '@/features/flotte';
import type { Vehicule, Chauffeur } from '@/features/flotte';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { chiffresTelephone, estTelephoneValide, formatTelephone, telephonePourApi } from '@/lib/telephone';

type StatutVehicule = 'actif' | 'maintenance' | 'hors_service';

const VEHICULE_VIDE = { immatriculation: '', typeVehicule: '', capacite: '', statut: 'actif' as StatutVehicule };
const CHAUFFEUR_VIDE = { nom: '', telephone: '', numeroPermis: '' };

const STATUTS: Record<StatutVehicule, { label: string; tone: 'success' | 'warning' | 'danger'; icone: typeof Wrench }> = {
  actif: { label: 'En service', tone: 'success', icone: CircleCheck },
  maintenance: { label: 'Maintenance', tone: 'warning', icone: Wrench },
  hors_service: { label: 'Hors service', tone: 'danger', icone: CircleOff },
};

// Modale ouverte : création (id null) ou modification (id de la ligne).
type Edition = { type: 'vehicule' | 'chauffeur'; id: number | null } | null;

export default function FlottePage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState<string | null>(null);

  const [edition, setEdition] = useState<Edition>(null);
  const [champsVehicule, setChampsVehicule] = useState(VEHICULE_VIDE);
  const [champsChauffeur, setChampsChauffeur] = useState(CHAUFFEUR_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const peutGerer = user?.role === 'company_admin';

  function chargerVehicules() {
    return vehiculesApi.list().then(setVehicules).catch(() => setVehicules([]));
  }
  function chargerChauffeurs() {
    return chauffeursApi.list().then(setChauffeurs).catch(() => setChauffeurs([]));
  }

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    Promise.all([chargerVehicules(), chargerChauffeurs()]).finally(() => setChargement(false));
  }, [ready]);

  function fermer() {
    setEdition(null);
    setErreur(null);
  }

  function ouvrirVehicule(v?: Vehicule) {
    setErreur(null);
    setChampsVehicule(
      v
        ? {
            immatriculation: v.immatriculation,
            typeVehicule: v.typeVehicule ?? '',
            capacite: String(v.capacite),
            statut: (v.statut as StatutVehicule) ?? 'actif',
          }
        : VEHICULE_VIDE,
    );
    setEdition({ type: 'vehicule', id: v?.id ?? null });
  }

  function ouvrirChauffeur(c?: Chauffeur) {
    setErreur(null);
    setChampsChauffeur(
      c
        ? { nom: c.nom, telephone: chiffresTelephone(c.telephone ?? ''), numeroPermis: c.numeroPermis ?? '' }
        : CHAUFFEUR_VIDE,
    );
    setEdition({ type: 'chauffeur', id: c?.id ?? null });
  }

  async function enregistrerVehicule(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setErreur(null);
    setEnvoi(true);
    const donnees = {
      immatriculation: champsVehicule.immatriculation.trim(),
      typeVehicule: champsVehicule.typeVehicule.trim() || undefined,
      capacite: Number(champsVehicule.capacite),
    };
    try {
      if (edition.id == null) {
        await vehiculesApi.create(donnees);
        notifier.succes(`Véhicule ${donnees.immatriculation} ajouté.`);
      } else {
        await vehiculesApi.update(edition.id, { ...donnees, statut: champsVehicule.statut });
        notifier.succes(`Véhicule ${donnees.immatriculation} mis à jour.`);
      }
      fermer();
      await chargerVehicules();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du véhicule');
    } finally {
      setEnvoi(false);
    }
  }

  async function enregistrerChauffeur(e: React.FormEvent) {
    e.preventDefault();
    if (!edition) return;
    setErreur(null);
    if (champsChauffeur.telephone && !estTelephoneValide(champsChauffeur.telephone)) {
      setErreur('Le numéro doit comporter 10 chiffres.');
      return;
    }
    setEnvoi(true);
    const donnees = {
      nom: champsChauffeur.nom.trim(),
      telephone: champsChauffeur.telephone ? telephonePourApi(champsChauffeur.telephone) : undefined,
      numeroPermis: champsChauffeur.numeroPermis.trim() || undefined,
    };
    try {
      if (edition.id == null) {
        await chauffeursApi.create(donnees);
        notifier.succes(`Chauffeur ${donnees.nom} ajouté.`);
      } else {
        await chauffeursApi.update(edition.id, donnees);
        notifier.succes(`Chauffeur ${donnees.nom} mis à jour.`);
      }
      fermer();
      await chargerChauffeurs();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du chauffeur');
    } finally {
      setEnvoi(false);
    }
  }

  async function changerStatut(v: Vehicule, statut: StatutVehicule) {
    setEnCours(`v${v.id}`);
    try {
      await vehiculesApi.update(v.id, { statut });
      await chargerVehicules();
      notifier.succes(`${v.immatriculation} : ${STATUTS[statut].label.toLowerCase()}.`);
    } catch (err) {
      notifier.erreur(err, 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  async function supprimerVehicule(v: Vehicule) {
    const ok = await confirmer({
      titre: 'Supprimer ce véhicule ?',
      message: `Le véhicule ${v.immatriculation} sera retiré de votre flotte. Cette action est définitive.`,
      libelleConfirmer: 'Supprimer',
      ton: 'danger',
    });
    if (!ok) return;
    setEnCours(`v${v.id}`);
    try {
      await vehiculesApi.delete(v.id);
      await chargerVehicules();
      notifier.succes('Véhicule supprimé.');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors de la suppression');
    } finally {
      setEnCours(null);
    }
  }

  async function supprimerChauffeur(c: Chauffeur) {
    const ok = await confirmer({
      titre: 'Supprimer ce chauffeur ?',
      message: `${c.nom} ne pourra plus être affecté à un départ. Cette action est définitive.`,
      libelleConfirmer: 'Supprimer',
      ton: 'danger',
    });
    if (!ok) return;
    setEnCours(`c${c.id}`);
    try {
      await chauffeursApi.delete(c.id);
      await chargerChauffeurs();
      notifier.succes('Chauffeur supprimé.');
    } catch (err) {
      notifier.erreur(err, 'Erreur lors de la suppression');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const enService = vehicules.filter((v) => v.statut === 'actif').length;
  const places = vehicules.filter((v) => v.statut === 'actif').reduce((s, v) => s + (v.capacite || 0), 0);
  const modifVehicule = edition?.type === 'vehicule' && edition.id != null;
  const modifChauffeur = edition?.type === 'chauffeur' && edition.id != null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Flotte"
        subtitle="Véhicules et chauffeurs disponibles pour vos départs."
        right={
          vehicules.length > 0
            ? `${enService}/${vehicules.length} en service · ${places.toLocaleString('fr-FR')} places`
            : undefined
        }
      />

      {peutGerer && (
        <>
          <Modal
            ouvert={edition?.type === 'vehicule'}
            icone={Bus}
            titre={modifVehicule ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            sousTitre={modifVehicule ? champsVehicule.immatriculation : 'Il pourra ensuite être affecté à vos départs.'}
            onFermer={envoi ? undefined : fermer}
          >
            <form onSubmit={enregistrerVehicule}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Immatriculation">
                  <Input
                    type="text"
                    required
                    placeholder="CI-1234-AB"
                    value={champsVehicule.immatriculation}
                    onChange={(e) => setChampsVehicule({ ...champsVehicule, immatriculation: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Type de véhicule">
                  <Input
                    type="text"
                    placeholder="Autocar 50 places"
                    value={champsVehicule.typeVehicule}
                    onChange={(e) => setChampsVehicule({ ...champsVehicule, typeVehicule: e.target.value })}
                  />
                </Field>
                <Field label="Capacité (places)">
                  <Input
                    type="number"
                    min="1"
                    required
                    value={champsVehicule.capacite}
                    onChange={(e) => setChampsVehicule({ ...champsVehicule, capacite: e.target.value })}
                  />
                </Field>
                {modifVehicule && (
                  <Field label="Statut">
                    <Select
                      value={champsVehicule.statut}
                      onChange={(e) => setChampsVehicule({ ...champsVehicule, statut: e.target.value as StatutVehicule })}
                    >
                      {(Object.keys(STATUTS) as StatutVehicule[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUTS[s].label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
              <ErreurFormulaire>{erreur}</ErreurFormulaire>
              <PiedModal
                envoi={envoi}
                libelle={modifVehicule ? 'Enregistrer' : 'Ajouter le véhicule'}
                onAnnuler={fermer}
              />
            </form>
          </Modal>

          <Modal
            ouvert={edition?.type === 'chauffeur'}
            icone={UserRound}
            titre={modifChauffeur ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}
            sousTitre={modifChauffeur ? champsChauffeur.nom : undefined}
            onFermer={envoi ? undefined : fermer}
          >
            <form onSubmit={enregistrerChauffeur}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nom complet">
                    <Input
                      type="text"
                      required
                      value={champsChauffeur.nom}
                      onChange={(e) => setChampsChauffeur({ ...champsChauffeur, nom: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Téléphone (10 chiffres)">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0701020304"
                    value={champsChauffeur.telephone}
                    onChange={(e) => setChampsChauffeur({ ...champsChauffeur, telephone: chiffresTelephone(e.target.value) })}
                  />
                </Field>
                <Field label="Numéro de permis">
                  <Input
                    type="text"
                    value={champsChauffeur.numeroPermis}
                    onChange={(e) => setChampsChauffeur({ ...champsChauffeur, numeroPermis: e.target.value })}
                  />
                </Field>
              </div>
              <ErreurFormulaire>{erreur}</ErreurFormulaire>
              <PiedModal
                envoi={envoi}
                libelle={modifChauffeur ? 'Enregistrer' : 'Ajouter le chauffeur'}
                onAnnuler={fermer}
              />
            </form>
          </Modal>
        </>
      )}

      {peutGerer && <BoutonCreation label="Ajouter un véhicule" onClick={() => ouvrirVehicule()} />}

      <Card className="mb-8">
        <CardHeader
          title="Véhicules"
          subtitle="Seuls les véhicules en service sont proposés à la planification."
          right={`${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''}`}
        />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : vehicules.length === 0 ? (
          <TableMessage icone={Bus}>Aucun véhicule enregistré.</TableMessage>
        ) : (
          <ListePaginee items={vehicules}>
            {(page) => (
              <Table minWidth="640px">
                <THead>
                  <Th>Immatriculation</Th>
                  <Th>Type</Th>
                  <Th align="right">Capacité</Th>
                  <Th>Statut</Th>
                  {peutGerer && <ThActions />}
                </THead>
                <tbody>
                  {page.map((v) => {
                    const s = STATUTS[v.statut as StatutVehicule];
                    const occupe = enCours === `v${v.id}`;
                    return (
                      <Tr key={v.id} attenue={v.statut === 'hors_service'}>
                        <Td strong>
                          <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs tracking-wide">
                            {v.immatriculation}
                          </span>
                        </Td>
                        <Td>{v.typeVehicule || '—'}</Td>
                        <Td align="right" className="tabular-nums">
                          {v.capacite} pl.
                        </Td>
                        <Td>
                          <Badge tone={s?.tone ?? 'neutral'}>{s?.label ?? v.statut}</Badge>
                        </Td>
                        {peutGerer && (
                          <TdActions>
                            <Actions>
                              <ActionIcone icone={Pencil} label="Modifier" onClick={() => ouvrirVehicule(v)} disabled={occupe} />
                              <MenuActions
                                disabled={occupe}
                                items={[
                                  ...(Object.keys(STATUTS) as StatutVehicule[]).map((st) => ({
                                    label: `Passer en « ${STATUTS[st].label.toLowerCase()} »`,
                                    icone: STATUTS[st].icone,
                                    onClick: () => changerStatut(v, st),
                                    masque: v.statut === st,
                                  })),
                                  'separateur' as const,
                                  { label: 'Supprimer', icone: Trash2, ton: 'danger' as const, onClick: () => supprimerVehicule(v) },
                                ]}
                              />
                            </Actions>
                          </TdActions>
                        )}
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </ListePaginee>
        )}
      </Card>

      {peutGerer && <BoutonCreation label="Ajouter un chauffeur" onClick={() => ouvrirChauffeur()} />}

      <Card>
        <CardHeader title="Chauffeurs" right={`${chauffeurs.length} chauffeur${chauffeurs.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : chauffeurs.length === 0 ? (
          <TableMessage icone={UserRound}>Aucun chauffeur enregistré.</TableMessage>
        ) : (
          <ListePaginee items={chauffeurs}>
            {(page) => (
              <Table minWidth="560px">
                <THead>
                  <Th>Nom</Th>
                  <Th>Téléphone</Th>
                  <Th>Permis</Th>
                  {peutGerer && <ThActions />}
                </THead>
                <tbody>
                  {page.map((c) => (
                    <Tr key={c.id}>
                      <Td strong>
                        <span className="flex items-center gap-2.5">
                          <Initiales nom={c.nom} />
                          {c.nom}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{c.telephone ? formatTelephone(c.telephone) : '—'}</Td>
                      <Td>{c.numeroPermis || '—'}</Td>
                      {peutGerer && (
                        <TdActions>
                          <Actions>
                            <ActionIcone icone={Pencil} label="Modifier" onClick={() => ouvrirChauffeur(c)} />
                            <ActionIcone
                              icone={Trash2}
                              label="Supprimer"
                              ton="danger"
                              chargement={enCours === `c${c.id}`}
                              onClick={() => supprimerChauffeur(c)}
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

