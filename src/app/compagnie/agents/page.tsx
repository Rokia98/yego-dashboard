'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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

export default function AgentsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [mdpVisible, setMdpVisible] = useState(false);

  function charger() {
    return agentsApi.list().then(setAgents).catch(() => setAgents([]));
  }

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    charger().finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setChamps(CHAMPS_VIDES);
      setMdpVisible(false);
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création de l'agent");
    } finally {
      setEnvoi(false);
    }
  }

  async function handleToggleActif(id: number, actif: boolean) {
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
            <Field label="Mot de passe">
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

          {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

          <Button type="submit" disabled={envoi} className="mt-4">
            {envoi ? 'Création...' : "Créer l'agent"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Agents de la compagnie" right={`${agents.length} agent${agents.length > 1 ? 's' : ''}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : agents.length === 0 ? (
          <TableMessage>Aucun agent enregistré.</TableMessage>
        ) : (
          <Table minWidth="640px">
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
                    {a.actif ? (
                      <Button variant="link-danger" onClick={() => handleToggleActif(a.id, false)} disabled={enCours === a.id}>
                        Désactiver
                      </Button>
                    ) : (
                      <Button variant="link-success" onClick={() => handleToggleActif(a.id, true)} disabled={enCours === a.id}>
                        Réactiver
                      </Button>
                    )}
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
