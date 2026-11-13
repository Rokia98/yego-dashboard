'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, UserCog } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, Select } from '@/components/ui/Field';
import { Table, THead, Th, ThActions, Tr, Td, TdActions, TableMessage } from '@/components/ui/Table';
import { Actions, ActionIcone } from '@/components/ui/Actions';
import Modal, { ErreurFormulaire, PiedModal } from '@/components/ui/Modal';
import Initiales from '@/components/ui/Initiales';
import { useConfirmer, useNotifier } from '@/components/ui/Dialogues';
import { FiltresBar, FiltreRecherche, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import BientotDisponible from '@/components/ui/BientotDisponible';
import { utilisateursApi, LIBELLE_ROLE, ROLES, ROLES_LIES_COMPAGNIE } from '@/features/utilisateurs';
import type { Utilisateur } from '@/features/utilisateurs';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { useAuthGuard, type UserRole } from '@/lib/auth';
import { ADMIN_NAV } from '@/lib/nav';
import { LISTE_UTILISATEURS } from '@/lib/capacites';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { formatDate } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';

type Filtres = { q: string; role: UserRole | ''; compagnieId: string; actif: '' | 'true' | 'false' };
const DEFAUTS: Filtres = { q: '', role: '', compagnieId: '', actif: '' };

const OPTIONS_ACTIF = [
  { valeur: '' as const, label: 'Tous' },
  { valeur: 'true' as const, label: 'Actifs' },
  { valeur: 'false' as const, label: 'Désactivés' },
];

const TONE_ROLE: Record<UserRole, 'neutral' | 'accent' | 'success' | 'warning'> = {
  user: 'neutral',
  agent: 'accent',
  company_admin: 'success',
  admin: 'warning',
};

/** Modale d'édition du rôle et de la compagnie de rattachement (PATCH /utilisateurs/:id/role). */
function EditionRole({
  u,
  compagnies,
  onEnregistre,
  onFermer,
}: {
  u: Utilisateur;
  compagnies: Compagnie[];
  onEnregistre: (maj: Utilisateur) => void;
  onFermer: () => void;
}) {
  const confirmer = useConfirmer();
  const notifier = useNotifier();
  const [role, setRole] = useState<UserRole>(u.role);
  const [compagnieId, setCompagnieId] = useState(u.compagnieId != null ? String(u.compagnieId) : '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const lie = ROLES_LIES_COMPAGNIE.includes(role);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (lie && !compagnieId) return setErreur('Choisissez la compagnie de rattachement.');
    const compagnie = compagnies.find((c) => String(c.id) === compagnieId)?.nom;
    const ok = await confirmer({
      titre: 'Confirmer le changement de rôle',
      message: `${u.nom} passera en « ${LIBELLE_ROLE[role]} »${lie && compagnie ? ` chez ${compagnie}` : ''}.\nSes sessions en cours seront fermées.`,
      libelleConfirmer: 'Changer le rôle',
      ton: 'warning',
    });
    if (!ok) return;
    setEnvoi(true);
    try {
      const maj = await utilisateursApi.setRole(u.id, { role, ...(lie ? { compagnieId: Number(compagnieId) } : {}) });
      notifier.succes(`${u.nom} est maintenant « ${LIBELLE_ROLE[role]} ».`);
      onEnregistre(maj);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors du changement de rôle');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      ouvert
      icone={ShieldCheck}
      titre="Modifier le rôle"
      sousTitre={`${u.nom} · ${formatTelephone(u.telephone)}`}
      onFermer={envoi ? undefined : onFermer}
      largeur="max-w-lg"
    >
      <form onSubmit={enregistrer}>
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-soft">
          Rôle actuel :
          <Badge tone={TONE_ROLE[u.role] ?? 'neutral'}>{LIBELLE_ROLE[u.role] ?? u.role}</Badge>
          {u.compagnie?.nom && <span className="text-ink-faint">chez {u.compagnie.nom}</span>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nouveau rôle">
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {ROLES.map((r) => (
                <option key={r.valeur} value={r.valeur}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          {lie && (
            <Field label="Compagnie de rattachement">
              <Select required value={compagnieId} onChange={(e) => setCompagnieId(e.target.value)}>
                <option value="">Choisir…</option>
                {compagnies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <ErreurFormulaire>{erreur}</ErreurFormulaire>
        <PiedModal envoi={envoi} libelle="Enregistrer" onAnnuler={onFermer} />
      </form>
    </Modal>
  );
}

export default function AdminUtilisateursPage() {
  const { user, ready } = useAuthGuard(['admin']);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [edition, setEdition] = useState<number | null>(null);
  const filtres = useFiltres<Filtres>(DEFAUTS, 'q');
  const { q, role, compagnieId, actif } = filtres.appliques;

  useEffect(() => {
    if (!ready || !LISTE_UTILISATEURS) return;
    compagniesApi
      .list()
      .then(setCompagnies)
      .catch(() => setCompagnies([]));
  }, [ready]);

  const fetcher = useCallback(
    async ({ take, skip }: { take: number; skip: number }) => {
      const r = await utilisateursApi.list({
        take,
        skip,
        q,
        role,
        compagnieId: compagnieId ? Number(compagnieId) : null,
        actif: actif === '' ? null : actif === 'true',
      });
      setTotal(r.total);
      return r.items;
    },
    [q, role, compagnieId, actif],
  );
  const liste = usePagedList<Utilisateur>(fetcher, ready && LISTE_UTILISATEURS ? filtres.cle : 'wait', 20, { total });

  const optionsCompagnies = useMemo(
    () => compagnies.map((c) => ({ valeur: String(c.id), label: c.nom })),
    [compagnies],
  );

  if (!ready) return null;

  const utilisateurEdite = edition != null ? liste.items.find((x) => x.id === edition) ?? null : null;
  const compteur =
    total != null ? `${liste.items.length} / ${total.toLocaleString('fr-FR')}` : `${liste.items.length} affiché${liste.items.length > 1 ? 's' : ''}`;

  return (
    <DashboardShell nav={ADMIN_NAV} title="Administration Yègo" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Centre de contrôle"
        title="Utilisateurs"
        subtitle="Tous les comptes : voyageurs, agents, gestionnaires et équipe Yègo."
        right={total != null ? `${total.toLocaleString('fr-FR')} compte${total > 1 ? 's' : ''}` : undefined}
      />

      {!LISTE_UTILISATEURS ? (
        <BientotDisponible
          icon={UserCog}
          titre="Liste des utilisateurs en cours de déploiement"
          texte="L’écran est prêt ; il s’activera dès que la version de l’API qui filtre les utilisateurs sera en ligne."
        />
      ) : (
        <>
          <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
            <FiltreRecherche
              label="Recherche"
              value={filtres.valeurs.q}
              onChange={(v) => filtres.set('q', v)}
              placeholder="Nom, téléphone ou email"
            />
            <FiltreSelect label="Rôle" value={filtres.valeurs.role} onChange={(v) => filtres.set('role', v)} options={ROLES} />
            <FiltreSelect
              label="Compagnie"
              value={filtres.valeurs.compagnieId}
              onChange={(v) => filtres.set('compagnieId', v)}
              options={optionsCompagnies}
              tous="Toutes"
            />
            <FiltreSegments label="État" value={filtres.valeurs.actif} onChange={(v) => filtres.set('actif', v)} options={OPTIONS_ACTIF} />
          </FiltresBar>

          {utilisateurEdite && (
            <EditionRole
              key={utilisateurEdite.id}
              u={utilisateurEdite}
              compagnies={compagnies}
              onFermer={() => setEdition(null)}
              onEnregistre={(maj) => {
                const u = utilisateurEdite;
                const compagnie = compagnies.find((c) => c.id === maj.compagnieId);
                liste.fusionner((x) => x.id === u.id, {
                  ...u,
                  ...maj,
                  compagnie: compagnie ? { id: compagnie.id, nom: compagnie.nom } : null,
                });
                setEdition(null);
              }}
            />
          )}

          <Card>
            <CardHeader title="Comptes" right={compteur} />
            {liste.chargement ? (
              <TableMessage>Chargement...</TableMessage>
            ) : liste.erreur ? (
              <TableMessage>{liste.erreur}</TableMessage>
            ) : liste.items.length === 0 ? (
              <TableMessage>{filtres.nbActifs > 0 ? 'Aucun utilisateur pour ces filtres.' : 'Aucun utilisateur.'}</TableMessage>
            ) : (
              <>
                <Table minWidth="980px">
                  <THead>
                    <Th>Utilisateur</Th>
                    <Th>Téléphone</Th>
                    <Th>Rôle</Th>
                    <Th>Compagnie</Th>
                    <Th>État</Th>
                    <Th>Créé le</Th>
                    <ThActions />
                  </THead>
                  <tbody>
                    {liste.pageItems.map((u) => (
                      <Tr key={u.id} attenue={!u.actif}>
                        <Td strong>
                          <span className="flex items-center gap-2.5">
                            <Initiales nom={u.nom} />
                            <span>
                              {u.nom}
                              <span className="block text-xs font-normal text-ink-faint">
                                #{u.id}
                                {u.email ? ` · ${u.email}` : ''}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap">{formatTelephone(u.telephone)}</Td>
                        <Td>
                          <Badge tone={TONE_ROLE[u.role] ?? 'neutral'}>{LIBELLE_ROLE[u.role] ?? u.role}</Badge>
                        </Td>
                        <Td>{u.compagnie?.nom ?? (u.compagnieId != null ? `Compagnie #${u.compagnieId}` : '—')}</Td>
                        <Td>
                          {u.actif ? <Badge tone="success">Actif</Badge> : <Badge tone="danger">Désactivé</Badge>}
                          {u.doitChangerMotDePasse && (
                            <span className="mt-1 block text-xs text-warning">Mot de passe provisoire</span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">{formatDate(u.dateCreation)}</Td>
                        <TdActions>
                          <Actions>
                            {u.id !== user?.userId && (
                              <ActionIcone icone={ShieldCheck} label="Modifier le rôle" onClick={() => setEdition(u.id)} />
                            )}
                          </Actions>
                        </TdActions>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination pagination={liste.pagination} />
              </>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
