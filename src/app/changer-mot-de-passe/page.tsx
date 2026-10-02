'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { chargerUtilisateur, changerMotDePasse, homeForRole, saveSession } from '@/lib/auth';

export default function ChangerMotDePassePage() {
  const router = useRouter();
  const [obligatoire, setObligatoire] = useState(false);
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    chargerUtilisateur().then((current) => {
      if (!current) {
        router.replace('/');
        return;
      }
      setObligatoire(current.motDePasseTemporaire);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (nouveau.length < 8) {
      setErreur('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (nouveau !== confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (nouveau === ancien) {
      setErreur("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }
    setEnvoi(true);
    try {
      const session = await changerMotDePasse(ancien, nouveau);
      // L'API réémet directement un jeton avec le flag levé : on remplace la
      // session courante, pas besoin de se reconnecter.
      saveSession(session.accessToken, session.refreshToken);
      setSucces(true);
      setTimeout(() => router.replace(homeForRole(session.role)), 900);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-card">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-base font-bold text-white shadow-subtle">
            {obligatoire ? <ShieldAlert className="h-6 w-6" strokeWidth={1.75} /> : 'Y'}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              {obligatoire ? 'Nouveau mot de passe requis' : 'Changer mon mot de passe'}
            </h1>
            <p className="mt-1 text-sm text-ink-faint">
              {obligatoire
                ? 'Votre mot de passe a été généré par un administrateur — définissez-en un nouveau avant de continuer.'
                : 'Choisissez un nouveau mot de passe pour votre compte.'}
            </p>
          </div>
        </div>

        {succes ? (
          <p className="rounded-xl bg-success-soft px-4 py-3 text-center text-sm text-success">
            Mot de passe mis à jour — redirection…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Mot de passe actuel">
              <Input type="password" required value={ancien} onChange={(e) => setAncien(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="Nouveau mot de passe">
              <Input
                type="password"
                required
                minLength={8}
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmer le nouveau mot de passe">
              <Input
                type="password"
                required
                minLength={8}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="new-password"
              />
            </Field>

            {erreur && <p className="text-sm text-danger">{erreur}</p>}

            <Button type="submit" disabled={envoi} className="mt-2 w-full">
              {envoi ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>

            {!obligatoire && (
              <button
                type="button"
                onClick={() => router.back()}
                className="text-center text-xs text-ink-faint hover:text-ink hover:underline"
              >
                Annuler
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
