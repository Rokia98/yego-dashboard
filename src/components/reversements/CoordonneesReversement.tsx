'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { reversementsApi, MOYENS_REVERSEMENT } from '@/features/reversements';
import type { CoordonneesReversement as Coordonnees, MoyenReversement } from '@/features/reversements';
import { estTelephoneValide, formatTelephone, telephonePourApi } from '@/lib/telephone';

/**
 * « Compte de reversement Mobile Money » d'une compagnie (perm compagnie:update :
 * company_admin de la compagnie, admin). `onEnregistre` permet à la page de
 * rafraîchir l'aperçu, qui embarque aussi les coordonnées.
 */
export default function CoordonneesReversement({
  compagnieId,
  onEnregistre,
}: {
  compagnieId: number;
  onEnregistre?: (c: Coordonnees) => void;
}) {
  const [actuelles, setActuelles] = useState<Coordonnees | null>(null); // null = non renseigné
  const [moyen, setMoyen] = useState<MoyenReversement | ''>('');
  const [telephone, setTelephone] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);
    setSucces(false);
    reversementsApi
      .getCoordonnees(compagnieId)
      .then((c) => {
        if (!actif) return;
        setActuelles(c);
        setMoyen(c?.moyen ?? '');
        setTelephone(c?.telephone ? formatTelephone(c.telephone) : '');
      })
      .catch((e) => actif && setErreur(e instanceof Error ? e.message : 'Erreur de chargement'))
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, [compagnieId]);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setSucces(false);
    if (!moyen) return setErreur('Choisissez l’opérateur.');
    if (!estTelephoneValide(telephone)) return setErreur('Numéro mobile à 10 chiffres attendu.');
    setEnregistrement(true);
    setErreur(null);
    try {
      const c = await reversementsApi.setCoordonnees(compagnieId, { moyen, telephone: telephonePourApi(telephone) });
      setActuelles(c);
      setTelephone(c?.telephone ? formatTelephone(c.telephone) : '');
      setSucces(true);
      onEnregistre?.(c);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setEnregistrement(false);
    }
  }

  const renseigne = actuelles?.moyen != null && actuelles.telephone != null;

  return (
    <Card>
      <CardHeader
        title="Compte de reversement Mobile Money"
        subtitle="Numéro sur lequel Yègo verse les recettes des billets vendus en ligne."
        right={chargement ? '…' : renseigne ? 'Renseigné' : 'Non renseigné'}
      />
      <form onSubmit={enregistrer} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <Field label="Opérateur">
          <Select value={moyen} onChange={(e) => setMoyen(e.target.value as MoyenReversement | '')} disabled={chargement}>
            <option value="">Choisir…</option>
            {MOYENS_REVERSEMENT.map((m) => (
              <option key={m.valeur} value={m.valeur}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Numéro mobile">
          <Input
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(formatTelephone(e.target.value))}
            placeholder="07 01 02 03 04"
            disabled={chargement}
          />
        </Field>
        <Button type="submit" disabled={chargement || enregistrement}>
          {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {(erreur || succes) && (
          <p className={`text-xs sm:col-span-3 ${erreur ? 'text-danger' : 'text-success'}`}>
            {erreur ?? 'Compte de reversement enregistré.'}
          </p>
        )}
      </form>
    </Card>
  );
}
