'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Upload } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import CompteGestionnaire from '@/components/compagnies/CompteGestionnaire';
import Modal from '@/components/ui/Modal';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import { normaliser, useFiltres } from '@/lib/filtres';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { abonnementsApi } from '@/features/abonnements';
import type { Abonnement } from '@/features/abonnements';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { formatDate } from '@/lib/format';
import { chiffresTelephone, estTelephoneValide, formatTelephone, telephonePourApi } from '@/lib/telephone';
import { fichierVersDataUri } from '@/lib/image';

const BADGE_TONE = {
  actif: 'success',
  en_attente: 'warning',
  suspendu: 'danger',
} as const;

const CHAMPS_VIDES = {
  nom: '',
  telephone: '',
  email: '',
  logoUrl: '',
};

type Filtres = { q: string; statut: '' | 'actif' | 'en_attente' | 'suspendu'; abonnement: '' | 'actif' | 'aucun' };
const FILTRES_DEFAUT: Filtres = { q: '', statut: '', abonnement: '' };

export default function AdminCompagniesPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [edite, setEdite] = useState<number | null>(null);
  const [champsEdit, setChampsEdit] = useState({ nom: '', telephone: '', email: '' });
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [docsOuverts, setDocsOuverts] = useState<number | null>(null);
  const [gestionnaireOuvert, setGestionnaireOuvert] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtres = useFiltres<Filtres>(FILTRES_DEFAUT, 'q');

  function charger() {
    return Promise.all([
      compagniesApi.list().then(setCompagnies).catch(() => setCompagnies([])),
      abonnementsApi.listAll().then(setAbonnements).catch(() => setAbonnements([])),
    ]);
  }

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    charger().finally(() => setChargement(false));
  }, [ready]);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setChamps((c) => ({ ...c, logoUrl: '' }));
      const uri = await fichierVersDataUri(f);
      setChamps((c) => ({ ...c, logoUrl: uri }));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Logo illisible');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (champs.telephone && !estTelephoneValide(champs.telephone)) {
      setErreur('Le téléphone (WhatsApp) de la compagnie doit comporter 10 chiffres.');
      return;
    }
    setEnvoi(true);
    try {
      const compagnie = await compagniesApi.create({
        nom: champs.nom,
        telephone: champs.telephone ? telephonePourApi(champs.telephone) : undefined,
        email: champs.email || undefined,
        logoUrl: champs.logoUrl || undefined,
      });

      setChamps(CHAMPS_VIDES);
      if (fileRef.current) fileRef.current.value = '';
      setFormulaireOuvert(false);
      await charger();
      // Enchaîne sur le compte gestionnaire de la nouvelle compagnie (modale).
      setGestionnaireOuvert(compagnie.id);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la création de la compagnie');
    } finally {
      setEnvoi(false);
    }
  }

  // Fermer sans créer : on repart d'un formulaire vierge à la prochaine ouverture.
  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setErreur(null);
    setChamps(CHAMPS_VIDES);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleStatut(id: number, statut: 'actif' | 'suspendu' | 'en_attente') {
    setEnCours(id);
    try {
      await compagniesApi.updateStatut(id, statut);
      await charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  function ouvrirEdition(c: Compagnie) {
    setEdite(c.id);
    setChampsEdit({ nom: c.nom, telephone: chiffresTelephone(c.telephone ?? ''), email: c.email ?? '' });
  }

  async function enregistrerEdition(id: number) {
    setEnCours(id);
    try {
      await compagniesApi.update(id, {
        nom: champsEdit.nom,
        telephone: champsEdit.telephone ? telephonePourApi(champsEdit.telephone) : undefined,
        email: champsEdit.email || undefined,
      });
      setEdite(null);
      await charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const abonnementActif = (compagnieId: number) =>
    abonnements.some(
      (a) => a.compagnieId === compagnieId && a.statut === 'actif' && new Date(a.dateFin) > new Date(),
    );

  const compagnieGestionnaire = compagnies.find((c) => c.id === gestionnaireOuvert) ?? null;
  const actives = compagnies.filter((c) => c.statut === 'actif').length;
  const enAttente = compagnies.filter((c) => c.statut === 'en_attente').length;
  const suspendues = compagnies.filter((c) => c.statut === 'suspendu').length;

  const fa = filtres.appliques;
  const qn = normaliser(fa.q);
  const qChiffres = fa.q.replace(/\D/g, '');
  const compagniesFiltrees = compagnies.filter((c) => {
    if (fa.statut && c.statut !== fa.statut) return false;
    if (fa.abonnement === 'actif' && !abonnementActif(c.id)) return false;
    if (fa.abonnement === 'aucun' && abonnementActif(c.id)) return false;
    if (!qn) return true;
    return (
      normaliser(c.nom).includes(qn) ||
      normaliser(c.email).includes(qn) ||
      (qChiffres.length >= 4 && (c.telephone ?? '').replace(/\D/g, '').includes(qChiffres))
    );
  });

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Compagnies partenaires"
        subtitle="Validation, activation et suivi des opérateurs de transport."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Actives" value={actives} detail="Partenaires opérationnels" />
        <StatCard label="À valider" value={enAttente} detail="Demandes en attente" />
        <StatCard label="Suspendues" value={suspendues} detail="Nécessitent une action" />
        <StatCard label="Total" value={compagnies.length} detail="Dans votre réseau" />
      </div>

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setFormulaireOuvert(true)}>
          <Plus className="h-4 w-4" strokeWidth={2} /> Créer une compagnie
        </Button>
      </div>

      <Modal
        ouvert={formulaireOuvert}
        titre="Créer une compagnie"
        sousTitre="Le compte gestionnaire se crée ensuite ; ses identifiants partent par WhatsApp."
        onFermer={envoi ? undefined : fermerFormulaire}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input type="text" required value={champs.nom} onChange={(e) => setChamps({ ...champs, nom: e.target.value })} />
            </Field>
            <Field label="Téléphone WhatsApp (10 chiffres)">
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="0701020304"
                value={champs.telephone}
                onChange={(e) => setChamps({ ...champs, telephone: chiffresTelephone(e.target.value) })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email">
                <Input type="email" value={champs.email} onChange={(e) => setChamps({ ...champs, email: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2">
              {champs.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={champs.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-ink-faint">Logo</span>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} className="!py-1.5 !text-xs">
                <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
                {champs.logoUrl ? 'Changer le logo' : 'Choisir un logo'}
              </Button>
              {champs.logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setChamps((c) => ({ ...c, logoUrl: '' }));
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="ml-3 text-xs text-ink-faint hover:text-danger"
                >
                  Retirer
                </button>
              )}
              <p className="mt-1 text-xs text-ink-faint">PNG ou JPEG, redimensionné automatiquement.</p>
            </div>
          </div>

          {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-line-soft pt-4">
            <Button variant="ghost" onClick={fermerFormulaire} disabled={envoi}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? 'Création...' : 'Créer la compagnie'}
            </Button>
          </div>
        </form>
      </Modal>

      {compagnieGestionnaire && (
        <CompteGestionnaire
          key={compagnieGestionnaire.id}
          compagnie={compagnieGestionnaire}
          onFermer={() => setGestionnaireOuvert(null)}
        />
      )}

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreRecherche
          label="Recherche"
          value={filtres.valeurs.q}
          onChange={(v) => filtres.set('q', v)}
          placeholder="Nom, email ou téléphone"
        />
        <FiltreSegments
          label="Statut"
          value={filtres.valeurs.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={[
            { valeur: '', label: 'Toutes' },
            { valeur: 'actif', label: `Actives (${actives})` },
            { valeur: 'en_attente', label: `À valider (${enAttente})` },
            { valeur: 'suspendu', label: `Suspendues (${suspendues})` },
          ]}
        />
        <FiltreSegments
          label="Abonnement"
          value={filtres.valeurs.abonnement}
          onChange={(v) => filtres.set('abonnement', v)}
          options={[
            { valeur: '', label: 'Tous' },
            { valeur: 'actif', label: 'Actif' },
            { valeur: 'aucun', label: 'Aucun' },
          ]}
        />
      </FiltresBar>

      <Card>
        <CardHeader title="Compagnies" right={`${compagniesFiltrees.length} / ${compagnies.length}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : compagnies.length === 0 ? (
          <TableMessage>Aucune compagnie enregistrée pour le moment.</TableMessage>
        ) : compagniesFiltrees.length === 0 ? (
          <TableMessage>Aucune compagnie ne correspond à ces filtres.</TableMessage>
        ) : (
          <Table minWidth="880px">
            <THead>
              <Th>Compagnie</Th>
              <Th>Contact</Th>
              <Th>Créée le</Th>
              <Th>Abonnement</Th>
              <Th>Statut</Th>
              <Th>Action</Th>
            </THead>
            <tbody>
              {compagniesFiltrees.map((c) => (
                <Fragment key={c.id}>
                <Tr>
                  {edite === c.id ? (
                    <>
                      <Td>
                        <Input value={champsEdit.nom} onChange={(e) => setChampsEdit({ ...champsEdit, nom: e.target.value })} className="!py-1 !text-xs" />
                      </Td>
                      <Td>
                        <Input
                          value={champsEdit.telephone}
                          onChange={(e) => setChampsEdit({ ...champsEdit, telephone: chiffresTelephone(e.target.value) })}
                          className="!py-1 !text-xs"
                          maxLength={10}
                        />
                      </Td>
                      <Td colSpan={2}>
                        <Input value={champsEdit.email} onChange={(e) => setChampsEdit({ ...champsEdit, email: e.target.value })} className="!py-1 !text-xs" placeholder="email" />
                      </Td>
                      <Td>
                        <Badge tone={BADGE_TONE[c.statut]}>{c.statut.replace('_', ' ')}</Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-3">
                          <Button variant="link-success" onClick={() => enregistrerEdition(c.id)} disabled={enCours === c.id}>
                            Enregistrer
                          </Button>
                          <button onClick={() => setEdite(null)} className="text-xs text-ink-faint hover:underline">
                            Annuler
                          </button>
                        </div>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td strong>
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2 text-[10px] font-semibold text-ink-faint">
                            {c.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
                            ) : (
                              c.nom.slice(0, 2).toUpperCase()
                            )}
                          </span>
                          {c.nom}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{c.telephone ? formatTelephone(c.telephone) : c.email || '—'}</Td>
                      <Td>{formatDate(c.dateCreation)}</Td>
                      <Td>
                        <Badge tone={abonnementActif(c.id) ? 'success' : 'warning'}>
                          {abonnementActif(c.id) ? 'actif' : 'aucun'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={BADGE_TONE[c.statut]}>{c.statut.replace('_', ' ')}</Badge>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="link" onClick={() => ouvrirEdition(c)}>Modifier</Button>
                          <Button
                            variant="link"
                            onClick={() => setGestionnaireOuvert(c.id)}
                          >
                            Compte gestionnaire
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => setDocsOuverts(docsOuverts === c.id ? null : c.id)}
                          >
                            Documents
                            {docsOuverts === c.id ? (
                              <ChevronUp className="h-3 w-3" strokeWidth={2} />
                            ) : (
                              <ChevronDown className="h-3 w-3" strokeWidth={2} />
                            )}
                          </Button>
                          {c.statut !== 'actif' && (
                            <Button variant="link-success" onClick={() => handleStatut(c.id, 'actif')} disabled={enCours === c.id}>
                              Activer
                            </Button>
                          )}
                          {c.statut !== 'suspendu' && (
                            <Button variant="link-danger" onClick={() => handleStatut(c.id, 'suspendu')} disabled={enCours === c.id}>
                              Suspendre
                            </Button>
                          )}
                        </div>
                      </Td>
                    </>
                  )}
                </Tr>
                {docsOuverts === c.id && (
                  <Tr>
                    <Td colSpan={6} className="bg-surface-2">
                      <DocumentsPanel compagnieId={c.id} peutTeleverser peutModerer />
                    </Td>
                  </Tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </DashboardShell>
  );
}
