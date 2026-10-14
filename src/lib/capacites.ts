// Fonctionnalités de l'API dont dépend le dashboard, activées à la main quand
// la version de yego-api qui les porte est déployée (l'API n'expose pas sa
// version). Tant qu'un drapeau est `false`, le dashboard envoie quand même les
// paramètres (ignorés par l'API) ET filtre côté client en repli.

/** GET /reservations accepte statut, canal, paiement, du, au, q, compagnieId. */
export const FILTRES_RESERVATIONS_SERVEUR = true;

/**
 * GET /reservations accepte aussi reserveDu / reserveAu (date de réservation).
 * Tant que `false`, ces paramètres ne sont PAS envoyés (l'API rejette les
 * paramètres inconnus) et le filtre se fait côté client.
 */
export const FILTRE_DATE_RESERVATION_SERVEUR = true;

/** GET /departs accepte statut, du, au, trajetId, ordre. */
export const FILTRES_DEPARTS_SERVEUR = true;

/** GET /tickets/validations accepte resultat, du, au. */
export const FILTRES_VALIDATIONS_SERVEUR = true;

/**
 * Module support (/support/demandes…) déployé. Tant que `false`, les pages
 * Support affichent un message d'attente et n'appellent pas l'API.
 */
export const MODULE_SUPPORT = true;

/**
 * Le gestionnaire (company_admin, perm support:compagnie) voit et traite les
 * demandes des voyageurs liées à sa compagnie (réservation jointe) : onglets
 * « Demandes des voyageurs » (origine=voyageur) / « Mes demandes à Yègo »
 * (origine=compagnie), réponse, statut, priorité. Pas de notes internes. Tant
 * que `false` : le gestionnaire ne voit que ses propres demandes.
 */
export const SUPPORT_COMPAGNIE = true;

/**
 * Intégration Jèko (API 0.28.0) : remboursements par transfert Mobile Money
 * (PATCH /remboursements/:id/confirmer { mode }) et module /reversements.
 * Tant que `false`, la confirmation d'un remboursement part sans body (constat
 * manuel, comportement d'avant) et les pages Reversements affichent un message
 * d'attente sans appeler l'API.
 */
export const JEKO = true;

/**
 * Nouveau circuit de reversement : la compagnie demande, l'admin valide, Jèko
 * transfère vers le numéro de Yègo (POST /reversements et /approuver exigent
 * `moyen`), puis l'admin remet l'argent en main propre et le déclare (POST
 * /reversements/:id/remise). Inclut le solde compagnie (GET /dashboard/solde)
 * et les retraits de la part Yègo (/retraits). Tant que `false` : ancien
 * circuit (transfert direct vers le compte de la compagnie), blocs masqués et
 * page Retraits en attente. Nécessite JEKO.
 */
export const DEMANDES_REVERSEMENT = true;

/**
 * GET /utilisateurs filtrable (role, compagnieId, actif, q) avec total dans
 * l'en-tête X-Total-Count (exposé par CORS). Tant que `false`, la page
 * Utilisateurs affiche un message d'attente.
 */
export const LISTE_UTILISATEURS = true;
