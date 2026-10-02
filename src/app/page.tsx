'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/http';
import { chargerUtilisateur, homeForRole, revoquerRefreshToken, saveSession, type UserRole } from '@/lib/auth';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { chiffresTelephone, estTelephoneValide, telephonePourApi } from '@/lib/telephone';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
};

export default function LoginPage() {
  const router = useRouter();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    chargerUtilisateur().then((current) => {
      if (current) router.replace(homeForRole(current.role));
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!estTelephoneValide(telephone)) {
      setErreur('Le numéro doit comporter 10 chiffres (ex. 07 01 02 03 04).');
      return;
    }
    setChargement(true);
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ telephone: telephonePourApi(telephone), motDePasse }),
      });
      if (data.role === 'user') {
        // Session émise mais inutilisable ici : on la révoque aussitôt.
        revoquerRefreshToken(data.refreshToken);
        setErreur('Ce compte voyageur n’a pas accès au back-office Yègo.');
        return;
      }
      saveSession(data.accessToken, data.refreshToken);
      router.push(homeForRole(data.role));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-card">
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-base font-bold text-white shadow-subtle">
            Y
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-ink">Connexion à Yègo</h1>
            <p className="mt-1 text-sm text-ink-faint">Espace compagnie / administration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Téléphone (10 chiffres)">
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              value={telephone}
              onChange={(e) => setTelephone(chiffresTelephone(e.target.value))}
              required
              maxLength={10}
              placeholder="0701020304"
            />
          </Field>
          <Field label="Mot de passe">
            <Input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
          </Field>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <Button type="submit" disabled={chargement} className="mt-2 w-full">
            {chargement ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  );
}
