'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { abonnementsApi } from '@/features/abonnements';
import type { Abonnement } from '@/features/abonnements';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { useAuthGuard } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { formatDate, formatFcfa } from '@/lib/format';
import { FiltresBar, FiltreRecherche, FiltreSegments } from '@/components/ui/Filtres';
import { normaliser, useFiltres } from '@/lib/filtres';

const CHAMPS_VIDES = { compagnieId: '', plan: '', montant: '', dateDebut: '', dateFin: '' };

type Filtres = { q: string; etat: '' | 'actif' | 'bientot' | 'expire' };
const FILTRES_DEFAUT: Filtres = { q: '', etat: '' };
const JOUR_MS = 86_400_000;

// État réel d'après les dates (le statut stocké peut rester « actif » après l'échéance).
function etatAbonnement(a: Abonnement): 'actif' | 'bientot' | 'expire' {
  const fin = new Date(a.dateFin).getTime();
  if (a.statut !== 'actif' || fin <= Date.now()) return 'expire';
  return fin - Date.now() <= 30 * JOUR_MS ? 'bientot' : 'actif';
}

const BADGE_TONE = {
  actif: 'success',
  expire: 'danger',
} as const;

export default function AdminAbonnementsPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [renouvellementId, setRenouvellementId] = useState<number | null>(null);
  const [nouvelleDateFin, setNouvelleDateFin] = useState('');
  const [renouvellementEnCours, setRenouvellementEnCours] = useState(false);
  const filtres = useFiltres<Filtres>(FILTRES_DEFAUT, 'q');

  function charger() {
    return abonnementsApi.listAll().then(setAbonnements).catch(() => setAbonnements([]));
  }

  useEffect(() => {
    if (!ready) return;
    setChargement(true);
    Promise.all([charger(), compagniesApi.list().then(setCompagnies).catch(() => setCompagnies([]))]).finally(() =>
      setChargement(false),
    );
  }, [ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (champs.dateFin <= champs.dateDebut) {
      setErreur('La date de fin doit être postérieure à la date de début.');
      return;
    }
    setEnvoi(true);
    try {
      await abonnementsApi.create({
        compagnieId: Number(champs.compagnieId),
        plan: champs.plan,
        montant: Number(champs.montant),
        dateDebut: champs.dateDebut,
        dateFin: champs.dateFin,
      });
      setChamps(CHAMPS_VIDES);
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement");
    } finally {
      setEnvoi(false);
    }
  }

  function ouvrirRenouvellement(a: Abonnement) {
    setRenouvellementId(a.id);
    setNouvelleDateFin('');
  }

  async function confirmerRenouvellement(a: Abonnement) {
    if (!nouvelleDateFin) return;
    if (nouvelleDateFin <= a.dateFin.slice(0, 10)) {
      alert(`La nouvelle date de fin doit être postérieure à l’échéance actuelle (${formatDate(a.dateFin)}).`);
      return;
    }
    const id = a.id;
    setRenouvellementEnCours(true);
    try {
      await abonnementsApi.renew(id, nouvelleDateFin);
      setRenouvellementId(null);
      await charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du renouvellement');
    } finally {
      setRenouvellementEnCours(false);
    }
  }

  if (!ready) return null;

  const fa = filtres.appliques;
  const abonnementsFiltres = abonnements.filter(
    (a) =>
      (!fa.etat || etatAbonnement(a) === fa.etat) &&
      (!fa.q.trim() || normaliser(`${a.compagnie?.nom ?? ''} ${a.plan}`).includes(normaliser(fa.q))),
  );

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Abonnements plateforme"
        subtitle="Créez et renouvelez les abonnements des compagnies partenaires."
      />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Créer un abonnement</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Compagnie">
              <Select required value={champs.compagnieId} onChange={(e) => setChamps({ ...champs, compagnieId: e.target.value })}>
                <option value="">Sélectionner...</option>
                {compagnies.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </Select>
            </Field>
            <Field label="Plan">
              <Input
                type="text"
                required
                placeholder="standard, premium..."
                value={champs.plan}
                onChange={(e) => setChamps({ ...champs, plan: e.target.value })}
              />
            </Field>
            <Field label="Montant (FCFA)">
              <Input
                type="number"
                min="0"
                required
                value={champs.montant}
                onChange={(e) => setChamps({ ...champs, montant: e.target.value })}
              />
            </Field>
            <Field label="Date de début">
              <Input
                type="date"
                required
                value={champs.dateDebut}
                onChange={(e) => setChamps({ ...champs, dateDebut: e.target.value })}
              />
            </Field>
            <Field label="Date de fin">
              <Input
                type="date"
                required
                value={champs.dateFin}
                onChange={(e) => setChamps({ ...champs, dateFin: e.target.value })}
              />
            </Field>
          </div>

          {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

          <Button type="submit" disabled={envoi} className="mt-4">
            {envoi ? 'Création...' : "Créer l'abonnement"}
          </Button>
        </form>
      </Card>

      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltreRecherche
          label="Recherche"
          value={filtres.valeurs.q}
          onChange={(v) => filtres.set('q', v)}
          placeholder="Compagnie ou plan"
        />
        <FiltreSegments
          label="État"
          value={filtres.valeurs.etat}
          onChange={(v) => filtres.set('etat', v)}
          options={[
            { valeur: '', label: 'Tous' },
            { valeur: 'actif', label: 'Actifs' },
            { valeur: 'bientot', label: 'Expirent sous 30 j' },
            { valeur: 'expire', label: 'Expirés' },
          ]}
        />
      </FiltresBar>

      <Card>
        <CardHeader title="Abonnements" right={`${abonnementsFiltres.length} / ${abonnements.length}`} />
        {chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : abonnements.length === 0 ? (
          <TableMessage>Aucun abonnement enregistré.</TableMessage>
        ) : abonnementsFiltres.length === 0 ? (
          <TableMessage>Aucun abonnement ne correspond à ces filtres.</TableMessage>
        ) : (
          <Table minWidth="820px">
            <THead>
              <Th>Compagnie</Th>
              <Th>Plan</Th>
              <Th>Montant</Th>
              <Th>Fin</Th>
              <Th>Statut</Th>
              <Th>Action</Th>
            </THead>
            <tbody>
              {abonnementsFiltres.map((a) => (
                <Tr key={a.id}>
                  <Td strong>{a.compagnie?.nom}</Td>
                  <Td>{a.plan}</Td>
                  <Td className="tabular-nums">{formatFcfa(a.montant)}</Td>
                  <Td>{formatDate(a.dateFin)}</Td>
                  <Td>
                    {etatAbonnement(a) === 'bientot' ? (
                      <Badge tone="warning">expire bientôt</Badge>
                    ) : etatAbonnement(a) === 'expire' ? (
                      <Badge tone="danger">expiré</Badge>
                    ) : (
                      <Badge tone={BADGE_TONE[a.statut as keyof typeof BADGE_TONE] || 'neutral'}>{a.statut}</Badge>
                    )}
                  </Td>
                  <Td>
                    {renouvellementId === a.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={nouvelleDateFin}
                          onChange={(e) => setNouvelleDateFin(e.target.value)}
                          className="rounded-lg border border-line px-2 py-1 text-xs focus:border-accent focus:outline-none"
                        />
                        <Button
                          variant="link-success"
                          onClick={() => confirmerRenouvellement(a)}
                          disabled={renouvellementEnCours || !nouvelleDateFin}
                        >
                          OK
                        </Button>
                        <button onClick={() => setRenouvellementId(null)} className="text-xs text-ink-faint hover:underline">
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <Button variant="link" onClick={() => ouvrirRenouvellement(a)}>
                        Renouveler
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
