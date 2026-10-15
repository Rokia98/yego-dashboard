import { formatTelephone, lienWhatsApp } from '@/lib/telephone';

/** Numéro WhatsApp de l'équipe Yègo pour les compagnies partenaires. */
export const WHATSAPP_PARTENAIRES = '0798496595';

export const LIEN_WHATSAPP = lienWhatsApp(
  WHATSAPP_PARTENAIRES,
  'Bonjour Yègo, je souhaite inscrire ma compagnie de transport sur la plateforme.',
);

export const LIEN_APPEL = `tel:+225${WHATSAPP_PARTENAIRES}`;

export const TELEPHONE_AFFICHE = formatTelephone(WHATSAPP_PARTENAIRES);

/** Fiche Play Store de l'app voyageurs (package Android de yego-mobile). */
export const LIEN_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.compagny.yego';
