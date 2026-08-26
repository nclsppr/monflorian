# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Mon Florian |
| Propriétaire | `nclsppr` |
| Classe | Critique |
| Surface Cloudflare | Web actif sur l'apex, `www` et `workers.dev`, envoi transactionnel fermé |
| Domaine public | `monflorian.com` sur Cloudflare Workers |
| Décisions courantes | [ADR-0007](docs/decisions/adr-0007-runtime-et-production-cloudflare.md), [ADR-0008](docs/decisions/adr-0008-domaine-web-only-cloudflare.md) et [ADR-0009](docs/decisions/adr-0009-courriel-transactionnel-cloudflare.md) |
| Licence | Aucune licence de réutilisation accordée |

## Problème

Préparer un voyage demande de relier une envie personnelle, un rythme réaliste,
des trajets et des réservations dispersées. Mon Florian produit une première
proposition lisible, puis laisse les vérifications et les décisions réelles au
voyageur et à Florian.

## Utilisateurs et résultat attendu

Une personne décrit son envie, ajoute des dates, le nombre de voyageurs, son
adresse de courriel et, avec consentement, une à quatre photos. Elle reçoit plus
tard un lien privé vers une page qui contient :

- un itinéraire structuré et signalé comme projection ;
- des points à vérifier avant réservation ;
- des recherches d'hébergement externes ou des liens affiliés approuvés ;
- des illustrations générées, jamais présentées comme de vraies photos du lieu ;
- une échéance et une action de suppression anticipée.

Le premier MVP est gratuit. L'offre à 50 €, le paiement Stripe, le PDF, le compte
client et le Voyage vivant restent des hypothèses non livrées.

## Périmètre courant

### Livré

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
  génération déterministe d'un voyage de dix jours au Japon, trois exemples,
  liens Booking.com et partage public ou privé par mot de passe.

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
- Exposer une galerie ou une page de voyage indexable.
- Garder des photos d'entrée au-delà du traitement.
- Ouvrir Stripe avant la preuve du parcours gratuit.

## Architecture

### Composants

| Composant | Rôle | Source | État |
| --- | --- | --- | --- |
| Worker | API, sécurité, rendu de la page privée et accès aux bindings | `src/worker.ts` | déployé, génération fermée |
| Static Assets | Interface et visuels canoniques | `app/public/`, `assets/brand/` | déployé |
| Coeur métier | Validation des briefs, photos, résultats et liens | `app/core.mjs` | réutilisé, tests locaux |
| Adaptateur OpenAI | Responses et Image Edits sans SDK | `app/openai.mjs` | non appelé en production |
| D1 | États, quotas, données chiffrées et jetons hachés | `migrations/` | base vide, schéma appliqué |
| R2 | Photos d'entrée et illustrations | binding `MEDIA` | bucket privé UE créé, vide, binding déployé |
| Workflows | Traitement durable et notification | `src/workflows/` | texte et image câblés, garde-fous fermés |
| Turnstile | Réduction de l'abus gratuit | clé publique et Worker Secret | widget géré configuré, parcours fermé |
| Courriel | Envoi du lien privé | binding Cloudflare `EMAIL` | domaine actif, code câblé, drapeau fermé |
| Stripe | Paiement ponctuel futur | Checkout Sessions et webhook | hors tranche |
| Documentation Nimbus | Rendu des contrats | `docs-nimbus/` | local et CI |

Pages, KV, Queues, Durable Objects, Vectorize, Workers AI et Containers ne sont
pas requis dans le MVP. TypeScript remplace le backend serveur : Java ajouterait
un conteneur et une seconde chaîne d'exploitation sans bénéfice actuel.

### Flux cible

```text
navigateur
  -> Worker + Turnstile
      -> D1 : état, quota, jeton haché, données chiffrées
      -> R2 : photos privées et illustrations
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
| OpenAI Image Edits | Projection dessinée depuis les photos | livrer l'itinéraire sans illustration si le contrat produit le permet |
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
| Vérifier le Worker | `npm run check:worker` | types générés, TypeScript et dry-run Wrangler valides |
| Vérifier le projet | `./scripts/verify.sh` | documentation, tests, Worker, Compose et Nimbus valides |
| Déployer | `npm run deploy` | nouvelle version Worker sur Cloudflare |
| Lister les migrations | `npx wrangler d1 migrations list monflorian-production --remote` | état distant sans contenu utilisateur |
| Arrêter le local | `docker compose down` | environnement local arrêté |

## Données et sécurité

- Les Worker Secrets ne sont jamais inscrits dans Git, les commandes ou les
  preuves.
- Le jeton de page possède 256 bits et seul son SHA-256 est indexé dans D1.
- Le brief, le résultat et l'adresse de courriel sont chiffrés avant persistance.
- Les photos d'entrée sont supprimées après génération et au plus tard sous 24
  heures ; le voyage expire sous 30 jours dans le MVP.
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
