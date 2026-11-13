'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/*
  Remplaçants stylés de window.confirm / window.alert :
  - useConfirmer() → `await confirmer({ titre, message })` renvoie true/false ;
  - useNotifier()  → notifications éphémères (toasts) en bas à droite.
  Le fournisseur est monté une fois dans le layout racine.
*/

type Ton = 'danger' | 'accent' | 'success' | 'warning';

export type OptionsConfirmation = {
  titre: string;
  message?: React.ReactNode;
  libelleConfirmer?: string;
  libelleAnnuler?: string;
  ton?: Ton;
};

export type OptionsSaisie = OptionsConfirmation & {
  label: string;
  placeholder?: string;
  valeurInitiale?: string;
  /** Longueur minimale exigée (0 = champ facultatif). */
  minLength?: number;
  multiligne?: boolean;
};

type TypeToast = 'succes' | 'erreur' | 'info';
type Toast = { id: number; type: TypeToast; message: string };

type Contexte = {
  confirmer: (o: OptionsConfirmation) => Promise<boolean>;
  demander: (o: OptionsSaisie) => Promise<string | null>;
  notifier: (type: TypeToast, message: string) => void;
};

const DialoguesContext = createContext<Contexte | null>(null);

const ICONE_TON = {
  danger: { Icone: AlertTriangle, classe: 'bg-danger-soft text-danger' },
  warning: { Icone: AlertTriangle, classe: 'bg-warning-soft text-warning' },
  success: { Icone: CheckCircle2, classe: 'bg-success-soft text-success' },
  accent: { Icone: Info, classe: 'bg-accent-soft text-accent-ink' },
} as const;

const CHAMP =
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const TOAST = {
  succes: { Icone: CheckCircle2, classe: 'text-success' },
  erreur: { Icone: XCircle, classe: 'text-danger' },
  info: { Icone: Info, classe: 'text-accent-ink' },
} as const;

export function DialoguesProvider({ children }: { children: React.ReactNode }) {
  const [demande, setDemande] = useState<(OptionsConfirmation & Partial<OptionsSaisie>) | null>(null);
  const [valeur, setValeur] = useState('');
  const resoudre = useRef<((ok: boolean, valeur: string) => void) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prochainId = useRef(1);

  const ouvrir = useCallback((o: OptionsConfirmation & Partial<OptionsSaisie>, res: (ok: boolean, v: string) => void) => {
    resoudre.current?.(false, '');
    setValeur(o.valeurInitiale ?? '');
    setDemande(o);
    resoudre.current = res;
  }, []);

  const confirmer = useCallback(
    (o: OptionsConfirmation) => new Promise<boolean>((res) => ouvrir(o, (ok) => res(ok))),
    [ouvrir],
  );

  const demander = useCallback(
    (o: OptionsSaisie) => new Promise<string | null>((res) => ouvrir(o, (ok, v) => res(ok ? v.trim() : null))),
    [ouvrir],
  );

  const repondre = useCallback(
    (ok: boolean) => {
      resoudre.current?.(ok, valeur);
      resoudre.current = null;
      setDemande(null);
    },
    [valeur],
  );

  const fermerToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notifier = useCallback((type: TypeToast, message: string) => {
    const id = prochainId.current++;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
  }, []);

  const ton = demande?.ton ?? 'accent';
  const { Icone, classe } = ICONE_TON[ton];

  return (
    <DialoguesContext.Provider value={{ confirmer, demander, notifier }}>
      {children}

      <Modal ouvert={demande != null} titre="" onFermer={() => repondre(false)} largeur="max-w-md" sansEntete>
        {demande && (
          <div className="flex gap-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${classe}`}>
              <Icone className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-ink">{demande.titre}</h2>
              {demande.message && (
                <div className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{demande.message}</div>
              )}
              {demande.label != null && (
                <form
                  id="dialogue-saisie"
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (valeur.trim().length >= (demande.minLength ?? 0)) repondre(true);
                  }}
                >
                  <label className="mb-1.5 block text-xs font-medium text-ink-soft">{demande.label}</label>
                  {demande.multiligne ? (
                    <textarea
                      autoFocus
                      rows={3}
                      value={valeur}
                      placeholder={demande.placeholder}
                      onChange={(e) => setValeur(e.target.value)}
                      className={CHAMP}
                    />
                  ) : (
                    <input
                      autoFocus
                      value={valeur}
                      placeholder={demande.placeholder}
                      onChange={(e) => setValeur(e.target.value)}
                      className={CHAMP}
                    />
                  )}
                  {(demande.minLength ?? 0) > 0 && (
                    <p className="mt-1 text-[11px] text-ink-faint">{demande.minLength} caractères minimum.</p>
                  )}
                </form>
              )}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => repondre(false)}>
                  {demande.libelleAnnuler ?? 'Annuler'}
                </Button>
                <Button
                  variant={ton === 'danger' ? 'danger' : 'primary'}
                  onClick={() => repondre(true)}
                  autoFocus={demande.label == null}
                  disabled={demande.label != null && valeur.trim().length < (demande.minLength ?? 0)}
                >
                  {demande.libelleConfirmer ?? 'Confirmer'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onFermer={fermerToast} />
        ))}
      </div>
    </DialoguesContext.Provider>
  );
}

function ToastItem({ toast, onFermer }: { toast: Toast; onFermer: (id: number) => void }) {
  const { Icone, classe } = TOAST[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onFermer(toast.id), toast.type === 'erreur' ? 7000 : 4500);
    return () => clearTimeout(t);
  }, [toast, onFermer]);

  return (
    <div
      role={toast.type === 'erreur' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop"
    >
      <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${classe}`} strokeWidth={2} />
      <p className="flex-1 whitespace-pre-line text-sm text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => onFermer(toast.id)}
        className="-mr-1 rounded-md p-0.5 text-ink-faint hover:bg-surface-2 hover:text-ink"
        aria-label="Fermer la notification"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function useDialogues(): Contexte {
  const ctx = useContext(DialoguesContext);
  if (ctx) return ctx;
  // Repli (hors fournisseur, ex. tests) : dialogues natifs.
  return {
    confirmer: async (o) => window.confirm([o.titre, typeof o.message === 'string' ? o.message : ''].filter(Boolean).join('\n\n')),
    demander: async (o) => window.prompt(o.titre, o.valeurInitiale ?? ''),
    notifier: (_t, m) => window.alert(m),
  };
}

/** `await confirmer({ titre, message, ton: 'danger' })` → true si l'utilisateur confirme. */
export function useConfirmer() {
  return useDialogues().confirmer;
}

/** `await demander({ titre, label })` → texte saisi, ou null si l'utilisateur annule. */
export function useDemander() {
  return useDialogues().demander;
}

/** Notifications éphémères : `notifier.succes('Enregistré')`, `notifier.erreur(err)`. */
export function useNotifier() {
  const { notifier } = useDialogues();
  return useMemo(
    () => ({
      succes: (m: string) => notifier('succes', m),
      info: (m: string) => notifier('info', m),
      /** Accepte directement l'erreur attrapée ; `defaut` si ce n'est pas une Error. */
      erreur: (err: unknown, defaut = 'Une erreur est survenue') =>
        notifier('erreur', typeof err === 'string' ? err : err instanceof Error ? err.message : defaut),
    }),
    [notifier],
  );
}
