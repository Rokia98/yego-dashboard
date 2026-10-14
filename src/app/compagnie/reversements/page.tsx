'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import ApercuReversement from '@/components/reversements/ApercuReversement';
import CoordonneesReversement from '@/components/reversements/CoordonneesReversement';
import DemandesReversement from '@/components/reversements/DemandesReversement';
import HistoriqueReversements from '@/components/reversements/HistoriqueReversements';
import ReversementsIndisponible from '@/components/reversements/ReversementsIndisponible';
import SoldeCompagnie from '@/components/reversements/SoldeCompagnie';
import { reversementsApi } from '@/features/reversements';
import type { ApercuReversement as Apercu, SoldeCompagnie as Solde } from '@/features/reversements';
import { useAuthGuard } from '@/lib/auth';
import { COMPAGNIE_NAV } from '@/lib/nav';
import { DEMANDES_REVERSEMENT, JEKO } from '@/lib/capacites';
import { formatDateHeure, formatFcfa } from '@/lib/format';

// L'équipe Yègo déclenche les reversements ; la compagnie peut en faire la demande.
export default function MesReversementsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [solde, setSolde] = useState<Solde | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [cleDemandes, setCleDemandes] = useState(0);

  const charger = useCallback(() => {
    setErreur(null);
    reversementsApi
      .apercu()
      .then(setApercu)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Erreur de chargement'));
    if (DEMANDES_REVERSEMENT) {
      reversementsApi
        .soldeCompagnie()
        .then(setSolde)
        .catch(() => setSolde(null));
    }
  }, []);

  useEffect(() => {
    if (ready && JEKO) charger();
  }, [ready, charger]);

  async function demander() {
    setEnvoi(true);
    try {
      await reversementsApi.demander(commentaire.trim() || undefined);
      setCommentaire('');
      setCleDemandes((k) => k + 1);
      charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la demande');
    } finally {
      setEnvoi(false);
    }
  }

  async function annulerEnAttente(id: number) {
    if (!confirm(`Annuler votre demande de reversement #${id} ?`)) return;
    try {
      await reversementsApi.annulerDemande(id);
      setCleDemandes((k) => k + 1);
      charger();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l’annulation');
    }
  }

  if (!ready) return null;

  const net = apercu ? Number(apercu.montantNet) : 0;
  const enAttente = solde?.demandeEnAttente ?? null;

  return (
    <DashboardShell nav={COMPAGNIE_NAV} title="Espace compagnie" userLabel={user?.telephone}>
      <PageHeader
        eyebrow="Espace opérateur"
        title="Reversements"
        subtitle={
          DEMANDES_REVERSEMENT
            ? 'Recettes des billets vendus en ligne, disponibles à partir du lendemain du départ : demandez-en le reversement, l’équipe Yègo vous les remet en main propre.'
            : 'Recettes des billets vendus en ligne, versées par Yègo sur votre compte Mobile Money (commission déduite) à partir du lendemain du départ.'
        }
      />

      {!JEKO ? (
        <ReversementsIndisponible />
      ) : (
        <>
          {DEMANDES_REVERSEMENT && <SoldeCompagnie solde={solde} />}

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {erreur ? (
              <Card className="p-5 text-sm text-danger">{erreur}</Card>
            ) : apercu ? (
              <ApercuReversement apercu={apercu} titre="À venir">
                {DEMANDES_REVERSEMENT &&
                  (enAttente ? (
                    <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-ink-soft">
                        Demande #{enAttente.id} envoyée le {formatDateHeure(enAttente.dateDemande)} (
                        {formatFcfa(enAttente.montantNetEstime)}) : en attente de l’équipe Yègo.
                      </p>
                      <Button variant="link-danger" onClick={() => annulerEnAttente(enAttente.id)} className="shrink-0">
                        Annuler la demande
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Field label="Commentaire (facultatif)">
                        <Input
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          maxLength={500}
                          placeholder="Ex. besoin de trésorerie pour le carburant"
                        />
                      </Field>
                      <Button onClick={demander} disabled={envoi || net <= 0} className="w-full">
                        {envoi ? 'Envoi…' : `Demander le reversement de ${formatFcfa(apercu.montantNet)}`}
                      </Button>
                      <p className="text-xs text-ink-faint">
                        {net <= 0
                          ? 'Rien à reverser pour le moment.'
                          : 'Une fois la demande validée, l’équipe Yègo vous remet le montant en main propre.'}
                      </p>
                    </div>
                  ))}
              </ApercuReversement>
            ) : (
              <Card className="p-5 text-sm text-ink-faint">Chargement…</Card>
            )}
            {/* Nouveau circuit : remise en main propre, le compte Mobile Money n'est plus utilisé. */}
            {!DEMANDES_REVERSEMENT && user?.compagnieId != null && (
              <CoordonneesReversement compagnieId={user.compagnieId} onEnregistre={charger} />
            )}
          </div>

          {DEMANDES_REVERSEMENT && <DemandesReversement cleRechargement={cleDemandes} onTraitee={charger} />}

          <HistoriqueReversements />
        </>
      )}
    </DashboardShell>
  );
}
