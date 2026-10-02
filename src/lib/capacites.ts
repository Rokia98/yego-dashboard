// Fonctionnalités de l'API dont dépend le dashboard, activées à la main quand
// la version de yego-api qui les porte est déployée (l'API n'expose pas sa
// version). Tant qu'un drapeau est `false`, le dashboard envoie quand même les
// paramètres (ignorés par l'API) ET filtre côté client en repli.

/** GET /reservations accepte statut, canal, paiement, du, au, q, compagnieId. */
export const FILTRES_RESERVATIONS_SERVEUR = false;

/**
 * GET /reservations accepte aussi reserveDu / reserveAu (date de réservation).
 * Tant que `false`, ces paramètres ne sont PAS envoyés (l'API rejette les
 * paramètres inconnus) et le filtre se fait côté client.
 */
export const FILTRE_DATE_RESERVATION_SERVEUR = false;

/** GET /departs accepte statut, du, au, trajetId, ordre. */
export const FILTRES_DEPARTS_SERVEUR = false;

/** GET /tickets/validations accepte resultat, du, au. */
export const FILTRES_VALIDATIONS_SERVEUR = false;

/**
 * Module support (/support/demandes…) déployé. Tant que `false`, les pages
 * Support affichent un message d'attente et n'appellent pas l'API.
 */
export const MODULE_SUPPORT = false;

/**
 * Intégration Jèko (API 0.28.0) : remboursements par transfert Mobile Money
 * (PATCH /remboursements/:id/confirmer { mode }) et module /reversements.
 * Tant que `false`, la confirmation d'un remboursement part sans body (constat
 * manuel, comportement d'avant) et les pages Reversements affichent un message
 * d'attente sans appeler l'API.
 */
export const JEKO = true;
