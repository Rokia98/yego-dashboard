'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ListePaginee } from '@/components/ui/Pagination';
import Modal, { BoutonCreation, PiedModal } from '@/components/ui/Modal';
import { vehiculesApi, chauffeursApi } from '@/features/flotte';
import type { Vehicule, Chauffeur } from '@/features/flotte';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { chiffresTelephone, estTelephoneValide, formatTelephone, telephonePourApi } from '@/lib/telephone';

const VEHICULE_VIDE = { immatriculation: '', typeVehicule: '', capacite: '' };
const CHAUFFEUR_VIDE = { nom: '', telephone: '', numeroPermis: '' };

const STATUT_TONE = {
  actif: 'success',
  maintenance: 'warning',
  hors_service: 'danger',
} as const;

export default function FlottePage() {
  const { user, ready } = useAuthGuard(['agent', 'company_admin']);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [chargement, setChargement] = useState(true);

  const [champsVehicule, setChampsVehicule] = useState(VEHICULE_VIDE);
  const [erreurVehicule, setErreurVehicule] = useState<string | null>(null);
  const [envoiVehicule, setEnvoiVehicule] = useState(false);

  const [champsChauffeur, setChampsChauffeur] = useState(CHAUFFEUR_VIDE);
  const [erreurChauffeur, setErreurChauffeur] = useState<string | null>(null);
  const [envoiChauffeur, setEnvoiChauffeur] = useState(false);

  const peutGerer = user?.role === 'company_admin';
  const [modale, setModale] = useState<'vehicule' | 'chauffeur' | null>(null);

  function fermerVehicule() {
    setModale(null);
    setErreurVehicule(null);
    setChampsVehicule(VEHICULE_VIDE);
  }
  function fermerChauffeur() {
    setModale(null);
    setErreurChauffeur(null);
    setChampsChauffeur(CHAUFFEUR_VIDE);
  }

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

  async function handleCreerVehicule(e: React.FormEvent) {
    e.preventDefault();
    setErreurVehicule(null);
    setEnvoiVehicule(true);
    try {
      await vehiculesApi.create({
        immatriculation: champsVehicule.immatriculation,
        typeVehicule: champsVehicule.typeVehicule || undefined,
        capacite: Number(champsVehicule.capacite),
      });
      setChampsVehicule(VEHICULE_VIDE);
      setModale(null);
      await chargerVehicules();
    } catch (err) {
      setErreurVehicule(err instanceof Error ? err.message : 'Erreur lors de la création du véhicule');
    } finally {
      setEnvoiVehicule(false);
    }
  }

  async function handleStatutVehicule(id: number, statut: 'actif' | 'maintenance' | 'hors_service') {
    try {
      await vehiculesApi.update(id, { statut });
      await chargerVehicules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  }

  async function handleSupprimerVehicule(id: number) {
    if (!confirm('Supprimer ce véhicule ?')) return;
    try {
      await vehiculesApi.delete(id);
      await chargerVehicules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }

  async function handleCreerChauffeur(e: React.FormEvent) {
    e.preventDefault();
    setErreurChauffeur(null);
    if (champsChauffeur.telephone && !estTelephoneValide(champsChauffeur.telephone)) {
      setErreurChauffeur('Le numéro doit comporter 10 chiffres.');
      return;
    }
    setEnvoiChauffeur(true);
    try {
      await chauffeursApi.create({
        nom: champsChauffeur.nom,
        telephone: champsChauffeur.telephone ? telephonePourApi(champsChauffeur.telephone) : undefined,
        numeroPermis: champsChauffeur.numeroPermis || undefined,
      });
      setChampsChauffeur(CHAUFFEUR_VIDE);
      setModale(null);
      await chargerChauffeurs();
    } catch (err) {
      setErreurChauffeur(err instanceof Error ? err.message : 'Erreur lors de la création du chauffeur');
    } finally {
      setEnvoiChauffeur(false);
    }
  }

  async function handleSupprimerChauffeur(id: number) {
    if (!confirm('Supprimer ce chauffeur ?')) return;
    try {
      await chauffeursApi.delete(id);
      await chargerChauffeurs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader eyebrow="Espace opérateur" title="Flotte" subtitle="Véhicules et chauffeurs disponibles pour vos départs." />

      {peutGerer && <BoutonCreation label="Ajouter un véhicule" onClick={() => setModale('vehicule')} />}

      {peutGerer && (
        <Modal
          ouvert={modale === 'vehicule'}
          titre="Ajouter un véhicule"
          onFermer={envoiVehicule ? undefined : fermerVehicule}
        >
          <form onSubmit={handleCreerVehicule}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Immatriculation">
                <Input
                  type="text"
                  required
                  placeholder="CI-1234-AB"
                  value={champsVehicule.immatriculation}
                  onChange={(e) => setChampsVehicule({ ...champsVehicule, immatriculation: e.target.value })}
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
              <Field label="Capacité">
                <Input
                  type="number"
                  min="1"
                  required
                  value={champsVehicule.capacite}
                  onChange={(e) => setChampsVehicule({ ...champsVehicule, capacite: e.target.value })}
                />
              </Field>
            </div>
            {erreurVehicule && <p className="mt-3 text-sm text-danger">{erreurVehicule}</p>}
            <PiedModal envoi={envoiVehicule} libelle="Ajouter le véhicule" onAnnuler={fermerVehicule} />
          </form>
        </Modal>
      )}

      <Card className="mb-6">
        <CardHeader title="Véhicules" right={`${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : vehicules.length === 0 ? (
          <TableMessage>Aucun véhicule enregistré.</TableMessage>
        ) : (
          <ListePaginee items={vehicules}>
            {(page) => (
          <Table minWidth="640px">
            <THead>
              <Th>Immatriculation</Th>
              <Th>Type</Th>
              <Th>Capacité</Th>
              <Th>Statut</Th>
              {peutGerer && <Th>Action</Th>}
            </THead>
            <tbody>
              {page.map((v) => (
                <Tr key={v.id}>
                  <Td strong>{v.immatriculation}</Td>
                  <Td>{v.typeVehicule || '—'}</Td>
                  <Td className="tabular-nums">{v.capacite}</Td>
                  <Td>
                    {peutGerer ? (
                      <Select
                        value={v.statut}
                        onChange={(e) => handleStatutVehicule(v.id, e.target.value as 'actif' | 'maintenance' | 'hors_service')}
                        className="w-auto py-1 text-xs"
                      >
                        <option value="actif">actif</option>
                        <option value="maintenance">maintenance</option>
                        <option value="hors_service">hors_service</option>
                      </Select>
                    ) : (
                      <Badge tone={STATUT_TONE[v.statut as keyof typeof STATUT_TONE] || 'neutral'}>{v.statut}</Badge>
                    )}
                  </Td>
                  {peutGerer && (
                    <Td>
                      <Button variant="link-danger" onClick={() => handleSupprimerVehicule(v.id)}>
                        Supprimer
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
            )}
          </ListePaginee>
        )}
      </Card>

      {peutGerer && <BoutonCreation label="Ajouter un chauffeur" onClick={() => setModale('chauffeur')} />}

      {peutGerer && (
        <Modal
          ouvert={modale === 'chauffeur'}
          titre="Ajouter un chauffeur"
          onFermer={envoiChauffeur ? undefined : fermerChauffeur}
        >
          <form onSubmit={handleCreerChauffeur}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom">
                <Input
                  type="text"
                  required
                  value={champsChauffeur.nom}
                  onChange={(e) => setChampsChauffeur({ ...champsChauffeur, nom: e.target.value })}
                />
              </Field>
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
            {erreurChauffeur && <p className="mt-3 text-sm text-danger">{erreurChauffeur}</p>}
            <PiedModal envoi={envoiChauffeur} libelle="Ajouter le chauffeur" onAnnuler={fermerChauffeur} />
          </form>
        </Modal>
      )}

      <Card>
        <CardHeader title="Chauffeurs" right={`${chauffeurs.length} chauffeur${chauffeurs.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : chauffeurs.length === 0 ? (
          <TableMessage>Aucun chauffeur enregistré.</TableMessage>
        ) : (
          <ListePaginee items={chauffeurs}>
            {(page) => (
          <Table minWidth="560px">
            <THead>
              <Th>Nom</Th>
              <Th>Téléphone</Th>
              <Th>Permis</Th>
              {peutGerer && <Th>Action</Th>}
            </THead>
            <tbody>
              {page.map((c) => (
                <Tr key={c.id}>
                  <Td strong>{c.nom}</Td>
                  <Td>{c.telephone ? formatTelephone(c.telephone) : '—'}</Td>
                  <Td>{c.numeroPermis || '—'}</Td>
                  {peutGerer && (
                    <Td>
                      <Button variant="link-danger" onClick={() => handleSupprimerChauffeur(c.id)}>
                        Supprimer
                      </Button>
                    </Td>
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
