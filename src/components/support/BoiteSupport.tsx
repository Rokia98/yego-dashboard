'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { FiltresBar, FiltreRecherche, FiltreSegments, FiltreSelect } from '@/components/ui/Filtres';
import FilSupport from './FilSupport';
import NouvelleDemande from './NouvelleDemande';
import {
  supportApi,
  FILTRES_SUPPORT_DEFAUT,
  CATEGORIES_SUPPORT,
  LIBELLE_STATUT_SUPPORT,
  TONE_STATUT_SUPPORT,
  libelleCategorie,
  libelleRole,
  gestionnaireSupport,
} from '@/features/support';
import type { DemandeSupport, FiltresSupport } from '@/features/support';
import { compagniesApi } from '@/features/compagnies';
import { usePagedList } from '@/lib/pagination';
import { useFiltres } from '@/lib/filtres';
import { formatDateHeure } from '@/lib/format';
import type { AuthUser } from '@/lib/auth';

type Props = {
  espace: 'admin' | 'compagnie';
  user: AuthUser | null;
};

// Gestionnaire (SUPPORT_COMPAGNIE) : onglet « Demandes des voyageurs » par défaut.
const FILTRES_GESTIONNAIRE: FiltresSupport = { ...FILTRES_SUPPORT_DEFAUT, origine: 'voyageur' };

const ONGLETS_GESTIONNAIRE = [
  { valeur: 'voyageur' as const, label: 'Demandes des voyageurs' },
  { valeur: 'compagnie' as const, label: 'Mes demandes à Yègo' },
];

export default function BoiteSupport({ espace, user }: Props) {
  const admin = espace === 'admin';
  // Le gestionnaire voit aussi les demandes des voyageurs liées à sa compagnie
  // (réservation jointe) ; les agents ne voient que les leurs.
  const gestionnaire = !admin && gestionnaireSupport(user);
  const filtres = useFiltres<FiltresSupport>(gestionnaire ? FILTRES_GESTIONNAIRE : FILTRES_SUPPORT_DEFAUT, 'q');
  const f = filtres.valeurs;
  const ongletVoyageurs = gestionnaire && filtres.appliques.origine === 'voyageur';
  const [selection, setSelection] = useState<number | null>(null);
  const [creation, setCreation] = useState(false);
  const [compagnies, setCompagnies] = useState<{ valeur: string; label: string }[]>([]);

  useEffect(() => {
    if (!admin) return;
    compagniesApi
      .list()
      .then((cs) => setCompagnies(cs.map((c) => ({ valeur: String(c.id), label: c.nom })).sort((a, b) => a.label.localeCompare(b.label, 'fr'))))
      .catch(() => setCompagnies([]));
  }, [admin]);

  const appliques = filtres.appliques;
  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) => supportApi.list({ take, skip, filtres: appliques }),
    [appliques],
  );
  const liste = usePagedList<DemandeSupport>(fetcher, filtres.cle, 20);

  function majLigne(d: DemandeSupport) {
    const { id, statut, priorite, dernierMessageA, dateMaj, nbMessages } = d;
    liste.fusionner((x) => x.id === id, { ...liste.items.find((x) => x.id === id)!, statut, priorite, dernierMessageA, dateMaj, nbMessages });
  }

  const panneauOuvert = creation || selection != null;

  return (
    <>
      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        {gestionnaire && (
          <FiltreSegments
            label="Demandes"
            value={f.origine === 'compagnie' ? 'compagnie' : 'voyageur'}
            onChange={(v) => {
              setSelection(null);
              setCreation(false);
              filtres.set('origine', v);
            }}
            options={ONGLETS_GESTIONNAIRE}
          />
        )}
        <FiltreRecherche label="Recherche" value={f.q} onChange={(v) => filtres.set('q', v)} placeholder="Sujet, nom ou n°" />
        <FiltreSegments
          label="Statut"
          value={f.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={[
            { valeur: '', label: 'Toutes' },
            { valeur: 'ouverte', label: 'Ouvertes' },
            { valeur: 'en_cours', label: 'En cours' },
            { valeur: 'resolue', label: 'Résolues' },
            { valeur: 'fermee', label: 'Fermées' },
          ]}
        />
        <FiltreSelect
          label="Catégorie"
          value={f.categorie}
          onChange={(v) => filtres.set('categorie', v)}
          options={CATEGORIES_SUPPORT}
          tous="Toutes"
          className="w-full sm:w-48"
        />
        {admin && (
          <FiltreSegments
            label="Origine"
            value={f.origine}
            onChange={(v) => filtres.set('origine', v)}
            options={[
              { valeur: '', label: 'Toutes' },
              { valeur: 'compagnie', label: 'Compagnies' },
              { valeur: 'voyageur', label: 'Voyageurs' },
            ]}
          />
        )}
        {admin && (
          <FiltreSelect
            label="Compagnie"
            value={f.compagnieId}
            onChange={(v) => filtres.set('compagnieId', v)}
            options={compagnies}
            tous="Toutes"
            className="w-full sm:w-48"
          />
        )}
      </FiltresBar>

      <div className={`grid grid-cols-1 gap-5 ${panneauOuvert ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''}`}>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">
              {admin ? 'Demandes' : ongletVoyageurs ? 'Demandes des voyageurs' : gestionnaire ? 'Mes demandes à Yègo' : 'Mes demandes'}
              <span className="ml-2 text-xs font-normal text-ink-faint">
                {liste.items.length}
                {liste.aSuite ? '+' : ''}
              </span>
            </h2>
            {!admin && !ongletVoyageurs && (
              <Button
                onClick={() => {
                  setSelection(null);
                  setCreation(true);
                }}
                className="!py-1.5 !text-xs"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Nouvelle demande
              </Button>
            )}
          </div>

          {liste.chargement ? (
            <p className="px-5 py-10 text-center text-sm text-ink-faint">Chargement…</p>
          ) : liste.erreur ? (
            <p className="px-5 py-10 text-center text-sm text-danger">{liste.erreur}</p>
          ) : liste.items.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <LifeBuoy className="mb-2 h-6 w-6 text-ink-faint" strokeWidth={1.5} />
              <p className="text-sm text-ink-faint">
                {filtres.nbActifs > 0
                  ? 'Aucune demande pour ces filtres.'
                  : admin
                    ? 'Aucune demande de support.'
                    : ongletVoyageurs
                      ? 'Aucune demande de voyageur sur vos réservations.'
                      : 'Vous n’avez ouvert aucune demande. Un problème ? « Nouvelle demande ».'}
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line-soft">
                {liste.pageItems.map((d) => {
                  const actif = d.id === selection;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCreation(false);
                          setSelection(d.id);
                        }}
                        className={`w-full px-5 py-3.5 text-left transition-colors ${actif ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-medium text-ink">
                            {d.priorite === 'haute' && <span className="mr-1.5 text-danger" title="Priorité haute">●</span>}
                            {d.sujet}
                          </p>
                          <Badge tone={TONE_STATUT_SUPPORT[d.statut]}>{LIBELLE_STATUT_SUPPORT[d.statut]}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-ink-faint">
                          #{d.id} · {libelleCategorie(d.categorie)}
                          {admin && (
                            <>
                              {' · '}
                              {d.auteur?.nom ?? libelleRole(String(d.auteurRole))}
                              {d.auteurRole === 'user' ? ' (voyageur)' : ''}
                              {d.compagnie ? ` · ${d.compagnie.nom}` : ''}
                            </>
                          )}
                          {ongletVoyageurs && (
                            <>
                              {' · '}
                              {d.auteur?.nom ?? 'Voyageur'}
                              {d.reservationId ? ` · réservation #${d.reservationId}` : ''}
                            </>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-faint">
                          Dernière activité {formatDateHeure(d.dernierMessageA)}
                          {d.nbMessages ? ` · ${d.nbMessages} message${d.nbMessages > 1 ? 's' : ''}` : ''}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Pagination pagination={liste.pagination} />
            </>
          )}
        </Card>

        {panneauOuvert && (
          <Card className="overflow-hidden lg:sticky lg:top-6 lg:self-start">
            {creation ? (
              <NouvelleDemande
                onAnnuler={() => setCreation(false)}
                onCree={(d) => {
                  setCreation(false);
                  liste.recharger();
                  setSelection(d.id);
                }}
              />
            ) : (
              selection != null && (
                <FilSupport demandeId={selection} user={user} onMaj={majLigne} onFermer={() => setSelection(null)} />
              )
            )}
          </Card>
        )}
      </div>
    </>
  );
}
