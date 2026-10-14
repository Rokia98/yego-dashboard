'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCog } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Field';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import { FiltresBar, FiltreRecherche, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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

/** Édition du rôle et de la compagnie de rattachement (PATCH /utilisateurs/:id/role). */
function EditionRole({
  u,
  compagnies,
  onEnregistre,
  onAnnuler,
}: {
  u: Utilisateur;
  compagnies: Compagnie[];
  onEnregistre: (maj: Utilisateur) => void;
  onAnnuler: () => void;
}) {
  const [role, setRole] = useState<UserRole>(u.role);
  const [compagnieId, setCompagnieId] = useState(u.compagnieId != null ? String(u.compagnieId) : '');
  const [envoi, setEnvoi] = useState(false);
  const lie = ROLES_LIES_COMPAGNIE.includes(role);

  async function enregistrer() {
    if (lie && !compagnieId) return alert('Choisissez la compagnie de rattachement.');
    const compagnie = compagnies.find((c) => String(c.id) === compagnieId)?.nom;
    if (
      !confirm(
        `Passer ${u.nom} en « ${LIBELLE_ROLE[role]} »${lie && compagnie ? ` chez ${compagnie}` : ''} ?\n` +
          'Ses sessions en cours seront fermées.',
      )
    )
      return;
    setEnvoi(true);
    try {
      const maj = await utilisateursApi.setRole(u.id, { role, ...(lie ? { compagnieId: Number(compagnieId) } : {}) });
      onEnregistre(maj);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de rôle');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="!w-40 !py-1.5 text-xs">
        {ROLES.map((r) => (
          <option key={r.valeur} value={r.valeur}>
            {r.label}
          </option>
        ))}
      </Select>
      {lie && (
        <Select value={compagnieId} onChange={(e) => setCompagnieId(e.target.value)} className="!w-48 !py-1.5 text-xs">
          <option value="">Compagnie…</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </Select>
      )}
      <Button variant="link-success" onClick={enregistrer} disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
      <Button variant="link" onClick={onAnnuler} disabled={envoi}>
        Annuler
      </Button>
    </div>
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
                    <Th>{''}</Th>
                  </THead>
                  <tbody>
                    {liste.pageItems.map((u) => (
                      <Tr key={u.id}>
                        <Td strong>
                          {u.nom}
                          <span className="block text-xs font-normal text-ink-faint">
                            #{u.id}
                            {u.email ? ` · ${u.email}` : ''}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap">{formatTelephone(u.telephone)}</Td>
                        {edition === u.id ? (
                          <Td colSpan={2}>
                            <EditionRole
                              u={u}
                              compagnies={compagnies}
                              onAnnuler={() => setEdition(null)}
                              onEnregistre={(maj) => {
                                const compagnie = compagnies.find((c) => c.id === maj.compagnieId);
                                liste.fusionner((x) => x.id === u.id, {
                                  ...u,
                                  ...maj,
                                  compagnie: compagnie ? { id: compagnie.id, nom: compagnie.nom } : null,
                                });
                                setEdition(null);
                              }}
                            />
                          </Td>
                        ) : (
                          <>
                            <Td>
                              <Badge tone={TONE_ROLE[u.role] ?? 'neutral'}>{LIBELLE_ROLE[u.role] ?? u.role}</Badge>
                            </Td>
                            <Td>{u.compagnie?.nom ?? (u.compagnieId != null ? `Compagnie #${u.compagnieId}` : '—')}</Td>
                          </>
                        )}
                        <Td>
                          {u.actif ? <Badge tone="success">Actif</Badge> : <Badge tone="danger">Désactivé</Badge>}
                          {u.doitChangerMotDePasse && (
                            <span className="mt-1 block text-xs text-warning">Mot de passe provisoire</span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">{formatDate(u.dateCreation)}</Td>
                        <Td className="whitespace-nowrap">
                          {edition !== u.id && u.id !== user?.userId && (
                            <Button variant="link" onClick={() => setEdition(u.id)}>
                              Modifier le rôle
                            </Button>
                          )}
                        </Td>
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
