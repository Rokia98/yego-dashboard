'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, CreditCard } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone } from '@/components/ui/Actions';
import { useNotifier } from '@/components/ui/Dialogues';
import { Field, Input, Select } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import { ListePaginee } from '@/components/ui/Pagination';
import Modal, { BoutonCreation, ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
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

/** Date ISO (AAAA-MM-JJ) décalée de `mois` mois à partir de `base`. */
function plusMois(base: string, mois: number): string {
  const d = new Date(`${base.slice(0, 10)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString().slice(0, 10);
}

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
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const [renouvellementId, setRenouvellementId] = useState<number | null>(null);
  const [nouvelleDateFin, setNouvelleDateFin] = useState('');
  const [renouvellementEnCours, setRenouvellementEnCours] = useState(false);
  const [erreurRenouvellement, setErreurRenouvellement] = useState<string | null>(null);
  const notifier = useNotifier();
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
      setFormulaireOuvert(false);
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement");
    } finally {
      setEnvoi(false);
    }
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setErreur(null);
    setChamps(CHAMPS_VIDES);
  }

  function ouvrirRenouvellement(a: Abonnement) {
    setRenouvellementId(a.id);
    setErreurRenouvellement(null);
    // Par défaut : un an après l'échéance actuelle (ou après aujourd'hui si déjà expiré).
    setNouvelleDateFin(plusMois(baseRenouvellement(a), 12));
  }

  function baseRenouvellement(a: Abonnement): string {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const fin = a.dateFin.slice(0, 10);
    return fin > aujourdhui ? fin : aujourdhui;
  }

  async function confirmerRenouvellement(e: React.FormEvent) {
    e.preventDefault();
    const a = abonnements.find((x) => x.id === renouvellementId);
    if (!a || !nouvelleDateFin) return;
    setErreurRenouvellement(null);
    if (nouvelleDateFin <= a.dateFin.slice(0, 10)) {
      setErreurRenouvellement(`La nouvelle date de fin doit être postérieure à l’échéance actuelle (${formatDate(a.dateFin)}).`);
      return;
    }
    const id = a.id;
    setRenouvellementEnCours(true);
    try {
      await abonnementsApi.renew(id, nouvelleDateFin);
      setRenouvellementId(null);
      await charger();
      notifier.succes(`Abonnement de ${a.compagnie?.nom ?? 'la compagnie'} prolongé jusqu’au ${formatDate(nouvelleDateFin)}.`);
    } catch (err) {
      setErreurRenouvellement(err instanceof Error ? err.message : 'Erreur lors du renouvellement');
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

      <BoutonCreation label="Créer un abonnement" onClick={() => setFormulaireOuvert(true)} />

      <Modal ouvert={formulaireOuvert} icone={CreditCard} titre="Créer un abonnement" onFermer={envoi ? undefined : fermerFormulaire}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <ErreurFormulaire>{erreur}</ErreurFormulaire>

          <PiedModal envoi={envoi} libelle="Créer l'abonnement" onAnnuler={fermerFormulaire} />
        </form>
      </Modal>

      {(() => {
        const a = abonnements.find((x) => x.id === renouvellementId);
        if (!a) return null;
        const base = baseRenouvellement(a);
        return (
          <Modal
            ouvert
            icone={CalendarPlus}
            titre="Renouveler l’abonnement"
            sousTitre={`${a.compagnie?.nom ?? 'Compagnie'} · plan ${a.plan}`}
            onFermer={renouvellementEnCours ? undefined : () => setRenouvellementId(null)}
            largeur="max-w-lg"
          >
            <form onSubmit={confirmerRenouvellement}>
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-3 text-sm">
                <div>
                  <p className="text-xs text-ink-faint">Échéance actuelle</p>
                  <p className="font-medium text-ink">{formatDate(a.dateFin)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Nouvelle échéance</p>
                  <p className="font-semibold text-accent-ink">{nouvelleDateFin ? formatDate(nouvelleDateFin) : '—'}</p>
                </div>
              </div>
              <p className="mb-2 text-xs font-medium text-ink-soft">Prolonger de</p>
              <div className="mb-4 grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((m) => {
                  const cible = plusMois(base, m);
                  const actif = nouvelleDateFin === cible;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNouvelleDateFin(cible)}
                      className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                        actif
                          ? 'border-accent bg-accent text-white shadow-subtle'
                          : 'border-line bg-surface text-ink-soft hover:border-accent/50 hover:text-accent-ink'
                      }`}
                    >
                      {m === 12 ? '1 an' : `${m} mois`}
                    </button>
                  );
                })}
              </div>
              <Field label="Ou choisir une date de fin">
                <Input type="date" required value={nouvelleDateFin} onChange={(e) => setNouvelleDateFin(e.target.value)} />
              </Field>
              <ErreurFormulaire>{erreurRenouvellement}</ErreurFormulaire>
              <PiedModal envoi={renouvellementEnCours} libelle="Renouveler" onAnnuler={() => setRenouvellementId(null)} />
            </form>
          </Modal>
        );
      })()}

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
          <ListePaginee items={abonnementsFiltres} cle={filtres.cle}>
            {(page) => (
          <Table minWidth="820px">
            <THead>
              <Th>Compagnie</Th>
              <Th>Plan</Th>
              <Th align="right">Montant</Th>
              <Th>Fin</Th>
              <Th>Statut</Th>
              <ThActions />
            </THead>
            <tbody>
              {page.map((a) => (
                <Tr key={a.id} attenue={etatAbonnement(a) === 'expire'}>
                  <Td strong>{a.compagnie?.nom}</Td>
                  <Td>
                    <span className="rounded-md bg-chart-1/10 px-2 py-0.5 text-xs font-semibold capitalize text-chart-1">{a.plan}</span>
                  </Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums font-medium text-ink">{formatFcfa(a.montant)}</Td>
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
                  <TdActions>
                    <Actions>
                      <ActionIcone
                        icone={CalendarPlus}
                        label="Renouveler"
                        ton={etatAbonnement(a) === 'actif' ? 'accent' : 'success'}
                        onClick={() => ouvrirRenouvellement(a)}
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
