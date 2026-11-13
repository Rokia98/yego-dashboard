'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Clock, FileText, Pencil, PauseCircle, Plus, Upload, UserCog } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ListePaginee } from '@/components/ui/Pagination';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import CompteGestionnaire from '@/components/compagnies/CompteGestionnaire';
import Modal, { ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
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

const LIBELLE_STATUT = {
  actif: 'Active',
  en_attente: 'À valider',
  suspendu: 'Suspendue',
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
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const [erreurEdit, setErreurEdit] = useState<string | null>(null);
  const [envoiEdit, setEnvoiEdit] = useState(false);
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

  async function handleStatut(c: Compagnie, statut: 'actif' | 'suspendu' | 'en_attente') {
    const id = c.id;
    if (
      statut === 'suspendu' &&
      !(await confirmer({
        titre: `Suspendre ${c.nom} ?`,
        message: 'Ses trajets ne seront plus proposés à la vente tant qu’elle reste suspendue.',
        libelleConfirmer: 'Suspendre',
        ton: 'danger',
      }))
    )
      return;
    setEnCours(id);
    try {
      await compagniesApi.updateStatut(id, statut);
      await charger();
      notifier.succes(
        statut === 'actif' ? `${c.nom} est activée.` : statut === 'suspendu' ? `${c.nom} est suspendue.` : `${c.nom} est remise en attente.`,
      );
    } catch (err) {
      notifier.erreur(err, 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  function ouvrirEdition(c: Compagnie) {
    setErreurEdit(null);
    setEdite(c.id);
    setChampsEdit({ nom: c.nom, telephone: chiffresTelephone(c.telephone ?? ''), email: c.email ?? '' });
  }

  async function enregistrerEdition(e: React.FormEvent) {
    e.preventDefault();
    if (edite == null) return;
    const id = edite;
    setErreurEdit(null);
    if (champsEdit.telephone && !estTelephoneValide(champsEdit.telephone)) {
      setErreurEdit('Le téléphone (WhatsApp) doit comporter 10 chiffres.');
      return;
    }
    setEnvoiEdit(true);
    try {
      await compagniesApi.update(id, {
        nom: champsEdit.nom,
        telephone: champsEdit.telephone ? telephonePourApi(champsEdit.telephone) : undefined,
        email: champsEdit.email || undefined,
      });
      setEdite(null);
      await charger();
      notifier.succes(`${champsEdit.nom} mise à jour.`);
    } catch (err) {
      setErreurEdit(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setEnvoiEdit(false);
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
        icone={Building2}
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

          <ErreurFormulaire>{erreur}</ErreurFormulaire>
          <PiedModal envoi={envoi} libelle="Créer la compagnie" libelleEnvoi="Création…" onAnnuler={fermerFormulaire} />
        </form>
      </Modal>

      <Modal
        ouvert={edite != null}
        icone={Building2}
        titre="Modifier la compagnie"
        sousTitre={compagnies.find((c) => c.id === edite)?.nom}
        onFermer={envoiEdit ? undefined : () => setEdite(null)}
      >
        <form onSubmit={enregistrerEdition}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom">
                <Input required value={champsEdit.nom} onChange={(e) => setChampsEdit({ ...champsEdit, nom: e.target.value })} />
              </Field>
            </div>
            <Field label="Téléphone WhatsApp (10 chiffres)">
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="0701020304"
                value={champsEdit.telephone}
                onChange={(e) => setChampsEdit({ ...champsEdit, telephone: chiffresTelephone(e.target.value) })}
              />
            </Field>
            <Field label="Email">
              <Input type="email" value={champsEdit.email} onChange={(e) => setChampsEdit({ ...champsEdit, email: e.target.value })} />
            </Field>
          </div>
          <ErreurFormulaire>{erreurEdit}</ErreurFormulaire>
          <PiedModal envoi={envoiEdit} libelle="Enregistrer" onAnnuler={() => setEdite(null)} />
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
          <ListePaginee items={compagniesFiltrees} cle={filtres.cle}>
            {(page) => (
          <Table minWidth="880px">
            <THead>
              <Th>Compagnie</Th>
              <Th>Téléphone</Th>
              <Th>Créée le</Th>
              <Th>Abonnement</Th>
              <Th>Statut</Th>
              <ThActions />
            </THead>
            <tbody>
              {page.map((c) => (
                <Fragment key={c.id}>
                <Tr attenue={c.statut === 'suspendu'} className={docsOuverts === c.id ? 'bg-accent-soft/40' : ''}>
                  <Td strong>
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-gradient-to-br from-accent-soft to-surface text-[11px] font-bold text-accent-ink">
                        {c.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logoUrl} alt="" className="h-full w-full bg-surface object-contain" />
                        ) : (
                          c.nom.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span>
                        {c.nom}
                        {c.email && <span className="block text-xs font-normal text-ink-faint">{c.email}</span>}
                      </span>
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">{c.telephone ? formatTelephone(c.telephone) : '—'}</Td>
                  <Td className="whitespace-nowrap">{formatDate(c.dateCreation)}</Td>
                  <Td>
                    <Badge tone={abonnementActif(c.id) ? 'success' : 'warning'}>
                      {abonnementActif(c.id) ? 'Actif' : 'Aucun'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={BADGE_TONE[c.statut]}>{LIBELLE_STATUT[c.statut]}</Badge>
                  </Td>
                  <TdActions>
                    <Actions>
                      {c.statut === 'en_attente' && (
                        <ActionIcone
                          icone={CheckCircle2}
                          label="Valider et activer"
                          ton="success"
                          chargement={enCours === c.id}
                          onClick={() => handleStatut(c, 'actif')}
                        />
                      )}
                      <ActionIcone icone={Pencil} label="Modifier" onClick={() => ouvrirEdition(c)} />
                      <ActionIcone
                        icone={FileText}
                        label={docsOuverts === c.id ? 'Masquer les documents' : 'Documents'}
                        ton={docsOuverts === c.id ? 'neutre' : 'info'}
                        onClick={() => setDocsOuverts(docsOuverts === c.id ? null : c.id)}
                      />
                      <MenuActions
                        disabled={enCours === c.id}
                        items={[
                          { label: 'Compte gestionnaire', icone: UserCog, ton: 'info', onClick: () => setGestionnaireOuvert(c.id) },
                          'separateur',
                          { label: 'Activer', icone: CheckCircle2, ton: 'success', onClick: () => handleStatut(c, 'actif'), masque: c.statut === 'actif' },
                          { label: 'Remettre en attente', icone: Clock, ton: 'warning', onClick: () => handleStatut(c, 'en_attente'), masque: c.statut === 'en_attente' },
                          { label: 'Suspendre', icone: PauseCircle, ton: 'danger', onClick: () => handleStatut(c, 'suspendu'), masque: c.statut === 'suspendu' },
                        ]}
                      />
                    </Actions>
                  </TdActions>
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
          </ListePaginee>
        )}
      </Card>
    </DashboardShell>
  );
}
