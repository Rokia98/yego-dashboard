'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, RefreshCw, Send, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  supportApi,
  LIBELLE_STATUT_SUPPORT,
  TONE_STATUT_SUPPORT,
  libelleCategorie,
  libelleRole,
  peutTraiter,
  estAuteur,
  libelleAuteurMessage,
} from '@/features/support';
import type { DemandeSupport, DemandeSupportDetail, StatutSupport } from '@/features/support';
import type { AuthUser } from '@/lib/auth';
import { formatDateHeure } from '@/lib/format';
import { formatTelephone } from '@/lib/telephone';

const RAFRAICHISSEMENT = 30_000;
const MAX_MESSAGE = 4000;

type Props = {
  demandeId: number;
  user: AuthUser | null;
  /** Remonte la demande modifiée (statut, dernier message…) pour mettre la liste à jour. */
  onMaj: (d: DemandeSupport) => void;
  onFermer: () => void;
};

export default function FilSupport({ demandeId, user, onMaj, onFermer }: Props) {
  const [demande, setDemande] = useState<DemandeSupportDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponse, setReponse] = useState('');
  const [interne, setInterne] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [maj, setMaj] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(demandeId);
  idRef.current = demandeId;

  const charger = useCallback(
    async (silencieux = false) => {
      if (!silencieux) setChargement(true);
      else setMaj(true);
      try {
        const d = await supportApi.get(demandeId);
        if (idRef.current !== demandeId) return;
        setDemande(d);
        setErreur(null);
      } catch (e) {
        if (!silencieux) setErreur(e instanceof Error ? e.message : 'Demande introuvable');
      } finally {
        setChargement(false);
        setMaj(false);
      }
    },
    [demandeId],
  );

  useEffect(() => {
    setDemande(null);
    setReponse('');
    setInterne(false);
    charger();
    const t = setInterval(() => charger(true), RAFRAICHISSEMENT);
    return () => clearInterval(t);
  }, [charger]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [demande?.messages.length]);

  if (chargement) return <p className="p-6 text-center text-sm text-ink-faint">Chargement…</p>;
  if (erreur || !demande) return <p className="p-6 text-center text-sm text-danger">{erreur ?? 'Demande introuvable'}</p>;

  const traitant = peutTraiter(demande, user);
  const auteur = estAuteur(demande, user);
  const fermee = demande.statut === 'fermee';
  const admin = user?.role === 'admin';
  // Gestionnaire traitant la demande d'un voyageur de sa compagnie (pas de notes internes).
  const reponseCompagnie = traitant && !admin;

  async function envoyer() {
    const contenu = reponse.trim();
    if (!contenu || !demande) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await supportApi.repondre(demande.id, contenu, admin && interne);
      setReponse('');
      setInterne(false);
      const d = await supportApi.get(demande.id);
      setDemande(d);
      onMaj(d);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setEnvoi(false);
    }
  }

  async function changer(data: { statut?: StatutSupport; priorite?: 'normale' | 'haute' }) {
    if (!demande) return;
    if (data.statut === 'fermee' && !confirm('Fermer cette demande ? Plus aucun message ne pourra y être ajouté.')) return;
    setErreur(null);
    try {
      const d = await supportApi.modifier(demande.id, data);
      const complet = { ...demande, ...d, messages: demande.messages };
      setDemande(complet);
      onMaj(complet);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* En-tête */}
      <div className="border-b border-line-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-faint">
              #{demande.id} · {libelleCategorie(demande.categorie)} · ouverte le {formatDateHeure(demande.dateCreation)}
            </p>
            <h2 className="mt-1 text-base font-semibold text-ink">{demande.sujet}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => charger(true)}
              className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink"
              aria-label="Actualiser"
              disabled={maj}
            >
              <RefreshCw className={`h-4 w-4 ${maj ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            </button>
            <button onClick={onFermer} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink" aria-label="Fermer le panneau">
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <Badge tone={TONE_STATUT_SUPPORT[demande.statut]}>{LIBELLE_STATUT_SUPPORT[demande.statut]}</Badge>
          {demande.priorite === 'haute' && <Badge tone="danger">Priorité haute</Badge>}
          <span>
            {demande.auteur?.nom ?? `#${demande.auteurId}`} ({libelleRole(String(demande.auteurRole))})
            {demande.auteur?.telephone ? ` · ${formatTelephone(demande.auteur.telephone)}` : ''}
          </span>
          {demande.compagnie && <span>· {demande.compagnie.nom}</span>}
          {demande.reservationId && <span>· réservation #{demande.reservationId}</span>}
        </div>

        {(traitant || (auteur && !fermee)) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {traitant ? (
              <>
                {demande.statut !== 'en_cours' && !fermee && (
                  <Button variant="link" onClick={() => changer({ statut: 'en_cours' })}>
                    Prendre en charge
                  </Button>
                )}
                {demande.statut !== 'resolue' && !fermee && (
                  <Button variant="link-success" onClick={() => changer({ statut: 'resolue' })}>
                    Marquer résolue
                  </Button>
                )}
                {(demande.statut === 'resolue' || fermee) && (
                  <Button variant="link" onClick={() => changer({ statut: 'ouverte' })}>
                    Rouvrir
                  </Button>
                )}
                {!fermee && (
                  <Button variant="link-danger" onClick={() => changer({ statut: 'fermee' })}>
                    Fermer
                  </Button>
                )}
                <Button
                  variant="link"
                  onClick={() => changer({ priorite: demande.priorite === 'haute' ? 'normale' : 'haute' })}
                >
                  {demande.priorite === 'haute' ? 'Priorité normale' : 'Priorité haute'}
                </Button>
              </>
            ) : (
              <Button variant="link-danger" onClick={() => changer({ statut: 'fermee' })}>
                Clôturer ma demande
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fil */}
      <div className="max-h-[28rem] flex-1 space-y-3 overflow-y-auto p-5">
        {demande.messages.map((m) => {
          const moi = m.auteurId === user?.userId;
          return (
            <div key={m.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.interne
                    ? 'border border-dashed border-warning/50 bg-warning-soft text-ink'
                    : moi
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-ink'
                }`}
              >
                <p className={`mb-1 flex items-center gap-1 text-[11px] ${moi && !m.interne ? 'text-white/80' : 'text-ink-faint'}`}>
                  {m.interne && <Lock className="h-3 w-3" strokeWidth={2} />}
                  {m.interne ? 'Note interne · ' : ''}
                  {libelleAuteurMessage({ auteurRole: String(m.auteurRole), auteur: m.auteur }, demande.compagnie)} ·{' '}
                  {formatDateHeure(m.dateCreation)}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.contenu}</p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      {/* Réponse */}
      <div className="border-t border-line-soft p-4">
        {erreur && <p className="mb-2 text-sm text-danger">{erreur}</p>}
        {fermee ? (
          <p className="text-center text-xs text-ink-faint">Demande fermée — rouvrez-la pour répondre.</p>
        ) : traitant || auteur ? (
          <>
            <textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) envoyer();
              }}
              maxLength={MAX_MESSAGE}
              rows={3}
              placeholder={
                interne
                  ? 'Note visible uniquement par l’équipe Yègo…'
                  : reponseCompagnie
                    ? `Votre réponse au voyageur, au nom de ${demande.compagnie?.nom ?? 'votre compagnie'}… (Ctrl+Entrée pour envoyer)`
                    : 'Votre réponse… (Ctrl+Entrée pour envoyer)'
              }
              className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {admin ? (
                <label className="flex items-center gap-2 text-xs text-ink-soft">
                  <input type="checkbox" checked={interne} onChange={(e) => setInterne(e.target.checked)} className="h-3.5 w-3.5" />
                  Note interne (non visible par le demandeur)
                </label>
              ) : (
                <span className="text-xs text-ink-faint">
                  {reponse.length}/{MAX_MESSAGE}
                </span>
              )}
              <Button onClick={envoyer} disabled={envoi || !reponse.trim()} className="!py-1.5">
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                {envoi ? 'Envoi…' : interne ? 'Ajouter la note' : 'Envoyer'}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-xs text-ink-faint">
            Lecture seule.
          </p>
        )}
      </div>
    </div>
  );
}
