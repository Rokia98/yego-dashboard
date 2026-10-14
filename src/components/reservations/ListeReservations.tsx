'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, THead, Th, Tr, Td, TableMessage } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadMore from '@/components/ui/LoadMore';
import {
  FiltresBar,
  FiltrePeriode,
  FiltreRecherche,
  FiltreSegments,
  FiltreSelect,
  NoteFiltre,
} from '@/components/ui/Filtres';
import {
  reservationsApi,
  nomVoyageur,
  libelleTrajet,
  nomCompagnie,
  ENTETES_EXPORT_RESERVATIONS,
  ligneExportReservation,
  filtresReservationsDefaut,
  OPTIONS_STATUT_RESERVATION,
  OPTIONS_CANAL,
  OPTIONS_PAIEMENT,
  correspondReservation,
} from '@/features/reservations';
import type { Reservation, FiltresReservations } from '@/features/reservations';
import { paiementsApi, estPaiementJeko, totalPaye } from '@/features/paiements';
import { compagniesApi } from '@/features/compagnies';
import { usePagedList } from '@/lib/pagination';
import { useFiltres, jourIso } from '@/lib/filtres';
import { FILTRES_RESERVATIONS_SERVEUR, FILTRE_DATE_RESERVATION_SERVEUR } from '@/lib/capacites';
import { formatDate, formatFcfa, formatHeure, formatDateHeure } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';
import { messageConfirmationAnnulation } from '@/lib/annulation';
import { versCsv, telechargerCsv, horodatageFichier } from '@/lib/export';

const TONE_STATUT: Record<string, 'success' | 'danger' | 'warning'> = {
  confirmee: 'success',
  annulee: 'danger',
  expiree: 'warning',
};

const LIBELLE_STATUT: Record<string, string> = {
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  expiree: 'Expirée',
};

const LIBELLE_CANAL: Record<string, string> = { en_ligne: 'En ligne', guichet: 'Guichet' };

function raccourcisDepart() {
  return [
    { label: 'Aujourd’hui', du: jourIso(0), au: jourIso(0) },
    { label: 'Demain', du: jourIso(1), au: jourIso(1) },
    { label: '7 prochains jours', du: jourIso(0), au: jourIso(6) },
  ];
}

function raccourcisReservation() {
  return [
    { label: 'Aujourd’hui', du: jourIso(0), au: jourIso(0) },
    { label: 'Hier', du: jourIso(-1), au: jourIso(-1) },
    { label: '7 derniers jours', du: jourIso(-6), au: jourIso(0) },
    { label: 'Toutes', du: '', au: '' },
  ];
}

type Props = {
  /** `compagnie` : encaissement guichet possible ; `admin` : colonne et filtre compagnie. */
  espace: 'compagnie' | 'admin';
};

export default function ListeReservations({ espace }: Props) {
  const admin = espace === 'admin';
  // Par défaut : les réservations faites aujourd'hui (défaut figé au montage).
  const [defauts] = useState(filtresReservationsDefaut);
  const filtres = useFiltres<FiltresReservations>(defauts, 'q');
  const f = filtres.valeurs;
  const [compagnies, setCompagnies] = useState<Map<number, string>>(new Map());
  const [enCours, setEnCours] = useState<number | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => {
    if (!admin) return;
    compagniesApi
      .list()
      .then((cs) => setCompagnies(new Map(cs.map((c) => [c.id, c.nom]))))
      .catch(() => setCompagnies(new Map()));
  }, [admin]);

  const appliques = filtres.appliques;
  const fetcher = useCallback(
    ({ take, skip }: { take: number; skip: number }) => reservationsApi.list({ take, skip, filtres: appliques }),
    [appliques],
  );
  // Repli côté client pour les filtres que l'API ne gère pas encore.
  const filtrageLocal =
    Object.values(appliques).some(Boolean) && !(FILTRES_RESERVATIONS_SERVEUR && FILTRE_DATE_RESERVATION_SERVEUR);
  const filtreLocal = useMemo(
    () => (filtrageLocal ? (r: Reservation) => correspondReservation(r, appliques) : undefined),
    [appliques, filtrageLocal],
  );
  // L'API trie par date de réservation décroissante : passé le début de la
  // période, plus rien ne peut correspondre, inutile de lire plus loin.
  const arretLocal = useMemo(
    () => (appliques.resDu ? (r: Reservation) => (r.dateReservation ?? '').slice(0, 10) < appliques.resDu : undefined),
    [appliques.resDu],
  );
  const liste = usePagedList<Reservation>(fetcher, filtres.cle, 20, { filtreLocal, arretLocal });
  const duJour = appliques.resDu === jourIso(0) && appliques.resAu === jourIso(0);

  async function handleAnnuler(r: Reservation) {
    const payante = r.paiement?.statut === 'paye';
    if (!confirm(messageConfirmationAnnulation(payante))) return;
    setEnCours(r.id);
    try {
      const res = await reservationsApi.annuler(r.id);
      if (res.remboursement) {
        alert(
          `Remboursement créé : ${formatFcfa(res.remboursement.montantRembourse)} ` +
            `(frais retenus ${formatFcfa(res.remboursement.fraisRetenus)}).` +
            (admin ? '' : ' À confirmer depuis la page Remboursements après versement.'),
        );
      }
      liste.fusionner((x) => x.id === r.id, { ...r, statut: 'annulee' });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setEnCours(null);
    }
  }

  async function handleEncaisser(r: Reservation) {
    const montant = r.depart?.trajet?.prix ? Number(r.depart.trajet.prix) * r.nombrePlaces : null;
    if (!confirm(`Encaisser ${montant != null ? formatFcfa(montant) : 'le montant'} en espèces pour la réservation #${r.id} ?`)) return;
    setEnCours(r.id);
    try {
      const paiement = await paiementsApi.encaisserGuichet(r.id, 'espece');
      liste.fusionner((x) => x.id === r.id, { ...r, paiement });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'encaissement");
    } finally {
      setEnCours(null);
    }
  }

  async function handleExport() {
    setExportEnCours(true);
    try {
      const { items, tronque } = await reservationsApi.listAll(appliques);
      telechargerCsv(
        `reservations${admin ? '-reseau' : ''}-${horodatageFichier()}`,
        versCsv(ENTETES_EXPORT_RESERVATIONS, items.map((r) => ligneExportReservation(r, undefined, compagnies))),
      );
      if (tronque) alert('Export limité : seules les 2000 premières réservations ont été parcourues.');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setExportEnCours(false);
    }
  }

  const optionsCompagnies = [...compagnies.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
    .map(([id, nom]) => ({ valeur: String(id), label: nom }));

  return (
    <>
      <FiltresBar nbActifs={filtres.nbActifs} onReinitialiser={filtres.reinitialiser}>
        <FiltrePeriode
          label="Date de réservation"
          du={f.resDu}
          au={f.resAu}
          onChange={(du, au) => {
            filtres.set('resDu', du);
            filtres.set('resAu', au);
          }}
          raccourcis={raccourcisReservation()}
        />
        <FiltreRecherche
          label="Recherche"
          value={f.q}
          onChange={(v) => filtres.set('q', v)}
          placeholder="Nom, téléphone ou n°"
        />
        <FiltreSegments
          label="Statut"
          value={f.statut}
          onChange={(v) => filtres.set('statut', v)}
          options={OPTIONS_STATUT_RESERVATION}
        />
        <FiltreSelect
          label="Canal"
          value={f.canal}
          onChange={(v) => filtres.set('canal', v)}
          options={OPTIONS_CANAL}
          className="w-full sm:w-36"
        />
        <FiltreSelect
          label="Paiement"
          value={f.paiement}
          onChange={(v) => filtres.set('paiement', v)}
          options={OPTIONS_PAIEMENT}
          className="w-full sm:w-36"
        />
        {admin && (
          <FiltreSelect
            label="Compagnie"
            value={f.compagnieId}
            onChange={(v) => filtres.set('compagnieId', v)}
            options={optionsCompagnies}
            tous="Toutes"
          />
        )}
        <FiltrePeriode
          label="Date de départ"
          du={f.du}
          au={f.au}
          onChange={(du, au) => {
            filtres.set('du', du);
            filtres.set('au', au);
          }}
          raccourcis={raccourcisDepart()}
        />
      </FiltresBar>
      {filtrageLocal && filtres.nbActifs > 0 && !liste.chargement && (
        <NoteFiltre>
          Filtrage effectué par le navigateur ({liste.lues} réservation{liste.lues > 1 ? 's' : ''} parcourue
          {liste.lues > 1 ? 's' : ''}) en attendant le filtrage serveur.
        </NoteFiltre>
      )}

      <Card>
        <CardHeader
          title={duJour ? 'Réservations du jour' : 'Réservations'}
          subtitle={admin ? 'Tout le réseau, en ligne et au guichet' : 'En ligne et au guichet, pour votre compagnie'}
          right={
            <span className="flex items-center gap-3">
              <span>
                {liste.items.length} affichée{liste.items.length > 1 ? 's' : ''}
                {liste.aSuite ? '+' : ''}
              </span>
              <Button variant="secondary" onClick={handleExport} disabled={exportEnCours} className="!py-1.5 !text-xs">
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                {exportEnCours ? 'Export…' : 'Exporter CSV'}
              </Button>
            </span>
          }
        />
        {liste.chargement ? (
          <TableMessage>Chargement...</TableMessage>
        ) : liste.erreur ? (
          <TableMessage>{liste.erreur}</TableMessage>
        ) : liste.items.length === 0 ? (
          <>
            <TableMessage>
              {filtres.nbActifs > 0
                ? 'Aucune réservation ne correspond à ces filtres.'
                : 'Aucune réservation faite aujourd’hui pour le moment.'}
            </TableMessage>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={0} />
          </>
        ) : (
          <>
            <Table minWidth={admin ? '1040px' : '980px'}>
              <THead>
                <Th>Voyageur</Th>
                <Th>Trajet</Th>
                <Th>Départ</Th>
                <Th>Places</Th>
                <Th>Canal</Th>
                <Th>Montant</Th>
                <Th>Statut</Th>
                <Th>Action</Th>
              </THead>
              <tbody>
                {liste.items.map((r) => {
                  const tel = r.utilisateur?.telephone ?? r.passagerTelephone;
                  const paye = r.paiement?.statut === 'paye';
                  return (
                    <Tr key={r.id}>
                      <Td strong>
                        {nomVoyageur(r)}
                        <span className="block text-xs font-normal text-ink-faint">
                          #{r.id}
                          {tel ? ` · ${formatTelephone(tel)}` : ''}
                        </span>
                      </Td>
                      <Td>
                        {libelleTrajet(r)}
                        {admin && <span className="block text-xs text-ink-faint">{nomCompagnie(r, compagnies)}</span>}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {formatDate(r.depart?.dateDepart)}
                        <span className="block text-xs text-ink-faint">{formatHeure(r.depart?.trajet?.heureDepart)}</span>
                      </Td>
                      <Td className="tabular-nums">
                        {r.nombrePlaces}
                        {r.sieges?.length ? (
                          <span className="block text-xs text-ink-faint">siège{r.sieges.length > 1 ? 's' : ''} {r.sieges.join(', ')}</span>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge tone={r.canal === 'guichet' ? 'accent' : 'neutral'}>{LIBELLE_CANAL[r.canal] ?? r.canal}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">
                        {r.paiement ? formatFcfa(r.paiement.montant) : '—'}
                        <span className={`block text-xs ${paye ? 'text-success' : 'text-ink-faint'}`}>
                          {paye
                            ? `payé${r.paiement?.datePaiement ? ` le ${formatDateHeure(r.paiement.datePaiement)}` : ''}`
                            : r.paiement?.statut === 'rembourse'
                              ? 'remboursé'
                              : 'non payé'}
                        </span>
                        {Number(r.paiement?.fraisService ?? 0) > 0 && (
                          <span
                            className="block text-[11px] text-ink-faint"
                            title="Billets + frais de service Yègo (non remboursés, non reversés)"
                          >
                            + {formatFcfa(r.paiement!.fraisService)} frais · {formatFcfa(totalPaye(r.paiement!))} payés
                          </span>
                        )}
                        {estPaiementJeko(r.paiement) && (
                          <span className="block text-[11px] text-ink-faint">
                            En ligne (Jèko){r.paiement?.reversementId != null ? ' · reversé' : ''}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={TONE_STATUT[r.statut] ?? 'neutral'}>{LIBELLE_STATUT[r.statut] ?? r.statut}</Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-3">
                          {!admin && r.statut === 'confirmee' && r.canal === 'guichet' && !r.paiement && (
                            <Button variant="link-success" onClick={() => handleEncaisser(r)} disabled={enCours === r.id}>
                              {enCours === r.id ? '...' : 'Encaisser'}
                            </Button>
                          )}
                          {r.statut === 'confirmee' && (
                            <Button variant="link-danger" onClick={() => handleAnnuler(r)} disabled={enCours === r.id}>
                              {enCours === r.id ? '...' : 'Annuler'}
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <LoadMore aSuite={liste.aSuite} chargement={liste.chargementSuite} onClick={liste.chargerSuite} nbCharges={liste.items.length} />
          </>
        )}
      </Card>
    </>
  );
}
