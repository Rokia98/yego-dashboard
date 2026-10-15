# Yègo Dashboard

Back-office web (Next.js 16, App Router, React 19) de la plateforme **Yègo** — deux espaces :

- `/compagnie` — pilotage quotidien d'une compagnie partenaire (`agent` / `company_admin`) :
  vente au guichet, trajets, départs + suivi GPS, réservations, remboursements, contrôles, flotte,
  agents, abonnement.
- `/admin` — supervision réseau pour l'équipe Yègo (`admin`) : compagnies, réservations,
  remboursements, abonnements, journal d'audit.

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL -> l'API yego-api
npm run dev
```

Le dashboard démarre sur `http://localhost:3001`. `yego-api` doit tourner en parallèle
(`http://localhost:3000/api/v1` par défaut). Après tout changement de contrat API, pensez à
`docker compose up -d --build` côté `yego-api`.

Comptes de démonstration : voir le seed de `yego-api` (téléphones `0700000001` admin,
`0700000002` company_admin, `0700000003` agent). Les mots de passe ne sont pas
reproduits ici : ce seed est réservé au développement et ne doit jamais tourner
sur une base de production.

## Structure

```
src/
  app/
    page.tsx                       -> landing page publique (statique, composant serveur)
    connexion/page.tsx             -> connexion (redirige selon le rôle du JWT)
    compagnie/
      page.tsx                     -> vue d'ensemble (stats 30 j, top trajets)
      guichet/page.tsx             -> vente au comptoir + QR imprimable + rafraîchissement des places
      trajets/page.tsx             -> création / activation / suppression
      departs/page.tsx             -> planning, démarrage GPS, signalement de retard
      departs/[id]/suivi/page.tsx  -> carte de suivi temps réel (polling)
      reservations/page.tsx        -> liste (filtre statut sur les lignes chargées), annulation, encaissement guichet
      remboursements/page.tsx      -> remboursement des voyageurs : transfert Jèko, ou constat manuel si le billet
                                      n'a pas été payé via Jèko / déjà reversé (company_admin ; API 0.30.1)
      reversements/page.tsx        -> « Mes reversements » : aperçu à venir, historique, compte Mobile Money (company_admin)
      controles/page.tsx           -> journal des scans de tickets (lecture seule)
      flotte/page.tsx              -> véhicules + chauffeurs
      agents/page.tsx              -> agents guichet (company_admin)
      abonnement/page.tsx          -> lecture seule (company_admin)
      support/page.tsx             -> « Mes demandes » à l'équipe Yègo (création, suivi, réponse, clôture)
    admin/
      page.tsx                     -> santé réseau (stats 30 j + top compagnies + occupation)
      compagnies/page.tsx          -> CRUD compagnies, activation, suivi abonnement
      reservations/page.tsx        -> supervision globale, filtre compagnie (sur les lignes chargées)
      remboursements/page.tsx      -> supervision + confirmation réseau
      reversements/page.tsx        -> solde Jèko, aperçu par compagnie, déclenchement des reversements, historique
      abonnements/page.tsx         -> création / renouvellement
      audit/page.tsx               -> journal d'audit (audit:read)
      support/page.tsx             -> demandes de support (compagnies + voyageurs) : fil, notes internes, statuts

  components/
    layout/   -> DashboardShell, PageHeader, Sidebar (nav groupée + tiroir mobile + bascule de thème)
    ui/       -> Badge, Button, Card, Field, Table, StatCard, TicketQr, TraceGps, SeatMap, LoadMore
    charts/   -> AreaChart, Sparkline, Donut, BarsH, Meter (SVG maison, sans dépendance)

  features/<domaine>/   -> api.ts (appels via lib/http) + types.ts + index.ts
    abonnements, agents, audit, compagnies, dashboard, departs, flotte, paiements,
    remboursements, reservations, suivi, tickets, villes

  lib/
    session.ts     -> stockage des jetons, décodage JWT, refresh unique partagé, accessTokenValide()
    http.ts        -> apiFetch<T> (JWT + refresh silencieux sur 401 + redirection)
    auth.ts        -> utilisateur courant (`role`/`cid`), useAuthGuard (refresh si jeton expiré), logout
    nav.ts         -> navigation par espace, regroupée en sections, filtrée par rôle (`roles`)
    theme.ts       -> thème clair/sombre (script anti-FOUC, useTheme, persistance localStorage)
    pagination.ts  -> usePagedList (pagination "charger plus" — l'API ne renvoie pas de total)
    telephone.ts   -> saisie 10 chiffres locaux (chiffresTelephone / estTelephoneValide / formatTelephone)
    motdepasse.ts  -> génération de mot de passe temporaire (crypto)
    image.ts       -> fichier image -> data-URI redimensionné (logo compagnie)
    export.ts      -> export CSV client (versCsv / telechargerCsv)
    format.ts      -> formatFcfa / formatPourcentage / formatDate / formatHeure / formatDateHeure
    annulation.ts  -> barème de remboursement + message de confirmation
```

## Téléphone

Saisie **10 chiffres locaux sans indicatif** (`0701020304`) sur login, création
d'agent et création de compagnie. Le client envoie les 10 chiffres bruts ;
l'API (0.22.0+) les normalise en E.164 (`+225…`). `formatTelephone()` réaffiche
un numéro stocké en `07 01 02 03 04`.

## Sidebar

Fixe sur desktop (`position: fixed`, le contenu défile seul, décalé de `lg:pl-64`).
Sur mobile : barre supérieure + tiroir latéral. Navigation regroupée en sections.

## Pagination

Toutes les listes s'affichent **par pages de 10** (`TAILLE_PAGE`), avec en pied de
tableau « 11–20 sur 45 » + Précédent / numéros / Suivant (`components/ui/Pagination`).

L'API pagine par `skip`/`take` (défaut 10, plafond 100), renvoie un tableau nu
sans total. `usePagedList(fetcher, resetKey, take)` lit les lignes par lots,
expose `pageItems` + `pagination`, et lit la suite côté API quand on dépasse les
pages chargées (« 45+ » tant que la fin n'est pas atteinte ; total exact via
l'option `total`, ex. `X-Total-Count` des utilisateurs). Les listes complètes
(agents, flotte, trajets, compagnies, abonnements) sont paginées côté client par
`<ListePaginee items cle>`.

Faute de total et de filtres serveur, les filtres statut/compagnie des réservations
et les compteurs « affichés » portent **sur les lignes déjà chargées** (l'écran le
signale). L'export CSV pagine jusqu'à 2000 lignes et prévient s'il est tronqué.

## Guichet

Parcours en 3 étapes + récapitulatif (`compagnie/guichet/page.tsx`) :

1. **Départ** — uniquement les départs *vendables* (`estVendable` : planifié, places
   libres, date + heure pas encore passées), triés par heure, groupés par jour,
   filtrables (aujourd'hui / demain, trajet). Liste rafraîchie toutes les 20 s ; un
   départ qui cesse d'être vendable est désélectionné avec un avertissement.
2. **Places** — placement libre (compteur) ou choix des sièges sur le plan
   (`GET /departs/:id/sieges`, rafraîchi toutes les 8 s ; un siège vendu entre-temps
   est retiré de la sélection). 10 places max par vente.
3. **Passager & paiement** — téléphone 10 chiffres ; en mobile money, l'agent doit
   cocher qu'il a vérifié la réception du montant.

Après validation : si le paiement est enregistré, les tickets sont générés
automatiquement (reprise des tickets déjà émis, jamais plus que de places) et
imprimables en une fois. Si l'encaissement échoue, la réservation existe quand même :
l'écran le dit et renvoie vers Réservations (pas de revente). Un `409` resynchronise le plan.

## Filtres

Barre commune (`components/ui/Filtres.tsx`) + `useFiltres` (`lib/filtres.ts`) : état
synchronisé avec l'URL (rechargement / lien partagé), recherche debouncée,
« Réinitialiser (n) ».

- Réservations (compagnie + admin, composant `ListeReservations`) : **par défaut les
  réservations faites aujourd'hui** (« Réservations du jour » ; raccourcis Hier, 7 derniers
  jours, Toutes). Aussi : recherche nom / téléphone / n°, statut, canal, paiement, date de
  départ, compagnie (admin). L'export CSV applique les mêmes filtres.
- Départs : à venir / aujourd'hui / passés / tous, statut, trajet.
- Contrôles : résultat (validés / refusés), date du scan.
- Remboursements : statut + recherche ; audit : entité / événement (valeurs réelles de l'API).
- Compagnies, abonnements, trajets (listes complètes) : filtrage local.

La date de réservation (`reserveDu`/`reserveAu`) a son propre drapeau
(`FILTRE_DATE_RESERVATION_SERVEUR`) : non envoyée tant qu'il est à `false`.
Les filtres serveur de `GET /reservations`, `GET /departs` et `GET /tickets/validations`
arrivent avec yego-api 0.26.0. Tant que `lib/capacites.ts` les déclare absents, le
dashboard envoie les paramètres **et** filtre côté client : `usePagedList` (option
`filtreLocal`) lit alors des pages successives jusqu'à remplir l'écran. Passer les
drapeaux à `true` une fois l'API déployée. L'API rejette les paramètres inconnus ou
vides : n'envoyer que les noms documentés, via `toQuery` (qui omet les valeurs vides).

## Thème & design

Les couleurs sont pilotées par des variables CSS en canaux `R G B` (`globals.css`),
consommées par Tailwind via `rgb(var(--x) / <alpha-value>)`. Le thème sombre ne
redéfinit que les **valeurs** sous `:root[data-theme="dark"]` — aucune variante
`dark:` dans le markup. Le thème initial est posé avant le premier paint par un
script inline (`THEME_INIT_SCRIPT`) et se bascule depuis la sidebar.

Les graphiques (`components/charts/`) sont des composants SVG maison sans
dépendance (courbe lissée par interpolation cubique monotone, dégradés, survol) —
léger pour les connexions 3G/4G, style entièrement maîtrisé.

**Convention** : une page (`app/**/page.tsx`) reste fine — elle compose `DashboardShell` +
`PageHeader` + des primitives `ui/`, et parle à l'API uniquement via `features/*/api.ts`, jamais
via `fetch` direct. Toute nouvelle ressource s'ajoute comme un dossier `features/<domaine>/`.

## Contrat API

- **Montants** : l'API sérialise les `Decimal` en **chaîne** (`"15000"`). Toujours passer par
  `formatFcfa` — ne jamais afficher `montant`/`prix` brut.
- **Auth** : access token 15 min, refresh rotatif 30 j. `useAuthGuard` rafraîchit la session au
  chargement d'une page si l'access token est expiré ; `lib/http.ts` tente un refresh unique et
  silencieux sur 401, rejoue la requête, puis redirige vers `/connexion` en cas d'échec.
- **Scoping** : `/reservations`, `/vehicules`, `/chauffeurs`, `/agents`, `/tickets`,
  `/remboursements`, `/dashboard/*` sont auto-filtrés par la compagnie du JWT (`cid`).
  `/departs` accepte `?compagnieId=`. `/trajets` non scopé -> `/trajets/compagnie/:id`.
- **Temps réel** : pas de WebSocket. Le guichet et la page de suivi GPS font du polling léger.
- **Anti-surbooking** : géré côté serveur (transaction + expiration à 30 min). Le dashboard se
  contente de rafraîchir l'affichage et de gérer un éventuel `409`.

## Permissions (rappel)

Rôle + compagnie viennent du payload JWT (`role`, `cid`), décodés dans `lib/auth.ts`. Chaque page
appelle `useAuthGuard([...roles])` ; la sidebar masque les entrées dont le `roles` (dans `nav.ts`)
exclut l'utilisateur. Ces contrôles ne pilotent que l'affichage : l'API reste seule garante des droits. Restrictions plus fines côté formulaires :
`trajet:manage` / `flotte` (véhicules, chauffeurs) → `company_admin` ; `depart:manage` /
`reservation:guichet` → `agent` inclus ; `remboursement:confirm` → `company_admin` ;
`dashboard:read` exclut l'`agent`.

## Création de compagnie (`/admin/compagnies`)

- Logo : fichier image → data-URI redimensionné (256px), envoyé dans `logoUrl`
  à `POST /compagnies` (API 0.22.0+), vignette affichée en liste.
- Bouton « Créer une compagnie » → formulaire en modale (`components/ui/Modal`) ; le téléphone
  saisi est le numéro WhatsApp de la compagnie.
- Compte gestionnaire, séparé de la création (action « Compte gestionnaire » par ligne, en
  modale, ouverte automatiquement après la création) : `POST /compagnies/:id/compte-admin` crée (ou régénère)
  un `company_admin` avec un mot de passe temporaire **jamais affiché** : « Envoyer par
  WhatsApp » ouvre `wa.me` vers le numéro de la compagnie avec les identifiants pré-remplis,
  l'admin valide l'envoi (`components/compagnies/CompteGestionnaire`).
- Documents (registre de commerce, autorisation de transport, pièce d'identité du
  gérant) : panneau dépliable par compagnie (`components/documents/DocumentsPanel`),
  upload multipart, aperçu (blob authentifié), suppression, et validation/refus
  par l'admin (API 0.24.0+, stockage sur volume Docker `yego_uploads`).
  Le même panneau est réutilisé côté compagnie sur `/compagnie/documents`
  (dépôt uniquement, pas de modération).

## Changement de mot de passe

`/changer-mot-de-passe` — accessible à tout moment depuis la sidebar, et imposé
automatiquement (`useAuthGuard`, quelle que soit la page visée) quand le claim
JWT `pwTmp` est vrai (mot de passe généré via `POST /compagnies/:id/compte-admin`,
en attente de changement). `PATCH /auth/mot-de-passe` réémet une session
(accessToken/refreshToken) que la page enregistre directement — pas besoin de se
reconnecter après le changement. Agents non concernés (mot de passe choisi par
leur créateur, pas généré par le système).

## Reversements, demandes et retraits

Circuit (prochaine version de l'API) : la compagnie demande → l'admin valide en choisissant
Wave ou Orange → Jèko transfère vers le **numéro de Yègo** (jamais vers la compagnie) →
l'admin remet l'argent **en main propre** et le déclare. Le compte Mobile Money de la
compagnie n'est plus utilisé, le délai de sécurité de 24 h disparaît.

- **Compagnie** (`/compagnie/reversements`) : solde (`GET /dashboard/solde` : disponible,
  en attente, en cours de remise, déjà reçu), demande de reversement (`POST /reversements/demandes`,
  une seule en attente, annulable), historique des demandes et des reversements (remis le…). Le
  solde disponible est aussi rappelé sur la vue d'ensemble.
- **Admin** (`/admin/reversements`) : file des demandes, Approuver (`{ moyen }`) ou Rejeter (motif
  transmis à la compagnie). Si Jèko refuse, la demande reste en attente. Le reversement direct
  exige aussi `moyen`. Historique filtrable « À remettre » (`aRemettre=true`) avec
  « Marquer comme remis » + note (`POST /reversements/:id/remise`).
- **Retraits Yègo** (`/admin/retraits`) : retrait de la part Yègo vers le numéro fixé côté API
  (`RETRAIT_YEGO_TELEPHONE`, Wave / Orange Money). Retirable = solde Jèko − engagements, frais
  Jèko du retrait déjà déduits ; mot de passe redemandé, un seul retrait en cours à la fois.
- **Montant de la demande** (`MONTANT_DEMANDE`) : la compagnie peut saisir le montant voulu
  (≥ 100, ≤ disponible ; vide = tout le disponible). L'approbation reverse au plus ce montant,
  en billets entiers, les plus anciens d'abord.
- **Solde par canal** (`SOLDE_PAR_CANAL`) : solde global, ventes en ligne (payées via Jèko) et
  ventes au guichet (encaissées directement par la compagnie, détail par moyen de paiement).
- **Frais de service** : 3,5 % en ligne (lu sur l'API, rien en dur).
- **Utilisateurs** (`/admin/utilisateurs`) : `GET /utilisateurs` filtré (rôle, compagnie, état,
  recherche) ; total lu dans `X-Total-Count` (`apiFetchAvecTotal`, en-tête exposé par CORS) ;
  changement de rôle (`PATCH /utilisateurs/:id/role`, coupe les sessions).

Drapeaux `DEMANDES_REVERSEMENT`, `LISTE_UTILISATEURS` et `SUPPORT_COMPAGNIE` (gestionnaire :
onglets « Demandes des voyageurs » / « Mes demandes à Yègo », réponse au nom de la compagnie)
dans `lib/capacites.ts` : activés avec yego-api 0.30.0. Ne pas repasser `DEMANDES_REVERSEMENT`
à `false` : l'API refuse désormais `POST /reversements` sans `moyen`.

## À compléter

- Fil de notifications in-app (`GET /notifications`).

## Support

Module de demandes (`features/support`, `components/support`), sur le contrat
`/support/demandes` de yego-api (création, fil de messages, statuts
ouverte → en_cours → resolue / fermee, priorité, `GET /support/compteurs`).

- **Compagnies** (`/compagnie/support`) : « Mes demandes ». Agents et gestionnaires
  ouvrent des demandes à l'équipe Yègo, les suivent, y répondent et les clôturent. Chacun
  ne voit que les siennes (pas de file de traitement côté compagnie).
- **Admin** (`/admin/support`) : seul traitant (`support:manage`). Toutes les demandes, filtres statut / catégorie /
  origine / compagnie, prise en charge, résolution, priorité, **notes internes**
  (jamais renvoyées au demandeur).
- **Voyageurs** : depuis l'app mobile (yego-mobile), même API.

Tant que `MODULE_SUPPORT` vaut `false` (`lib/capacites.ts`), les pages affichent un
message d'attente et n'appellent pas l'API.

## Déploiement (Vercel)

1. Le dépôt GitHub doit être à jour (branche `main`).
2. Sur vercel.com : **Add New → Project** → importer `yego-dashboard`. Le framework Next.js est
   détecté : garder les commandes par défaut (`npm run build`, Node ≥ 20.9).
3. **Environment Variables** (Production) :
   `NEXT_PUBLIC_API_URL = https://yego-api.onrender.com/api/v1` — URL complète, préfixe `/api/v1`
   inclus (le client ne l'ajoute pas). Le build échoue volontairement si elle manque.
   Variable `NEXT_PUBLIC_*` : elle est figée au build, toute modification impose un redéploiement.
4. **Deploy**, puis ajouter l'URL obtenue (`https://<projet>.vercel.app`, et le domaine perso
   éventuel) à `CORS_ORIGIN` de l'API sur Render — sans slash final. Sans cela, la connexion
   échoue (« Failed to fetch »).

Les déploiements *preview* ont une URL différente à chaque fois : ils sont refusés par CORS.
Tester sur l'URL de production. Les jetons sont stockés en `localStorage` et envoyés en
`Authorization: Bearer` : aucun cookie inter-domaines n'est nécessaire. L'URL de l'API est aussi
autorisée dans la CSP (`connect-src`, cf. `next.config.js`).

## Sécurité

Côté dashboard :

- **En-têtes** (`next.config.js`) : CSP (`connect-src` limité à l'origine de l'API,
  `frame-ancestors 'none'`, `base-uri`/`form-action` verrouillés), `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. `NEXT_PUBLIC_API_URL` est
  obligatoire pour un build de production. `script-src` garde `'unsafe-inline'`
  (hydratation App Router) : ne jamais injecter de HTML non échappé.
- **Optimiseur d'images désactivé** (`images.unoptimized`) : `/_next/image` répond 404.
- **Aperçu des documents** : seuls PDF/PNG/JPEG sont affichés, avec le type imposé
  côté client ; tout autre contenu est téléchargé, jamais rendu (une URL `blob:` a
  l'origine du dashboard).
- **Impression des tickets** : toutes les valeurs sont échappées avant `document.write`.
- **Export CSV** : les cellules commençant par `= + - @` sont neutralisées (`'`).
- **Jetons** : stockés en `localStorage` (limite connue : lisibles par un script
  injecté). Migration recommandée : refresh token en cookie `HttpOnly; Secure;
  SameSite=Strict` — nécessite un changement de `yego-api`.

Contrôles qui **doivent** être appliqués par l'API (le front ne fait que masquer) :

- refuser tout jeton `pwTmp` hors `PATCH /auth/mot-de-passe` ;
- rôles : écritures trajets/flotte/agents/remboursements réservées à `company_admin`,
  modération des documents à `admin` ;
- cloisonnement par `cid` sur toutes les routes à identifiant (`/compagnies/:id/documents`,
  `/departs/:id/*`, `/tickets/reservation/:id`, `/abonnements/compagnie/:id`, …) ;
- documents : vérifier le contenu réel (magic bytes), servir avec
  `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` ;
- tickets : pas plus de billets valides que de places réservées ;
- encaissement mobile money au guichet : exiger une référence de transaction vérifiable ;
- agents : imposer le changement du mot de passe choisi par le gestionnaire (claim `pwTmp`).
