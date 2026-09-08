# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Mon Florian |
| Propriétaire | `nclsppr` |
| Classe | Critique |
| Surface Cloudflare | Web actif sur l'apex, `www` et `workers.dev`, envoi transactionnel fermé |
| Domaine public | `monflorian.com` sur Cloudflare Workers |
| Décisions courantes | [ADR-0007](docs/decisions/adr-0007-runtime-et-production-cloudflare.md), [ADR-0008](docs/decisions/adr-0008-domaine-web-only-cloudflare.md), [ADR-0009](docs/decisions/adr-0009-courriel-transactionnel-cloudflare.md), [ADR-0011](docs/decisions/adr-0011-contrat-guide-voyage-et-plan-images.md), [ADR-0012](docs/decisions/adr-0012-v2-site-principal.md) et [ADR-0013](docs/decisions/adr-0013-ios-natif-et-api-commune.md) |
| Licence | Aucune licence de réutilisation accordée |

## Problème

Préparer un voyage demande de relier une envie personnelle, un rythme réaliste,
des trajets et des réservations dispersées. Mon Florian rend cette préparation
lisible avec un carnet d'exemple, des guides et un pense-bête. La production d'un
itinéraire personnalisé reste une capacité cible fermée.

## Utilisateurs et résultat attendu

Le site permet de lire un exemple public de dix jours au Japon,
préparer un pense-bête local et cocher les vérifications du carnet. Ces outils
ne créent aucune demande et ne réservent rien. Les pages publiques contiennent
uniquement du contenu éditorial et des personnages fictifs.

### MVP personnalisé cible

Dans le futur parcours personnalisé commun au site et à l'app iOS, une personne
décrit son envie, ajoute des dates et le nombre de voyageurs. Dès la première
étape, elle peut sélectionner une à quatre photos pour les illustrations ou
continuer sans photo. La sélection reste locale jusqu'à l'action d'envoi et au
consentement qui explique le traitement par OpenAI. Le récapitulatif précède
la commande. Le carnet final contient :

- un itinéraire structuré et signalé comme projection ;
- des points à vérifier avant réservation ;
- des recherches d'hébergement externes ou des liens affiliés approuvés ;
- des images éditoriales générées, signalées comme projections synthétiques ;
- une échéance et une action de suppression anticipée.

Les premiers pilotes restent gratuits. L'offre cible approuvée le 8 septembre
2026 est un achat ponctuel d'environ 30 euros par voyage, pour le groupe, avec
StoreKit 2 sur iOS. Le prix réel viendra du produit Apple localisé. Paiement,
reprise d'un carnet payé sur un autre appareil et conservation couvrant le
séjour restent à prouver avant vente. L'ancienne offre à 50 euros est remplacée
par cette direction. Stripe pour le web, le PDF produit par le service, le
compte client et le Voyage vivant restent non livrés.

## Périmètre courant

### Livré avant la promotion

- Interface HTML, CSS et JavaScript native.
- Worker TypeScript qui sert les assets et les routes API publiques.
- Contrats OpenAPI, validateurs métier et adaptateurs OpenAI testés avec fakes.
- D1 en juridiction UE avec schéma de cycle de vie vide.
- Bucket R2 privé en juridiction UE, sans URL publique, avec expirations de
  secours à 24 heures et 30 jours.
- Workflow Cloudflare déployé mais fermé.
- Booking en mode `external`, sans affiliation annoncée.
- Aperçu Cloudflare public qui refuse toute génération.
- Custom Domains `monflorian.com` et `www.monflorian.com` actifs en HTTPS.
- Famille validée de cinq portraits V2 sur l'accueil, avec rotation aléatoire
  et choix facultatif par `?avatar=`.
- Parcours éditorial isolé sous `/v2`, hors index, avec questionnaire Astryx,
  carnet déterministe de dix jours alimenté statiquement par la fixture Japon
  canonique, trois exemples, liens Booking.com et simulation de partage public
  ou privé par mot de passe, sans protection serveur.

### Livré le 7 septembre 2026 : V2 principale

La [PR #54](https://github.com/nclsppr/monflorian/pull/54) a livré la promotion
décidée dans l'ADR-0012. Son commit fusionné est
`f0d8411530f0d6002c70f206f1c716169b22a184`. La version Worker
`f3ffeb1e-0e3d-44ce-8eb3-82ab39c6f4d2` reçoit 100 % du trafic. Les contrôles
de `main` et les sondes publiques passent ; leurs preuves figurent dans
`STATUS.md` et `DELIVERY-EVIDENCE.md`.

- Cinq pages pré-rendues en HTML depuis React : `/`,
  `/carnets/japon-10-jours`, `/guides`,
  `/guides/preparer-itineraire-voyage` et
  `/guides/japon-10-jours-preparer-voyage`.
- Hydratation React pour les outils interactifs ; carnet, guides, navigation et
  inspirations lisibles sans JavaScript.
- Redirection permanente `308` de l'ancienne entrée `/v2` vers le nouveau site,
  avec migration des liens de carnet et d'inspiration historiques.
- Pense-bête en trois étapes avec récapitulatif, copie et téléchargement texte.
  Son enregistrement dans le navigateur exige le bouton explicite prévu à cet
  effet. Les modifications suivantes ne sont enregistrées qu'après un nouveau
  clic.
- Checklist du carnet enregistrée localement à chaque case cochée ou décochée,
  avec explication visible et remise à zéro. Cocher signifie vérifier, jamais
  réserver.
- Partage du lien public du carnet, sans mot de passe simulé ni transmission du
  pense-bête ou de la checklist. Impression depuis le navigateur.
- Métadonnées propres aux cinq pages, sitemap, liens internes et sources
  éditoriales. Ces moyens ne prouvent aucun classement dans les moteurs.

Aucune API, aucun secret, aucun fournisseur et aucun drapeau d'activation ne
changent. La création personnalisée, les photos, le courriel et les paiements
restent fermés. La preuve de publication appartient à `STATUS.md` et
`DELIVERY-EVIDENCE.md`.

### Client iOS et API commune candidats du 8 septembre 2026

L'ADR-0013 autorise une app SwiftUI iOS 18 et versions suivantes dans le même
dépôt. Le candidat prépare un brouillon local, propose les photos facultatives
dès la première étape et rend le carnet Japon natif hors ligne. Les photos
réencodées restent en mémoire et sont exclues du brouillon enregistré.

Le préfixe `/api/v1` expose la configuration, l'exemple public et les alias des
routes de voyage existantes. Le Worker et les contrôles coûteux restent les
mêmes. La projection de lecture `TravelGuideV1` sert aux deux clients. Les
droits de création native et StoreKit restent fermés. L'app ne transmet aucun
brief ni photo et ne lance aucun achat. Les commandes et les limites du
candidat figurent dans [le guide iOS](docs/native-ios.md).

Le code local, les contrôles, le simulateur et une future distribution sont
consignés séparément dans `STATUS.md` et `DELIVERY-EVIDENCE.md`.

### Contrat dynamique candidat non intégré

- Contrat dynamique `TravelGuideV1`, validation métier et compilation contrôlée
  des consignes d'image, sans branchement au Workflow ni à OpenAI.

### À livrer avant une génération réelle

- Déployer puis éprouver la création asynchrone et la page privée à jeton.
- Prouver le chiffrement, la suppression anticipée et la purge sur des données
  synthétiques.
- Secret OpenAI, code d'accès, preuve réelle du courriel et budget fournisseur.
- Premier appel OpenAI synthétique avec coût et journaux inspectés.
- Courriel transactionnel et preuve synthétique du nettoyage automatique.
- Notice de traitement et canal de droits.

### Non-objectifs du MVP

- Réserver automatiquement un billet, un hôtel ou une activité.
- Afficher en direct prix, disponibilité, note ou garantie.
- Scraper Booking.com ou utiliser son API Demand.
- Exposer une galerie personnelle ou un voyage privé indexable. Le carnet
  éditorial Japon de l'ADR-0012 est un exemple public distinct.
- Garder des photos d'entrée au-delà du traitement.
- Ouvrir Stripe avant la preuve du parcours gratuit.

## Architecture

### Composants

| Composant | Rôle | Source | État |
| --- | --- | --- | --- |
| Worker | API, sécurité, rendu de la page privée et accès aux bindings | `src/worker.ts` | déployé, génération fermée |
| Client iOS | SwiftUI, préparation locale, carnet et StoreKit 2 fermé | `ios/`, `scripts/ios-generate.py` | candidat local, aucune distribution Apple |
| API commune versionnée | Configuration, exemple public et alias compatibles | `/api/v1`, `docs/api/openapi.json` | candidat local, création native fermée |
| Site principal | HTML pré-rendu et hydratation React | `app/v2/src/main.jsx`, `Planner.jsx`, `Guides.jsx`, `scripts/prerender-site.mjs` | publié le 7 septembre 2026 |
| Static Assets | HTML dérivé, ressources publiques et visuels canoniques | `dist/` depuis `app/v2/`, `app/public/` et `assets/brand/` | distribution Cloudflare active, cinq pages pré-rendues publiées |
| Coeur métier | Validation des briefs, photos, résultats et liens | `app/core.mjs` | réutilisé, tests locaux |
| Adaptateur OpenAI | Responses et Image Edits sans SDK | `app/openai.mjs` | non appelé en production |
| Contrat de guide candidat | Fixture statique, schéma, validation métier et compilation d'image | `contracts/`, `app/travel-guide.mjs`, `app/v2/src/data.js` | fixture du carnet Japon, génération dynamique non intégrée |
| Données locales de préparation | Pense-bête et cases de vérification | `app/v2/src/planner-state.mjs`, `app/v2/src/main.jsx` | publié le 7 septembre 2026, navigateur seulement |
| D1 | États, quotas, données chiffrées et jetons hachés | `migrations/` | base vide, schéma appliqué |
| R2 | Photos d'entrée et images générées | binding `MEDIA` | bucket privé UE créé, vide, binding déployé |
| Workflows | Traitement durable et notification | `src/workflows/` | texte et image câblés, garde-fous fermés |
| Turnstile | Réduction de l'abus gratuit | clé publique et Worker Secret | widget géré configuré, parcours fermé |
| Courriel | Envoi du lien privé | binding Cloudflare `EMAIL` | domaine actif, code câblé, drapeau fermé |
| StoreKit 2 | Achat ponctuel iOS futur et droit serveur | client SwiftUI puis validation serveur | client candidat, achat et validation serveur fermés |
| Stripe | Paiement ponctuel web futur | Checkout Sessions et webhook | hors tranche |
| Documentation Nimbus | Rendu des contrats | `docs-nimbus/` | local et CI |

Pages, KV, Queues, Durable Objects, Vectorize, Workers AI et Containers ne sont
pas requis dans le MVP. TypeScript remplace le backend serveur : Java ajouterait
un conteneur et une seconde chaîne d'exploitation sans bénéfice actuel.

Les sources canoniques du nouveau site vivent sous `app/v2/src/`. Le nom de ce
répertoire reste technique et ne crée pas une seconde version publique. Le
build remplace l'accueil de `dist/` par son HTML pré-rendu. L'ancien
`app/public/index.html` est conservé comme source historique, mais ne constitue
plus l'accueil servi depuis le 7 septembre 2026. Les fichiers historiques
`styles.css` et `app.js` restent conservés ; la notice et le rendu privé peuvent
encore consommer leurs ressources communes. Ne jamais modifier `dist/` à la main.

### Flux cible

```text
navigateur
  -> Worker + Turnstile
      -> D1 : état, quota, jeton haché, données chiffrées
      -> R2 : photos privées et images générées
      -> Workflow
          -> OpenAI Responses
          -> OpenAI Image Edits
          -> Cloudflare Email Service

navigateur
  -> /voyages/{jeton}
      -> Worker -> D1 + R2

navigateur
  -> Booking.com au clic explicite
```

Le client iOS rejoint le même Worker par `/api/v1`. Dans le candidat, il lit
seulement configuration et exemple public. Son futur achat doit être associé
à une commande vérifiée côté serveur. Il ne contourne pas les protections
Turnstile du parcours web.

Le Workflow reçoit des identifiants et des clés R2, pas les photos dans ses
paramètres. Le Worker rend la page depuis un template commun et des données
structurées ; il ne stocke pas une copie HTML par voyage.

## Dépendances externes

| Dépendance | Usage | Échec sûr |
| --- | --- | --- |
| Cloudflare Workers | Runtime et distribution | revenir à une version Worker précédente |
| D1 | Métadonnées et état | fermer la création, garder les lectures existantes |
| R2 | Images privées | fermer les photos et préserver les objets existants |
| Workflows | Traitement asynchrone | laisser le voyage en échec explicite sans retry payant aveugle |
| OpenAI Responses | Itinéraire JSON strict avec `store: false` | marquer le voyage en échec et permettre un nouvel essai contrôlé |
| OpenAI Image Edits | Projection synthétique éditoriale depuis les photos | livrer l'itinéraire sans image si le contrat produit le permet |
| Booking.com | Recherche externe au clic | retirer les liens sans perdre le voyage |
| Cloudflare Email Service | Envoyer le lien privé | conserver la page et proposer une reprise d'envoi |
| Stripe, plus tard | Paiement ponctuel | ne jamais autoriser depuis le seul retour navigateur |

## Environnements

| Environnement | Plateforme | URL | Source de configuration |
| --- | --- | --- | --- |
| Local | Wrangler dans Docker Compose ou sur Node 24 | `http://127.0.0.1:8080` | `wrangler.jsonc`, `.dev.vars` hors Git |
| CI | GitHub Actions | runs du dépôt | `.github/workflows/` |
| Diagnostic Cloudflare | Workers | `https://monflorian.nclsppr.workers.dev` | version Worker et bindings |
| Production | Workers Custom Domains et Email Service | `https://monflorian.com`, `https://www.monflorian.com` | `wrangler.jsonc` et zone Cloudflare |

Les deux noms publics servent directement le même Worker. La zone autorise
l'envoi transactionnel, sans boîte de réception humaine. Atlas ne fait plus
partie de cette chaîne de livraison.

## Commandes canoniques

| Action | Commande | Résultat attendu |
| --- | --- | --- |
| Installer | `npm ci --ignore-scripts --no-audit --no-fund` | dépendances exactes du lockfile |
| Développer | `npm run dev` | Worker local Wrangler |
| Développer avec Foundation | `docker compose up --build --wait` | Worker sain sur le port local |
| Construire les assets | `npm run build:assets` | `dist/` dérivé des sources canoniques |
| Construire le site principal | `npm run build:v2` | bundle navigateur, rendu serveur de build et cinq pages HTML |
| Vérifier le Worker | `npm run check:worker` | types générés, TypeScript et dry-run Wrangler valides |
| Régénérer les clients API | `node scripts/generate-api-clients.mjs` | chemins JavaScript et configuration Swift alignés sur OpenAPI |
| Préparer le projet iOS | `python3 scripts/ios-generate.py` | projet et ressources dérivés des sources canoniques |
| Construire iOS | `./scripts/ios-build.sh` | build simulateur sans publication |
| Tester iOS | `./scripts/ios-test.sh` | tests et résultat Xcode local |
| Vérifier les photos iOS | `./scripts/ios-photo-contract.sh` | PNG réencodé admis par le validateur backend, sans envoi |
| Vérifier le projet | `./scripts/verify.sh` | documentation, tests, Worker, Compose et Nimbus valides |
| Déployer | `npm run deploy` | nouvelle version Worker sur Cloudflare |
| Lister les migrations | `npx wrangler d1 migrations list monflorian-production --remote` | état distant sans contenu utilisateur |
| Arrêter le local | `docker compose down` | environnement local arrêté |

## Données et sécurité

- Le pense-bête reste en mémoire jusqu'à un enregistrement explicite.
  La checklist enregistre seulement les identifiants des cases modifiées. Les
  deux copies restent dans ce navigateur jusqu'à leur effacement ; elles ne
  sont ni synchronisées ni jointes au lien public du carnet.
- Les Worker Secrets ne sont jamais inscrits dans Git, les commandes ou les
  preuves.
- Le jeton de page possède 256 bits et seul son SHA-256 est indexé dans D1.
- Le brief, le résultat et l'adresse de courriel sont chiffrés avant persistance.
- Les photos d'entrée sont supprimées après génération et au plus tard sous 24
  heures ; le voyage expire sous 30 jours dans le MVP. Une décision et une
  migration du cycle de vie doivent précéder la vente d'un carnet conservé plus
  longtemps.
- Le brouillon iOS enregistré exclut les photos. La sélection locale en mémoire
  ne déclenche aucun envoi au serveur ou à OpenAI.
- Les quotas global et client sont débités dans une seule transaction D1 avant
  le démarrage du Workflow et leurs sujets sont pseudonymisés par HMAC.
- R2 reste privé. Aucune URL `r2.dev` ni clé d'objet prévisible n'est publiée.
- Les logs contiennent seulement identifiant de requête, route, statut, code
  d'erreur, durée et version.
- Les sorties OpenAI sont hostiles jusqu'à leur revalidation locale.
- Booking est construit après la génération et n'entre pas dans le prompt.
- Les routes coûteuses restent fermées si un seul garde-fou manque.

Les détails normatifs vivent dans [`DATA-PROCESSING.md`](DATA-PROCESSING.md) et
[`THREAT-MODEL.md`](THREAT-MODEL.md).

## Qualité et preuves

Les contrôles critiques sont :

- tests des validateurs et adaptateurs fournisseur ;
- génération des types Cloudflare et dry-run Wrangler ;
- migration D1 versionnée ;
- santé, configuration fermée, assets et en-têtes sur l'URL déployée ;
- absence de contenu utilisateur dans les logs ;
- un seul parcours synthétique avant toute personne réelle.

Une ressource créée n'est pas une capacité livrée. `STATUS.md` décrit l'état
observé et `DELIVERY-EVIDENCE.md` conserve les preuves.

## Livraison

- Branche canonique : `main` protégée.
- Toute modification passe par une branche et une PR.
- Contrôles cibles : `verify` et `Validate Cloudflare release`.
- Artefact : version Worker et manifeste Wrangler, sans image OCI de production.
- Publication actuelle : `npm run deploy` depuis une session Cloudflare
  autorisée.
- Publication cible : Workers Builds ou jeton GitHub restreint, à configurer.
- Rollback : version Worker précédente, puis anciennes valeurs A web consignées
  si un retour d'hébergement devient nécessaire.

## Responsabilités

| Zone | Propriétaire | Source |
| --- | --- | --- |
| Produit, code et release | `nclsppr` | `RUNBOOK.md` |
| Photos, rétention et droits | `nclsppr` | `DATA-PROCESSING.md` |
| Cloudflare, DNS et secrets | `nclsppr` | `RUNBOOK.md` |
| Vérification du voyage | Florian | procédure humaine à écrire |

Une capacité n'est livrée que lorsque sa preuve nomme le SHA, la version
Cloudflare, l'environnement et les limites encore actives.
