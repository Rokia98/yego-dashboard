'use client';

import { useState } from 'react';
import { Field, Input, Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { supportApi, CATEGORIES_SUPPORT } from '@/features/support';
import type { CategorieSupport, DemandeSupportDetail } from '@/features/support';

type Props = {
  onCree: (d: DemandeSupportDetail) => void;
  onAnnuler: () => void;
};

export default function NouvelleDemande({ onCree, onAnnuler }: Props) {
  const [categorie, setCategorie] = useState<CategorieSupport>('technique');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [reservation, setReservation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (sujet.trim().length < 5) {
      setErreur('Le sujet doit comporter au moins 5 caractères.');
      return;
    }
    if (!message.trim()) {
      setErreur('Décrivez votre demande.');
      return;
    }
    const reservationId = reservation.replace(/\D/g, '');
    setEnvoi(true);
    try {
      const d = await supportApi.creer({
        categorie,
        sujet: sujet.trim(),
        message: message.trim(),
        reservationId: reservationId ? Number(reservationId) : undefined,
      });
      onCree(d);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'envoi de la demande");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <h2 className="mb-1 text-base font-semibold text-ink">Nouvelle demande à l’équipe Yègo</h2>
      <p className="mb-4 text-xs text-ink-faint">Réponse sous 24 h ouvrées. Vous serez notifié à chaque réponse.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Catégorie">
          <Select value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieSupport)}>
            {CATEGORIES_SUPPORT.map((c) => (
              <option key={c.valeur} value={c.valeur}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="N° de réservation concernée (optionnel)">
          <Input inputMode="numeric" placeholder="ex. 1284" value={reservation} onChange={(e) => setReservation(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Sujet">
          <Input value={sujet} onChange={(e) => setSujet(e.target.value)} maxLength={150} placeholder="Résumé en une phrase" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            rows={6}
            placeholder="Décrivez le problème : ce que vous faisiez, ce qui s’est passé, le message d’erreur éventuel…"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>
      </div>
      {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={envoi}>
          {envoi ? 'Envoi…' : 'Envoyer la demande'}
        </Button>
        <Button variant="ghost" onClick={onAnnuler}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
