'use client';

import { useState } from 'react';
import { Check, MessageCircle, ShieldCheck } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { compagniesApi } from '@/features/compagnies';
import type { Compagnie } from '@/features/compagnies';
import { chiffresTelephone, estTelephoneValide, formatTelephone, lienWhatsApp, telephonePourApi } from '@/lib/telephone';

type Identifiants = { telephone: string; motDePasse: string };

function messageIdentifiants(compagnie: string, id: Identifiants): string {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    `Bonjour, voici vos accès au tableau de bord Yègo pour ${compagnie} :`,
    '',
    `Identifiant (téléphone) : ${formatTelephone(id.telephone)}`,
    `Mot de passe provisoire : ${id.motDePasse}`,
    '',
    `Connexion : ${url}`,
    'Vous devrez choisir un nouveau mot de passe à la première connexion.',
  ].join('\n');
}

/**
 * Compte gestionnaire (company_admin) d'une compagnie, séparé de la création
 * de la compagnie. Le mot de passe généré par l'API n'est jamais affiché : il
 * part par WhatsApp (message pré-rempli, envoi validé par l'admin) vers le
 * numéro de la compagnie. Recréer le compte régénère le mot de passe.
 */
export default function CompteGestionnaire({ compagnie, onFermer }: { compagnie: Compagnie; onFermer: () => void }) {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [identifiants, setIdentifiants] = useState<Identifiants | null>(null);
  // Numéro WhatsApp destinataire : celui de la compagnie, sinon celui du gestionnaire.
  const [whatsapp, setWhatsapp] = useState(chiffresTelephone(compagnie.telephone ?? ''));
  const [envoye, setEnvoye] = useState(false);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!nom.trim() || !estTelephoneValide(telephone)) {
      setErreur('Renseignez le nom et un téléphone à 10 chiffres pour le gestionnaire.');
      return;
    }
    if (
      !confirm(
        `Créer le compte gestionnaire de ${compagnie.nom} ?\n` +
          'Si un compte existe déjà pour ce numéro, son mot de passe est régénéré et l’ancien ne fonctionnera plus.',
      )
    )
      return;
    setEnvoi(true);
    try {
      const compte = await compagniesApi.creerCompteAdmin(compagnie.id, { nom: nom.trim(), telephone: telephonePourApi(telephone) });
      setIdentifiants({ telephone: compte.telephone, motDePasse: compte.motDePasseTemporaire });
      if (!estTelephoneValide(whatsapp)) setWhatsapp(chiffresTelephone(telephone));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setEnvoi(false);
    }
  }

  function envoyerWhatsApp() {
    if (!identifiants || !estTelephoneValide(whatsapp)) return;
    window.open(lienWhatsApp(whatsapp, messageIdentifiants(compagnie.nom, identifiants)), '_blank', 'noopener,noreferrer');
    setEnvoye(true);
  }

  function fermer() {
    if (identifiants && !envoye && !confirm('Les identifiants n’ont pas été envoyés. Fermer quand même ? Il faudra régénérer le mot de passe.'))
      return;
    onFermer();
  }

  return (
    <Modal
      ouvert
      titre={`Compte gestionnaire — ${compagnie.nom}`}
      sousTitre="Mot de passe provisoire généré puis envoyé par WhatsApp à la compagnie, jamais affiché ici."
      onFermer={envoi ? undefined : fermer}
      largeur="max-w-lg"
    >
      {identifiants ? (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck className="h-4 w-4 text-success" strokeWidth={2} />
            Compte créé ({formatTelephone(identifiants.telephone)})
          </p>
          <p className="text-xs text-ink-soft">
            WhatsApp s’ouvre avec le message prêt (identifiant, mot de passe provisoire, lien de connexion) : il ne reste
            qu’à appuyer sur Envoyer.
          </p>
          <Field label="Numéro WhatsApp de la compagnie">
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={whatsapp}
              onChange={(e) => setWhatsapp(chiffresTelephone(e.target.value))}
              placeholder="0701020304"
            />
          </Field>
          <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
            <Button variant="ghost" onClick={fermer}>
              {envoye ? 'Terminé' : 'Fermer'}
            </Button>
            <Button onClick={envoyerWhatsApp} disabled={!estTelephoneValide(whatsapp)}>
              {envoye ? <Check className="h-4 w-4" strokeWidth={2} /> : <MessageCircle className="h-4 w-4" strokeWidth={1.75} />}
              {envoye ? 'Renvoyer par WhatsApp' : 'Envoyer par WhatsApp'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={creer} className="space-y-4">
          <Field label="Nom du gestionnaire">
            <Input value={nom} onChange={(e) => setNom(e.target.value)} autoFocus />
          </Field>
          <Field label="Téléphone du gestionnaire (identifiant de connexion)">
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="0701020304"
              value={telephone}
              onChange={(e) => setTelephone(chiffresTelephone(e.target.value))}
            />
          </Field>
          {erreur && <p className="text-sm text-danger">{erreur}</p>}
          <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
            <Button variant="ghost" onClick={onFermer} disabled={envoi}>
              Plus tard
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? 'Création…' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
