'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, FileText, Loader2, Trash2, Upload, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Field';
import { documentsApi, LABELS_TYPE_DOCUMENT, TAILLE_MAX_OCTETS, TYPES_MIME_ACCEPTES } from '@/features/documents';
import type { CompagnieDocument, TypeDocument } from '@/features/documents';
import { formatDateHeure, formatTaille } from '@/lib/format';

const BADGE_TONE: Record<CompagnieDocument['statut'], 'success' | 'warning' | 'danger'> = {
  en_attente: 'warning',
  valide: 'success',
  refuse: 'danger',
};

const LABEL_STATUT: Record<CompagnieDocument['statut'], string> = {
  en_attente: 'En attente de revue',
  valide: 'Validé',
  refuse: 'Refusé',
};

/** Type MIME normalisé s'il fait partie de la liste blanche, sinon null. */
function typeAffichable(mime: string | null | undefined): string | null {
  const t = (mime ?? '').split(';')[0].trim().toLowerCase();
  return TYPES_MIME_ACCEPTES.includes(t) ? t : null;
}

type DocumentsPanelProps = {
  compagnieId: number;
  /** Peut téléverser / supprimer (gestionnaire de sa compagnie, ou admin). */
  peutTeleverser?: boolean;
  /** Peut valider / refuser (admin plateforme uniquement). */
  peutModerer?: boolean;
};

export default function DocumentsPanel({ compagnieId, peutTeleverser = false, peutModerer = false }: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<CompagnieDocument[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [type, setType] = useState<TypeDocument>('registre_commerce');
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [ouverture, setOuverture] = useState<number | null>(null);

  function charger() {
    setChargement(true);
    documentsApi
      .list(compagnieId)
      .then(setDocuments)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Erreur de chargement'))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compagnieId]);

  async function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setErreur(null);
    if (!TYPES_MIME_ACCEPTES.includes(fichier.type)) {
      setErreur('Format non accepté — PDF, PNG ou JPEG uniquement.');
      return;
    }
    if (fichier.size > TAILLE_MAX_OCTETS) {
      setErreur(`Fichier trop volumineux (${formatTaille(fichier.size)}) — 5 Mo maximum.`);
      return;
    }
    setEnvoi(true);
    try {
      await documentsApi.uploader(compagnieId, type, fichier);
      charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier");
    } finally {
      setEnvoi(false);
    }
  }

  async function handleApercu(doc: CompagnieDocument) {
    setOuverture(doc.id);
    try {
      const brut = await documentsApi.telecharger(compagnieId, doc.id);
      // Une URL blob: s'exécute avec l'origine du dashboard : on n'affiche que
      // les types sûrs, en IMPOSANT le type (on ignore celui renvoyé par l'API,
      // qui reflète ce que le déposant a déclaré). Tout le reste est téléchargé.
      const type = typeAffichable(doc.mimeType) ?? typeAffichable(brut.type);
      const blob = new Blob([brut], { type: type ?? 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      if (type) {
        window.open(url, '_blank', 'noopener');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nomFichier || `document-${doc.id}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible d'ouvrir le document");
    } finally {
      setOuverture(null);
    }
  }

  async function handleSupprimer(doc: CompagnieDocument) {
    if (!confirm(`Supprimer « ${LABELS_TYPE_DOCUMENT[doc.type]} » ?`)) return;
    setEnCours(doc.id);
    try {
      await documentsApi.supprimer(compagnieId, doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setEnCours(null);
    }
  }

  async function handleModerer(doc: CompagnieDocument, statut: 'valide' | 'refuse') {
    const commentaireAdmin =
      statut === 'refuse' ? prompt('Motif du refus (optionnel) :') ?? undefined : undefined;
    setEnCours(doc.id);
    try {
      const maj = await documentsApi.moderer(compagnieId, doc.id, statut, commentaireAdmin);
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? maj : d)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la revue');
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div>
      {peutTeleverser && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line-soft bg-surface-2 p-3">
          <div className="w-56">
            <Field label="Type de document">
              <Select value={type} onChange={(e) => setType(e.target.value as TypeDocument)}>
                {Object.entries(LABELS_TYPE_DOCUMENT).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label>
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper ${envoi ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            >
              {envoi ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Upload className="h-4 w-4" strokeWidth={1.75} />}
              {envoi ? 'Envoi…' : 'Choisir un fichier'}
            </span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFichier} disabled={envoi} className="hidden" />
          </label>
          <p className="text-xs text-ink-faint">PDF, PNG ou JPEG — 5 Mo max.</p>
        </div>
      )}

      {erreur && <p className="mb-3 text-sm text-danger">{erreur}</p>}

      {chargement ? (
        <p className="py-6 text-center text-sm text-ink-faint">Chargement…</p>
      ) : documents.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">Aucun document déposé.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
            >
              <FileText className="h-5 w-5 shrink-0 text-ink-faint" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{LABELS_TYPE_DOCUMENT[doc.type]}</p>
                <p className="truncate text-xs text-ink-faint">
                  {doc.nomFichier} · {formatTaille(doc.tailleOctets)} · déposé le {formatDateHeure(doc.dateUpload)}
                </p>
                {doc.statut === 'refuse' && doc.commentaireAdmin && (
                  <p className="mt-0.5 text-xs text-danger">Motif : {doc.commentaireAdmin}</p>
                )}
              </div>
              <Badge tone={BADGE_TONE[doc.statut]}>{LABEL_STATUT[doc.statut]}</Badge>
              <div className="flex shrink-0 items-center gap-3">
                <Button variant="ghost" onClick={() => handleApercu(doc)} disabled={ouverture === doc.id} className="!px-2 !py-1.5">
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                </Button>
                {peutModerer && doc.statut === 'en_attente' && (
                  <>
                    <Button
                      variant="link-success"
                      onClick={() => handleModerer(doc, 'valide')}
                      disabled={enCours === doc.id}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} /> Valider
                    </Button>
                    <Button
                      variant="link-danger"
                      onClick={() => handleModerer(doc, 'refuse')}
                      disabled={enCours === doc.id}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} /> Refuser
                    </Button>
                  </>
                )}
                {peutTeleverser && (
                  <button
                    onClick={() => handleSupprimer(doc)}
                    disabled={enCours === doc.id}
                    className="text-ink-faint transition-colors hover:text-danger disabled:opacity-40"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
