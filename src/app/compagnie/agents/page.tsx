'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, X } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!estTelephoneValide(champs.telephone)) {
      setErreur('Le numéro doit comporter 10 chiffres.');
      return;
    }
    setEnvoi(true);
    try {
      await agentsApi.create({
        nom: champs.nom,
        telephone: telephonePourApi(champs.telephone),
        motDePasse: champs.motDePasse,
        email: champs.email || undefined,
      });
      afficherIdentifiants({ nom: champs.nom, telephone: champs.telephone, motDePasse: champs.motDePasse, reinitialisation: false });
      setChamps(CHAMPS_VIDES);
      setMdpVisible(false);
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création de l'agent");
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
      alert(txt);
    }
  }

  async function handleReinitialiser(a: Agent) {
    if (
      !confirm(
        `Réinitialiser le mot de passe de ${a.nom} ?
` +
          'Un mot de passe provisoire sera généré et l’agent sera déconnecté de tous ses appareils.',
      )
    )
      return;
    const motDePasse = genererMotDePasse();
    setEnCours(a.id);
    try {
      await agentsApi.update(a.id, { motDePasse });
      afficherIdentifiants({ nom: a.nom, telephone: a.telephone, motDePasse, reinitialisation: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setEnCours(null);
    }
  }

  async function handleToggleActif(id: number, actif: boolean) {
    if (!actif && !confirm('Désactiver cet agent ? Il sera déconnecté de tous ses appareils.')) return;
    setEnCours(id);
    try {
      await agentsApi.update(id, { actif });
      await charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setEnCours(null);
    }
  }

  if (!ready) return null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader eyebrow="Espace opérateur" title="Agents guichet" subtitle="Le personnel autorisé à vendre au comptoir pour votre compagnie." />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Ajouter un agent</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                >
                  ⟳
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
            <Field label="Email (optionnel)">
              <Input type="email" value={champs.email} onChange={(e) => setChamps({ ...champs, email: e.target.value })} />
            </Field>
          </div>

          <p className="mt-3 text-xs text-ink-faint">L’agent changera ce mot de passe provisoire à sa première connexion.</p>
          {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

          <Button type="submit" disabled={envoi} className="mt-4">
            {envoi ? 'Création...' : "Créer l'agent"}
          </Button>
        </form>
      </Card>

      {identifiants && (
        <Card className="mb-6 border-accent/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {identifiants.reinitialisation ? 'Mot de passe réinitialisé' : 'Agent créé'} — {identifiants.nom}
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                Transmettez ces identifiants à l’agent : ils ne seront plus affichés.
                {identifiants.reinitialisation && ' L’agent a été déconnecté de ses appareils.'}
              </p>
              <p className="mt-3 text-sm text-ink">
                Téléphone : <span className="font-semibold">{formatTelephone(identifiants.telephone)}</span>
                <br />
                Mot de passe provisoire : <span className="font-mono font-semibold">{identifiants.motDePasse}</span>
              </p>
            </div>
            <Button variant="ghost" onClick={() => setIdentifiants(null)} aria-label="Fermer" className="!px-2">
              <X className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
          <Button variant="secondary" onClick={copierIdentifiants} className="mt-4">
            {copie ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
            {copie ? 'Copié' : 'Copier les identifiants'}
          </Button>
        </Card>
      )}

      <Card>
        <CardHeader title="Agents de la compagnie" right={`${agents.length} agent${agents.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : agents.length === 0 ? (
          <TableMessage>Aucun agent enregistré.</TableMessage>
        ) : (
          <Table minWidth="760px">
            <THead>
              <Th>Nom</Th>
              <Th>Téléphone</Th>
              <Th>Email</Th>
              <Th>Statut</Th>
              <Th>Action</Th>
            </THead>
            <tbody>
              {agents.map((a) => (
                <Tr key={a.id}>
                  <Td strong>{a.nom}</Td>
                  <Td>{formatTelephone(a.telephone)}</Td>
                  <Td>{a.email || '—'}</Td>
                  <Td>
                    <Badge tone={a.actif ? 'success' : 'neutral'}>{a.actif ? 'actif' : 'désactivé'}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-3">
                      {a.actif && (
                        <Button variant="link" onClick={() => handleReinitialiser(a)} disabled={enCours === a.id}>
                          Réinitialiser le mot de passe
                        </Button>
                      )}
                      {a.actif ? (
                        <Button variant="link-danger" onClick={() => handleToggleActif(a.id, false)} disabled={enCours === a.id}>
                          Désactiver
                        </Button>
                      ) : (
                        <Button variant="link-success" onClick={() => handleToggleActif(a.id, true)} disabled={enCours === a.id}>
                          Réactiver
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </DashboardShell>
  );
}
