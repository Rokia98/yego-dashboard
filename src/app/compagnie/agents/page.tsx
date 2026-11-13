'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, RefreshCw, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone, MenuActions } from '@/components/ui/Actions';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Initiales from '@/components/ui/Initiales';
import { ListePaginee } from '@/components/ui/Pagination';
import Modal, { BoutonCreation, ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { agentsApi } from '@/features/agents';
import type { Agent } from '@/features/agents';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { chiffresTelephone, estTelephoneValide, formatTelephone, telephonePourApi } from '@/lib/telephone';
import { genererMotDePasse } from '@/lib/motdepasse';

const CHAMPS_VIDES = { nom: '', telephone: '', motDePasse: '', email: '' };

// Identifiants provisoires à transmettre à l'agent (affichés une seule fois).
type Identifiants = { nom: string; telephone: string; motDePasse: string; reinitialisation: boolean };

export default function AgentsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // undefined = fermée, null = création, nombre = modification de l'agent.
  const [edition, setEdition] = useState<number | null | undefined>(undefined);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [mdpVisible, setMdpVisible] = useState(false);
  const [identifiants, setIdentifiants] = useState<Identifiants | null>(null);
  const [copie, setCopie] = useState(false);

  function charger() {
    return agentsApi.list().then(setAgents).catch(() => setAgents([]));
  }

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    charger().finally(() => setChargement(false));
  }, [ready]);

  function ouvrir(a?: Agent) {
    setErreur(null);
    setMdpVisible(false);
    setChamps(a ? { nom: a.nom, telephone: chiffresTelephone(a.telephone), motDePasse: '', email: a.email ?? '' } : CHAMPS_VIDES);
    setEdition(a?.id ?? null);
  }

  function fermer() {
    setEdition(undefined);
    setErreur(null);
    setMdpVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (edition === undefined) return;
    setErreur(null);
    if (!estTelephoneValide(champs.telephone)) {
      setErreur('Le numéro doit comporter 10 chiffres.');
      return;
    }
    setEnvoi(true);
    try {
      if (edition === null) {
        await agentsApi.create({
          nom: champs.nom.trim(),
          telephone: telephonePourApi(champs.telephone),
          motDePasse: champs.motDePasse,
          email: champs.email.trim() || undefined,
        });
        afficherIdentifiants({ nom: champs.nom, telephone: champs.telephone, motDePasse: champs.motDePasse, reinitialisation: false });
      } else {
        await agentsApi.update(edition, {
          nom: champs.nom.trim(),
          telephone: telephonePourApi(champs.telephone),
          email: champs.email.trim() || undefined,
        });
        notifier.succes(`Agent ${champs.nom.trim()} mis à jour.`);
      }
      fermer();
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'agent");
    } finally {
      setEnvoi(false);
    }
  }

  function afficherIdentifiants(i: Identifiants) {
    setIdentifiants(i);
    setCopie(false);
  }

  async function copierIdentifiants() {
    if (!identifiants) return;
    const txt = `Yègo — accès guichet
Téléphone : ${formatTelephone(identifiants.telephone)}
Mot de passe provisoire : ${identifiants.motDePasse}
(à changer à la première connexion)`;
    try {
      await navigator.clipboard.writeText(txt);
      setCopie(true);
    } catch {
      notifier.erreur('Copie impossible : sélectionnez le texte manuellement.');
    }
  }

  async function handleReinitialiser(a: Agent) {
    const ok = await confirmer({
      titre: `Réinitialiser le mot de passe de ${a.nom} ?`,
      message: 'Un mot de passe provisoire sera généré et l’agent sera déconnecté de tous ses appareils.',
      libelleConfirmer: 'Réinitialiser',
      ton: 'warning',
    });
    if (!ok) return;
    const motDePasse = genererMotDePasse();
    setEnCours(a.id);
    try {
      await agentsApi.update(a.id, { motDePasse });
      afficherIdentifiants({ nom: a.nom, telephone: a.telephone, motDePasse, reinitialisation: true });
    } catch (err) {
      notifier.erreur(err, 'Erreur lors de la réinitialisation');
    } finally {
      setEnCours(null);
    }
  }

  async function handleToggleActif(a: Agent, actif: boolean) {
    if (
      !actif &&
      !(await confirmer({
        titre: `Désactiver ${a.nom} ?`,
        message: 'Il sera déconnecté de tous ses appareils et ne pourra plus vendre au guichet.',
        libelleConfirmer: 'Désactiver',
        ton: 'danger',
      }))
    )
      return;
    setEnCours(a.id);
    try {
      await agentsApi.update(a.id, { actif });
      await charger();
      notifier.succes(actif ? `${a.nom} est réactivé.` : `${a.nom} est désactivé.`);
    } catch (err) {
      notifier.erreur(err, 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  const actifs = agents.filter((a) => a.actif).length;
  const enModification = edition != null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Agents guichet"
        subtitle="Le personnel autorisé à vendre au comptoir pour votre compagnie."
        right={agents.length > 0 ? `${actifs} actif${actifs > 1 ? 's' : ''} sur ${agents.length}` : undefined}
      />

      <BoutonCreation label="Ajouter un agent" onClick={() => ouvrir()} />

      <Modal
        ouvert={edition !== undefined}
        icone={enModification ? Pencil : UserPlus}
        titre={enModification ? 'Modifier l’agent' : 'Ajouter un agent'}
        sousTitre={enModification ? 'Pour changer son mot de passe, utilisez « Réinitialiser le mot de passe ».' : undefined}
        onFermer={envoi ? undefined : fermer}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input type="text" required value={champs.nom} onChange={(e) => setChamps({ ...champs, nom: e.target.value })} />
            </Field>
            <Field label="Téléphone (10 chiffres)">
              <Input
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                placeholder="0701020304"
                value={champs.telephone}
                onChange={(e) => setChamps({ ...champs, telephone: chiffresTelephone(e.target.value) })}
              />
            </Field>
            {!enModification && (
              <Field label="Mot de passe provisoire">
                <div className="flex gap-2">
                  <Input
                    type={mdpVisible ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={champs.motDePasse}
                    onChange={(e) => setChamps({ ...champs, motDePasse: e.target.value })}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setChamps((c) => ({ ...c, motDePasse: genererMotDePasse() }));
                      setMdpVisible(true);
                    }}
                    className="!px-3"
                    title="Générer"
                    aria-label="Générer un mot de passe"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setMdpVisible((v) => !v)}
                    className="!px-3"
                    title={mdpVisible ? 'Masquer' : 'Afficher'}
                    aria-label={mdpVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {mdpVisible ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                  </Button>
                </div>
              </Field>
            )}
            <Field label="Email (optionnel)">
              <Input type="email" value={champs.email} onChange={(e) => setChamps({ ...champs, email: e.target.value })} />
            </Field>
          </div>

          {!enModification && (
            <p className="mt-3 text-xs text-ink-faint">L’agent changera ce mot de passe provisoire à sa première connexion.</p>
          )}
          <ErreurFormulaire>{erreur}</ErreurFormulaire>

          <PiedModal envoi={envoi} libelle={enModification ? 'Enregistrer' : "Créer l'agent"} onAnnuler={fermer} />
        </form>
      </Modal>

      <Modal
        ouvert={identifiants != null}
        icone={KeyRound}
        titre={identifiants?.reinitialisation ? 'Mot de passe réinitialisé' : 'Agent créé'}
        sousTitre="Transmettez ces identifiants à l’agent : ils ne seront plus affichés."
        onFermer={() => setIdentifiants(null)}
        largeur="max-w-md"
      >
        {identifiants && (
          <>
            <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-accent-ink">{identifiants.nom}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Téléphone</dt>
                  <dd className="font-semibold text-ink">{formatTelephone(identifiants.telephone)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Mot de passe provisoire</dt>
                  <dd className="font-mono font-semibold text-ink">{identifiants.motDePasse}</dd>
                </div>
              </dl>
            </div>
            {identifiants.reinitialisation && (
              <p className="mt-3 text-xs text-ink-faint">L’agent a été déconnecté de ses appareils.</p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setIdentifiants(null)}>
                Fermer
              </Button>
              <Button onClick={copierIdentifiants}>
                {copie ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                {copie ? 'Copié' : 'Copier les identifiants'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Card>
        <CardHeader title="Agents de la compagnie" right={`${agents.length} agent${agents.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : agents.length === 0 ? (
          <TableMessage icone={Users}>Aucun agent enregistré.</TableMessage>
        ) : (
          <ListePaginee items={agents}>
            {(page) => (
              <Table minWidth="720px">
                <THead>
                  <Th>Agent</Th>
                  <Th>Téléphone</Th>
                  <Th>Email</Th>
                  <Th>Statut</Th>
                  <ThActions />
                </THead>
                <tbody>
                  {page.map((a) => (
                    <Tr key={a.id} attenue={!a.actif}>
                      <Td strong>
                        <span className="flex items-center gap-2.5">
                          <Initiales nom={a.nom} />
                          {a.nom}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{formatTelephone(a.telephone)}</Td>
                      <Td>{a.email || '—'}</Td>
                      <Td>
                        <Badge tone={a.actif ? 'success' : 'danger'}>{a.actif ? 'Actif' : 'Désactivé'}</Badge>
                      </Td>
                      <TdActions>
                        <Actions>
                          <ActionIcone icone={Pencil} label="Modifier" ton="accent" onClick={() => ouvrir(a)} disabled={enCours === a.id} />
                          {a.actif ? (
                            <ActionIcone
                              icone={KeyRound}
                              label="Réinitialiser le mot de passe"
                              ton="warning"
                              chargement={enCours === a.id}
                              onClick={() => handleReinitialiser(a)}
                            />
                          ) : (
                            <ActionIcone
                              icone={UserCheck}
                              label="Réactiver"
                              ton="success"
                              chargement={enCours === a.id}
                              onClick={() => handleToggleActif(a, true)}
                            />
                          )}
                          <MenuActions
                            disabled={enCours === a.id}
                            items={[
                              { label: 'Désactiver l’agent', icone: UserX, ton: 'danger', onClick: () => handleToggleActif(a, false), masque: !a.actif },
                              { label: 'Réactiver l’agent', icone: UserCheck, ton: 'success', onClick: () => handleToggleActif(a, true), masque: a.actif },
                            ]}
                          />
                        </Actions>
                      </TdActions>
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
