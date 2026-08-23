# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Mon Florian |
| Propriétaire | `nclsppr` |
| Classe | Critique |
| Surface de production | DNS public sur Atlas, aucune application Mon Florian active au 2026-08-23 |
| Socle adopté | [`FOUNDATION.md`](FOUNDATION.md) |
| Licence | Aucune licence de réutilisation accordée |

## Problème

Préparer un voyage demande de relier une envie personnelle, un rythme réaliste, des trajets et des réservations dispersées. Mon Florian produit une première proposition lisible, puis laisse les vérifications et les décisions réelles au voyageur et à Florian.

## Utilisateurs

| Utilisateur | Situation | Besoin | Risque principal |
| --- | --- | --- | --- |
| Voyageur francophone | Prépare un séjour de loisir à partir d'une envie libre | Recevoir un parcours compréhensible sans remplir un long questionnaire | Prendre une projection générée pour une information vérifiée ou une réservation |
| Florian | Relit, explique et ajuste la proposition | Repérer les points à vérifier et garder la responsabilité des choix | Laisser passer une durée, une fermeture ou un trajet inexact |
| Proche représenté | Apparaît sur une projection dessinée | Comprendre l'usage de sa photo et donner son accord | Envoi d'une photo sans droit, consentement ou information suffisante |

## Résultat attendu

Une personne décrit son envie, précise les dates, le nombre de voyageurs et le rythme, puis reçoit une proposition structurée. Elle peut ouvrir des recherches d'hébergement séparées et, si elle le souhaite, créer une illustration dessinée à partir de photos fournies avec consentement.

L'offre cible reste un voyage prêt à 50 €, livré en mini-site privé et PDF personnalisé. L'option Voyage vivant à 50 € vise des ajustements pendant le séjour et un carnet de souvenirs. Ces prix restent des hypothèses. Aucun paiement, PDF, compte client ou accompagnement humain n'est livré dans la tranche actuelle.

### Preuves de succès

| Preuve | Baseline connue | Cible | Source | Échéance |
| --- | --- | --- | --- | --- |
| Compréhension de la proposition | Non mesurée | Un voyageur distingue l'itinéraire généré, les vérifications à faire et les liens externes | Test utilisateur consigné | Avant ouverture publique |
| Parcours du brief | Prototype visuel validé | Brief, erreurs, résultat et mode dégradé utilisables sur petit mobile et bureau | Contrôles navigateur datés | Avant release Atlas |
| Contrat du backend | Aucun dans F00 | OpenAPI, tests d'erreur et tests des frontières OpenAI et Booking.com cohérents | `docs/api/openapi.json` et CI | Avant image de production |
| Confidentialité des photos | Aucun envoi dans F00 | Consentement explicite, réencodage, limites, absence de persistance applicative et test négatif | Tests et `DATA-PROCESSING.md` | Avant test avec une photo réelle |
| Production privée | Aucune | Digest immuable déployé, route privée, santé et parcours synthétique observés | `DELIVERY-EVIDENCE.md` | Avant tout DNS public |
| Valeur commerciale | Hypothèse de prix | Signal réel sans témoignage ni conversion inventés | Preuve commerciale autorisée | Avant paiement |

## Périmètre

### Inclus

- Une application web servie par un backend Node.js.
- Un brief libre avec dates facultatives, voyageurs et rythme.
- Une proposition structurée générée par l'API Responses d'OpenAI.
- Des recherches Booking.com construites après la génération, sans transmettre de contenu Booking.com à OpenAI.
- Un mode affilié statique réservé à des liens approuvés et configurés.
- Une projection dessinée créée par l'API Image Edits à partir d'une à quatre photos réencodées.
- Un accès de lancement privé, des quotas en mémoire, des limites de concurrence et des logs techniques sans contenu utilisateur.
- Une image de conteneur immuable et une cible de déploiement sur Atlas.

### Non-objectifs

- Acheter automatiquement un billet, un hébergement ou une activité.
- Afficher un prix, une disponibilité, une note ou une garantie récupérés en direct.
- Utiliser l'API Demand de Booking.com ou extraire des pages Booking.com.
- Payer, créer un compte ou stocker un voyage dans cette tranche.
- Stocker les photos ou illustrations sur le serveur.
- Produire une photographie synthétique présentée comme un souvenir réel.
- Ouvrir le service au public avant le domaine, la protection d'accès et les preuves de production.

### Conditions d'arrêt ou de réévaluation

- Une photo ou un brief apparaît dans les logs, un artefact, un cache ou une persistance locale.
- Le fournisseur renvoie une sortie qui contourne le schéma ou injecte un lien.
- Le coût ne peut pas être contenu par les quotas et la protection privée.
- Les conditions OpenAI ou Booking.com ne couvrent pas l'usage prévu.
- Le voyageur ne distingue pas la proposition générée d'une information de réservation vérifiée.
- Une production expose le backend hors de la route privée prévue.

## Sources de vérité

| Concept | Source canonique | Type | Notes |
| --- | --- | --- | --- |
| Produit | Ce document | normative | Promesse, limites et architecture |
| État courant | `STATUS.md` | snapshot opérationnel | Daté et vérifié |
| Roadmap | `ROADMAP.md` | normative | Autorité de séquencement |
| Historique des changements | `CHANGELOG.md` | historique | Impact observable de chaque tranche |
| Architecture | `PROJECT.md#architecture` | normative | L'ADR explique la décision structurante |
| Contrat API | `docs/api/openapi.json` | normative | OpenAPI 3.1 |
| Schéma de données | Non applicable | normative | Aucune base de données ni persistance applicative |
| Traitement des données | `DATA-PROCESSING.md` | normative | Catégories, destinataires, rétention et suppression |
| Modèle de menace | `THREAT-MODEL.md` | normative | Menaces, contrôles et risques résiduels |
| Design system | `DESIGN.md` | normative | Marque, interface et statut des projections |
| Configuration | `compose.yaml`, `.env.example` et `deployment/vps/` | opérationnelle | Les secrets restent hors Git |
| Code livré | `app/` et `Dockerfile` | opérationnelle | `prototype/` reste une expérience historique |
| Opérations | `RUNBOOK.md` | normative | Ne vaut pas autorisation d'agir |
| Décisions | `docs/decisions/` | normative | Décisions structurantes |
| Documentation | `DOCUMENTATION.md`, `documentation.json` et `docs-nimbus/` | normative et dérivée | Catalogue généré |
| Preuves | `DELIVERY-EVIDENCE.md` | preuve | Résultats observés et limites |
| Visuels | `ASSETS.md` | normative et historique | Sources, rôles, droits et retrait |
| Archives | `references/concepts/` | historique | Captures non exécutables et non normatives |
| Expériences | `prototype/` | expérimentale | Ancien concept local, distinct de `app/` |

## Architecture

### Composants

| Composant | Rôle | Statut | Exécution | Version | Source | Preuve et date | Propriétaire |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Interface web | Recueillir le brief, afficher le voyage et préparer les photos | candidat publié | navigateur | HTML, CSS et JavaScript natifs | `app/public/` | Contrôles navigateur bureau et mobile du 2026-08-23 | `nclsppr` |
| Serveur HTTP | Servir l'interface, valider les entrées, appliquer accès et quotas | candidat publié | Node.js | Node 24 dans l'image épinglée | `app/server.mjs` | Tests, CI et Compose verts sur `a7c5d1c` | `nclsppr` |
| Coeur métier | Valider briefs, photos et sorties, construire les recherches d'hébergement | candidat publié | Node.js | sans package npm d'exécution | `app/core.mjs` | 25 tests applicatifs verts | `nclsppr` |
| Adaptateur OpenAI | Appeler Responses et Image Edits avec timeouts et erreurs bornées | candidat | service externe | modèles épinglés par configuration | `app/openai.mjs` | Smoke test synthétique requis | `nclsppr` |
| Image OCI | Emballer le serveur sans privilège | publiée | Docker et Atlas | base Node épinglée par digest | `Dockerfile` | Digest, scan distant et attestation consignés | `nclsppr` |
| Prototype F00 | Conserver le concept qui a précédé l'application | expérience | navigateur local | HTML autonome | `prototype/index.html` | Run CI `32637925764` | `nclsppr` |
| Documentation Nimbus | Classer et rendre les contrats | actuel | local et CI | lockfile dédié | `docs-nimbus/` | `./scripts/verify.sh` | `nclsppr` |
| Intégration Atlas | Décrire le service, le réseau, les sondes et la route Caddy | admise, inactive | VPS | release immuable et profil central désactivé | `deployment/vps/` | PR Atlas 96, admission initiale `891a898`, contrôleur installé `1d177efe`, aucun runtime Mon Florian | `nclsppr` |

### Flux d'itinéraire

1. Le navigateur envoie le brief, les dates facultatives, le nombre de voyageurs, le rythme et le code de lancement si l'environnement reste privé.
2. Le serveur contrôle l'origine, l'accès, la taille et les quotas. Il transforme l'adresse cliente en identifiant HMAC pour `safety_identifier`.
3. Le backend envoie le brief et les paramètres à l'API Responses. Il fixe `store: false` et demande un JSON conforme au schéma strict.
4. Le serveur revalide la sortie. Il refuse les dates, tailles ou structures hors contrat.
5. Le serveur construit lui-même les liens d'hébergement depuis les étapes validées. Le modèle ne produit aucun lien Booking.com.
6. Le navigateur reçoit le voyage, les liens externes et la mention de projection. Aucun résultat n'est enregistré par l'application.

### Flux d'illustration

1. Le navigateur demande l'accord sur les droits et le consentement des personnes, puis réencode une à quatre photos en PNG ou WebP.
2. Le serveur contrôle le format réel, les dimensions, le poids et l'absence de blocs de métadonnées connus.
3. Le backend envoie les images et la scène à l'API Image Edits avec un prompt qui impose un dessin éditorial.
4. Le navigateur reçoit un WebP encodé dans la réponse. L'application l'étiquette comme projection personnalisée et ne le persiste pas.

### Dépendances externes

| Dépendance | Usage | Données transmises | Mode d'échec | Alternative ou retrait |
| --- | --- | --- | --- | --- |
| API Responses OpenAI | Composer le voyage | Brief, dates, voyageurs, rythme et identifiant de sûreté pseudonymisé | Itinéraire indisponible, erreur explicite sans retry automatique | Désactiver `MONFLORIAN_GENERATION_ENABLED` et conserver l'interface informative |
| API Image Edits OpenAI | Créer un dessin à partir des photos | Photos réencodées, destination et scène | Illustration indisponible sans bloquer l'itinéraire | Désactiver `MONFLORIAN_ILLUSTRATION_ENABLED` |
| Booking.com externe | Ouvrir une recherche dans le navigateur | Destination, dates et nombre d'adultes au clic | Lien externe indisponible, itinéraire conservé | `BOOKING_MODE=off` |
| Liens CJ statiques | Attribuer une réservation quand un partenariat est accepté | Navigation du voyageur et paramètres du lien au clic | Repli vers une recherche externe non affiliée | Retirer la configuration et passer à `external` ou `off` |
| Image Node officielle | Runtime de production | Code du dépôt pendant le build | Build bloqué | Revenir au digest précédent validé |
| GitHub Actions | Vérifier et publier les artefacts | Sources du dépôt | Livraison bloquée | Vérification locale sans prétendre avoir livré |
| Atlas et Caddy | Exécuter et router le service privé | Requêtes HTTP et logs techniques | Service inaccessible | Rollback vers le digest précédent |

Le projet n'utilise aucun SDK OpenAI ou Booking.com. Il s'appuie sur `fetch`, `FormData` et le serveur HTTP de Node.js afin de limiter les dépendances d'exécution.

## Environnements

| Environnement | Plateforme | Configuration canonique | URL ou accès | Vérification |
| --- | --- | --- | --- | --- |
| Développement | Docker Compose sur macOS ou Linux | `compose.yaml` et `.env.example` | `http://127.0.0.1:8080` par défaut | `./scripts/verify.sh` |
| CI | GitHub Actions | `.github/workflows/verify.yml` | Runs GitHub | `./scripts/verify.sh` |
| Production privée | Atlas derrière Caddy | release immuable produite depuis `deployment/vps/`, puis profil `vps-infra` | Aucun accès actif au 2026-08-23 | `RUNBOOK.md` |
| Production publique | Atlas et DNS OVHcloud | apex et `www` sur `137.74.174.163`, route inactive | `monflorian.com`, inactif pour Mon Florian | Sonde publique après route Atlas, secrets et TLS |

## Commandes canoniques

| Action | Commande | Résultat attendu |
| --- | --- | --- |
| Installer l'application | `npm ci --ignore-scripts --no-audit --no-fund` | Lockfile vérifié sans package d'exécution tiers |
| Installer Nimbus | `npm ci --prefix docs-nimbus --ignore-scripts --no-audit --no-fund` | Dépendances documentaires conformes au lockfile |
| Développer | `docker compose up --build --wait` | Application saine sur le port configuré |
| Vérifier | `./scripts/verify.sh` | Tests, contrat, image, Compose et documentation valides selon le script courant |
| Tester le backend | `npm test` | Tests unitaires et d'intégration locaux valides |
| Construire l'image | `docker build --tag monflorian:local .` | Image locale construite depuis le Dockerfile épinglé |
| Construire Nimbus | `npm run build --prefix docs-nimbus` | Site documentaire généré |
| Arrêter | `docker compose down` | Service arrêté sans donnée à supprimer |
| Contrôler la santé | `python3 -m urllib.request http://127.0.0.1:8080/api/health` | JSON avec `status` égal à `ok` |
| Déployer | Aucune commande produit directe | Le contrôleur Atlas doit consommer un artefact immuable validé |
| Sauvegarder | Non applicable aux données utilisateur | L'application ne possède aucune persistance |
| Restaurer | Non applicable aux données utilisateur | Le rollback porte sur le digest et la configuration Git |

## Données, sécurité et confidentialité

- Les catégories, destinataires et durées vivent dans `DATA-PROCESSING.md`.
- Le serveur ne possède ni base, ni volume de données, ni session persistante.
- La clé OpenAI, le code d'accès et le secret HMAC sont injectés hors Git. Le runtime peut lire une clé depuis un fichier monté.
- Le développement privé exige un code de lancement côté backend quand la génération est ouverte. Sur Atlas, le backend n'a aucun port hôte et Caddy protège toute la page avant de lui relayer les requêtes. Le mode applicatif `public` n'est acceptable dans cette topologie qu'avec cette protection Caddy chargée et vérifiée.
- Le serveur rejette les requêtes cross-origin, limite les corps, les dimensions, les quotas quotidiens et la concurrence.
- Les logs contiennent la date, un identifiant de requête, la méthode, le chemin, le statut, le code d'erreur et la durée. Ils ne doivent contenir ni brief, ni photo, ni clé, ni sortie générée.
- `store: false` désactive le stockage applicatif de la réponse OpenAI. Il ne supprime pas les journaux de sûreté possibles du fournisseur. `DATA-PROCESSING.md` expose cette limite.
- Aucune photo personnelle réelle n'entre dans le dépôt, les fixtures, les captures de test ou les smoke tests.
- Le modèle de menace et les risques résiduels vivent dans `THREAT-MODEL.md`.

## Qualité

| Risque | Contrôle automatisé | Contrôle manuel | Environnement |
| --- | --- | --- | --- |
| Entrée ou sortie hors contrat | Tests des validateurs et OpenAPI | Revue des limites et erreurs visibles | local et CI |
| Appel fournisseur non borné | Fakes de frontière, timeouts, quotas et concurrence | Smoke test synthétique contrôlé | local, puis Atlas privé |
| Fuite de photo ou de brief | Tests des logs, origine et formats | Inspection réseau avec données synthétiques | navigateur et backend |
| Lien affilié injecté | Liste de domaines autorisés et construction côté serveur | Revue du contrat accepté et de la mention commerciale | local, puis Atlas privé |
| Coût abusif | Quotas par client et globaux | Vérification des limites du compte fournisseur | production privée |
| Interface trompeuse | Contrôles statiques et tests DOM | Parcours mobile, bureau, clavier et mouvement réduit | navigateurs ciblés |
| Image ou conteneur vulnérable | Build immuable et scan distant | Revue du digest et des permissions | CI et Atlas |
| Dérive Foundation | `./scripts/verify.sh` | Diff du snapshot et des profils | local et CI |

## Livraison

- Branche canonique : `main`.
- Push direct : interdit, y compris au propriétaire. Toute modification passe par une branche et une PR à jour.
- Contrôles requis avant fusion : `verify` et `Validate application release`, avec historique linéaire et résolution des conversations. La publication immuable s'exécute ensuite sur `main`.
- Convention de commit : impératif préfixé par le périmètre.
- Artefact : image OCI `ghcr.io/nclsppr/monflorian/backend` publiée et attestée par digest; aucun conteneur Atlas actif.
- Déploiement : contrôleur Atlas depuis un contrat versionné dans `vps-infra`. Aucun déploiement direct depuis le poste.
- Rollback : redéployer le digest précédent et la configuration correspondante, puis sonder la santé et le parcours critique.
- Vérification finale : CI du producteur, réconciliation Atlas, healthcheck local, parcours privé, puis sonde publique seulement après activation du domaine.
- Observabilité : logs structurés, santé locale, signaux Caddy et supervision Atlas. La santé HTTP ne prouve pas qu'OpenAI accepte une génération.
- Escalade : propriétaire `nclsppr`.

## Responsabilités

| Zone | Propriétaire | Suppléant | Runbook |
| --- | --- | --- | --- |
| Produit, marque, code et release | `nclsppr` | Aucun désigné | `RUNBOOK.md` |
| Données et usage des photos | `nclsppr` | Aucun désigné | `DATA-PROCESSING.md` et `RUNBOOK.md` |
| Service Atlas, Caddy et DNS | `nclsppr` | Aucun désigné | `RUNBOOK.md` |
| Vérification éditoriale du voyage | Florian | Aucun désigné | Procédure humaine à écrire avant un client réel |

Les risques courants et les preuves manquantes vivent dans `STATUS.md`. Une capacité n'est livrée que lorsque la preuve nomme son SHA, son environnement et sa limite.
