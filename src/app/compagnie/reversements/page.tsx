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
import { DEMANDES_REVERSEMENT, JEKO, MONTANT_DEMANDE } from '@/lib/capacites';
import { formatDateHeure, formatFcfa } from '@/lib/format';

// Minimum d'une demande à montant choisi (contrat MONTANT_DEMANDE).
const MONTANT_MIN = 100;

// L'équipe Yègo déclenche les reversements ; la compagnie peut en faire la demande.
export default function MesReversementsPage() {
  const { user, ready } = useAuthGuard(['company_admin']);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [solde, setSolde] = useState<Solde | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [cleDemandes, setCleDemandes] = useState(0);
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  const [montant, setMontant] = useState('');

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

  // C'est l'API qui décide (montant disponible, demande déjà en attente…) :
  // le bouton reste actif et sa réponse est affichée telle quelle.
  async function demander() {
    setResultat(null);
    // Montant choisi (vide = tout le disponible) : bornes vérifiées ici, l'API tranche.
    let montantChoisi: number | undefined;
    if (MONTANT_DEMANDE && montant.trim()) {
      const m = Number(montant.replace(/\s/g, ''));
      if (!Number.isInteger(m) || m < MONTANT_MIN) {
        setResultat({ ok: false, texte: `Montant entier d’au moins ${formatFcfa(MONTANT_MIN)}.` });
        return;
      }
      if (net > 0 && m > net) {
        setResultat({ ok: false, texte: `Au maximum ${formatFcfa(net)} (montant disponible).` });
        return;
      }
      montantChoisi = m;
    }
    setEnvoi(true);
    try {
      const d = await reversementsApi.demander(commentaire.trim() || undefined, montantChoisi);
      setCommentaire('');
      setMontant('');
      setResultat({
        ok: true,
        texte: `Demande #${d.id} envoyée (${formatFcfa(d.montantDemande ?? d.montantNetEstime)}) : l’équipe Yègo a été prévenue.`,
      });
      setCleDemandes((k) => k + 1);
      charger();
    } catch (err) {
      setResultat({ ok: false, texte: err instanceof Error ? err.message : 'Erreur lors de la demande' });
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
  const enAttenteMontant = solde ? Number(solde.enAttente.montantNet) : 0;

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
                        {formatFcfa(enAttente.montantDemande ?? enAttente.montantNetEstime)}) : en attente de l’équipe Yègo.
                      </p>
                      <Button variant="link-danger" onClick={() => annulerEnAttente(enAttente.id)} className="shrink-0">
                        Annuler la demande
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {MONTANT_DEMANDE && (
                        <Field label={net > 0 ? `Montant demandé (max ${formatFcfa(net)})` : 'Montant demandé'}>
                          <Input
                            inputMode="numeric"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value.replace(/[^\d\s]/g, ''))}
                            placeholder={net > 0 ? `${net.toLocaleString('fr-FR')} (tout le disponible)` : 'Ex. 50 000'}
                          />
                        </Field>
                      )}
                      <Field label="Commentaire (facultatif)">
                        <Input
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          maxLength={500}
                          placeholder="Ex. besoin de trésorerie pour le carburant"
                        />
                      </Field>
                      <Button onClick={demander} disabled={envoi} className="w-full">
                        {envoi
                          ? 'Envoi…'
                          : MONTANT_DEMANDE && montant.trim() && Number(montant.replace(/\s/g, '')) > 0
                            ? `Demander le reversement de ${formatFcfa(Number(montant.replace(/\s/g, '')))}`
                            : net > 0
                              ? `Demander le reversement de ${formatFcfa(apercu.montantNet)}`
                              : 'Demander un reversement'}
                      </Button>
                      {resultat ? (
                        <p className={`text-sm ${resultat.ok ? 'text-success' : 'text-danger'}`}>{resultat.texte}</p>
                      ) : (
                        <p className="text-xs text-ink-faint">
                          {net > 0
                            ? 'Une fois la demande validée, l’équipe Yègo vous remet le montant en main propre.'
                            : 'Rien n’est encore disponible : les ventes en ligne le deviennent le lendemain du départ.'}
                        </p>
                      )}
                      {!resultat?.ok && enAttenteMontant > 0 && (
                        <p className="text-xs text-ink-faint">
                          {formatFcfa(enAttenteMontant)} encore en attente (départs à venir ou remboursements en cours).
                        </p>
                      )}
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
