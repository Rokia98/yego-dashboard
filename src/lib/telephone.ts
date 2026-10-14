// Saisie du téléphone : 10 chiffres locaux (Côte d'Ivoire), sans indicatif.
// Ex. « 07 01 02 03 04 » -> « 0701020304 ».

/** Ne garde que les chiffres et retire un éventuel indicatif 225 en tête. */
export function chiffresTelephone(saisie: string): string {
  let d = (saisie || '').replace(/\D/g, '');
  if (d.startsWith('225') && d.length > 10) d = d.slice(3);
  return d.slice(0, 10);
}

export function estTelephoneValide(saisie: string): boolean {
  return /^\d{10}$/.test(chiffresTelephone(saisie));
}

/** Format affiché : 07 01 02 03 04 */
export function formatTelephone(saisie: string): string {
  const d = chiffresTelephone(saisie);
  return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/**
 * Lien WhatsApp (wa.me) vers un numéro ivoirien, message pré-rempli : ouvre
 * WhatsApp (application ou Web) sur la conversation, l'envoi reste manuel.
 */
export function lienWhatsApp(saisie: string, message: string): string {
  return `https://wa.me/225${chiffresTelephone(saisie)}?text=${encodeURIComponent(message)}`;
}

/**
 * Forme envoyée à l'API. Depuis l'API 0.22.0, la normalisation E.164 est faite
 * côté serveur (@Transform sur tous les DTO à téléphone) : on envoie les
 * 10 chiffres bruts, l'API préfixe `+225`.
 */
export function telephonePourApi(saisie: string): string {
  return chiffresTelephone(saisie);
}
