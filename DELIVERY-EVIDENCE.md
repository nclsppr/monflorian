# Preuve de livraison F01 : candidat applicatif critique

Ce document consigne la tranche ouverte le 2026-08-23. Son statut reste partiel tant que le commit, la CI, le digest OCI et les smoke tests OpenAI ne sont pas inscrits avec leur résultat. Les contrôles locaux et navigateur sont désormais consignés ci-dessous.

## Référence

| Champ | Valeur |
| --- | --- |
| Unité de travail | F01, backend OpenAI, interface, projections dessinées et préparation Atlas |
| Demande source | Tâche utilisateur du 2026-08-23 |
| Auteur | Codex pour `nclsppr` |
| Vérificateur | `nclsppr` pour les checkpoints externes |
| Date | 2026-08-23 |
| Branche | `main` |
| Commit initial | `6c6824ae609e816ee34a555d0edcac9cf85877c5` |
| Commit final | Non créé au moment de ce relevé |
| Artefact final | Aucun digest publié observé |
| Profils applicables | `documentation-nimbus`, `web`, `experiment`, `generated-artifacts`, `backend-data`, `infrastructure-production`, `dependency-change` |

## Résultat demandé

Produire une application déployable qui génère un itinéraire avec OpenAI, propose des hébergements via Booking.com sans inventer d'affiliation, crée une image dessinée à partir de photos consenties, puis prépare son déploiement sur Atlas et son domaine OVHcloud.

## Résultat observé à ce stade

- F00 est commitée, poussée et verte sur GitHub Actions.
- Le worktree contient le backend et les contrats Critique de F01, validés localement.
- L'implémentation choisit une absence de persistance et sépare OpenAI des liens Booking.com.
- L'achat du domaine est observé. Aucun déploiement Atlas, changement DNS web ou activation affiliée n'est prouvé dans ce document.

## Exclusions

- paiement, compte, PDF, historique et base de données ;
- API Demand Booking.com, scraping et disponibilité en direct ;
- test avec photo personnelle ;
- modification DNS sans session OVHcloud autorisée ;
- présentation d'un artefact publié comme service déployé.

## État initial

| Élément | Observation | Preuve |
| --- | --- | --- |
| Worktree | Propre avant le début de F01, puis changements F01 partagés | Audit Git de la tâche |
| Remote | `git@github.com:nclsppr/monflorian.git` | Configuration Git observée |
| SHA initial | `6c6824ae609e816ee34a555d0edcac9cf85877c5` | `git rev-parse HEAD` |
| CI initiale | Run `32637925764` terminé avec succès | GitHub Actions |
| Production Mon Florian | Aucune observée | Audit Atlas et `STATUS.md` |
| Domaine | `monflorian.com` acheté chez OVHcloud le 2026-08-23 à 13:00:22Z, A web sur `213.186.33.5` | Registre et zone autoritaire observés |
| Booking.com | Aucun partenariat accepté observé | Audit du périmètre disponible |

## Sources et dérivés

| Concept ou artefact | Source canonique | Dérivé ou consommateur | Alignement attendu |
| --- | --- | --- | --- |
| Marque | `assets/brand/monflorian-logo.png` | `/assets/monflorian-logo.png` dans l'application | Hash du master et inspection navigateur |
| Interface | `DESIGN.md` et `app/public/` | Image OCI et page servie | Contrôle mobile et bureau |
| API | `docs/api/openapi.json` | `app/server.mjs` et frontend | Tests de routes et erreurs |
| Itinéraire | Schéma et validateurs dans `app/core.mjs` | Requête Responses et rendu | Tests de frontière et smoke test synthétique |
| Illustration | `DATA-PROCESSING.md`, validateur et prompt | Image WebP temporaire | Fixture synthétique et inspection visuelle |
| Hébergement | ADR-0002 et configuration Booking | Liens du résultat | Tests des modes et domaines |
| Release | SHA produit, `deployment/vps/` et digest OCI | Artefacts d'intégration puis contrat `vps-infra` | Déterminisme, provenance, admission et runtime inspecté |

## Gates

| Gate | Applicabilité | Contrôle | État au relevé | Preuve ou manque |
| --- | --- | --- | --- | --- |
| P02, sources et dérivés | Oui | Logo, code, contrat et artefact alignés | En cours | Artefact final absent |
| P03, contrat | Oui | OpenAPI 3.1 et schéma strict | Validé localement | JSON autonome, quatre routes et tests de frontière verts |
| P04, données | Oui | Contrat de traitement, aucune persistance | Validé localement | Test serveur négatif sur le contenu des logs vert |
| P05, changement risqué | Oui | Runbook, checkpoints et rollback | Documenté | Exécution Atlas absente |
| P08, dépendances | Oui | Modèles, image, services et retrait documentés | En cours | Scan, coût et conditions du compte à consigner |
| P09, secrets | Oui | Injection par fichier, aucun secret dans Git | En cours | Permissions Atlas à observer |
| P10, sécurité | Oui | Modèle de menace et contrôles | Validé localement | Tests négatifs, conteneur non privilégié et cible read-only vérifiés ; runtime Atlas requis |
| P11, observabilité | Oui | Logs structurés et santé | En cours | Rotation, alertes et inspection Atlas absentes |
| P13, intégrations | Oui | Fakes, timeouts, erreurs et mode dégradé | En cours | Smoke tests OpenAI réels absents |
| P14, production | Oui | Image immuable et admission centrale ciblées | Non exécuté | Aucun digest lancé |
| P15, DNS | Oui pour F04 | Diff limité et rollback documentés | Bloqué | Session OVHcloud disponible ; route et secrets Atlas manquent |
| P18, publication Git | Oui | Commit et push de la tranche | Non exécuté | SHA final absent |
| P19, Compose | Oui | Parcours local intégré | Validé localement | Build, santé, configuration et arrêt propre réussis |
| Profil web | Oui | Accessibilité, responsive, erreurs, réduction du mouvement | Validé localement | 1440 x 900 et 390 x 844, aucun débordement ni erreur console |
| Profil generated-artifacts | Oui | Photos et illustrations distinguées des masters | Documenté | Vérification de l'image générée absente |

## Contrôles déjà observés

| Commande ou contrôle | Environnement | Résultat | Portée |
| --- | --- | --- | --- |
| `./scripts/verify.sh` sur `e8f5d97` | macOS arm64 | Succès | F00 seulement |
| GitHub Actions run `32637460676` | Ubuntu 24.04 | Succès | F00 seulement |
| GitHub Actions run `32637925764` | Ubuntu 24.04 | Succès | Preuve documentaire F00 seulement |
| Navigateur 1440 x 900 et 390 x 844 sur F00 | navigateur intégré | Succès | Prototype, pas interface F01 |
| `npm test` | Node 24 local | 25 tests réussis | Validation, fournisseur simulé, annulation, OpenAPI et serveur F01 |
| `./scripts/verify-vps-release-contract` | Python local | 12 tests réussis | Contrats OCI, intégration Atlas et workflows F01 |
| `./scripts/verify.sh` | macOS arm64, Node 24 et Docker | Succès | Application F01, conteneur, contrats et documentation Nimbus |
| Navigateur 1440 x 900 et 390 x 844 sur F01 | navigateur intégré | Succès | Interface, responsive, résultats simulés, liens sponsorisés et console |

## Contrôles à inscrire avant clôture

| Contrôle exact | Résultat attendu | Preuve minimale |
| --- | --- | --- |
| Smoke test Responses | JSON valide avec `store: false` | Modèle, statut et identifiant de requête |
| Smoke test Image Edits | WebP dessiné depuis fixture synthétique | Modèle, format, dimensions et inspection |
| Scan des logs | Aucun contenu, photo, code ou clé | Recherche négative et portée |
| Push et CI | Même SHA vert | Commit et run |
| Publication OCI | Digest relié au SHA | Digest et provenance |
| Déploiement Atlas privé | Digest admis réellement lancé | Profil, contrôleur, runtime et healthcheck |
| Rollback Atlas | Retour au digest précédent ou retrait propre | Commande canonique et santé |

## Actions externes

| Action | Cible | Autorité ou checkpoint | Exécutée | Résultat | Rollback |
| --- | --- | --- | --- | --- | --- |
| Appel OpenAI synthétique | Projet OpenAI du propriétaire | Clé lue hors sortie et budget limité | Non au relevé | Non vérifié | Désactiver la génération |
| Publication OCI | GitHub Container Registry | SHA vert | Non au relevé | Aucun digest | Retirer l'admission du digest |
| Admission Atlas | `vps-infra` | Revue et checks requis | Non au relevé | Aucun service Mon Florian | Retirer profil et route |
| Achat du domaine | OVHcloud | Autorité du propriétaire | Oui | Domaine enregistré le 2026-08-23 à 13:00:22Z | Conditions OVHcloud |
| DNS OVHcloud | Zone `monflorian.com` | Session autorisée, route et secrets Atlas prouvés | Session ouverte, aucune modification | Apex et `www` restent sur `213.186.33.5` | Restaurer les A précédents sans toucher aux MX ou TXT |
| Activation CJ | Compte affilié accepté | Contrat et liens approuvés | Non | `external` ou `off` requis | Revenir à `external` ou `off` |

## Rollback, sauvegarde et restauration

| Contrôle | Cible | Procédure | Résultat au relevé | Limite |
| --- | --- | --- | --- | --- |
| Données utilisateur | Non applicable | Aucune persistance | Aucun volume à restaurer | OpenAI et les sites externes gardent leurs propres journaux |
| Source | GitHub | Commit inverse sans réécriture | Possible, non testé sur F01 | SHA final absent |
| Runtime | Atlas | Digest précédent via contrôle central | Documenté, non testé | Aucun premier digest déployé |
| DNS | OVHcloud | Valeurs apex et `www` précédentes | Zone et valeurs observées, aucune modification | Rollback non testé |

## Conclusion provisoire

| Champ | Valeur |
| --- | --- |
| Statut observé | Partiel |
| Résultat prouvé | F00 seulement |
| Résultat candidat | Backend, interface, contrats et image en cours dans le worktree |
| Risques restants | Données fournisseur, coût, exactitude, droits photo, accès privé, supply chain et DNS |
| Validations non réalisées | Tests finaux, navigateur F01, OpenAI réel, OCI, Atlas, rollback et public |
| Actions externes restantes | Propriétaire `nclsppr`, selon les checkpoints du runbook |

La conclusion passe à "livré" seulement après remplacement des champs provisoires par des preuves du même SHA. Aucun résultat local ne doit être généralisé à Atlas ou au domaine public.
