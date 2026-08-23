# STATUS.md

Snapshot de l'état réellement vérifié. Les capacités non livrées restent dans `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-23 |
| Par | Codex pour `nclsppr` |
| Branche | `main` |
| Commit | Baseline distante `585ebb93b844fe3bef7de15bbf342f508a208813`, changements locaux validés mais pas encore commités |
| Environnement | Local, macOS arm64 |
| Version livrée | Aucune |

## Résumé

Le dépôt distant ne contient initialement qu'un README. Le worktree contient maintenant le socle Foundation, le logo, deux captures de concept et un prototype HTML autonome. Les contrôles locaux sont verts. Aucune capacité de production, de paiement, de génération ou de stockage n'est livrée. Le commit, le push et la CI doivent encore fermer la phase F00.

## Phase active

| Phase roadmap | État observé | Prochaine preuve | Responsable |
| --- | --- | --- | --- |
| F00 | in_progress | Commit, push et CI GitHub Actions | `nclsppr` |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Historique Git distant | Branche `main` et commit initial | Remote GitHub inspecté le 2026-08-23 | Aucun check requis |
| Concept interactif existant | HTML, CSS et JavaScript sans appel réseau externe | Audit source et interaction locale du 2026-08-23 | Pas encore validé dans le runtime final |
| Marque fournie | Logo PNG transparent et deux captures | Dimensions et SHA-256 dans `ASSETS.md` | Droits non documentés par une licence séparée |
| Prototype reproductible | NGINX épinglé sert le HTML local sans persistance | `./scripts/verify.sh` vert le 2026-08-23 | Aucun service public |

## État opérationnel

| Cible | URL ou accès | Artefact ou SHA | Santé | Dernière vérification |
| --- | --- | --- | --- | --- |
| Dépôt | `origin/main` | `585ebb93b844fe3bef7de15bbf342f508a208813` | Accessible | 2026-08-23 |
| Prototype local | `http://127.0.0.1:8080` | Worktree | Sain pendant la vérification, puis arrêté | 2026-08-23 |
| Production | Aucune | Aucun | Inactive | 2026-08-23 |

## Validations récentes

| Date | Commande ou contrôle | Environnement | Résultat | Portée de la preuve |
| --- | --- | --- | --- | --- |
| 2026-08-23 | Audit du remote et des quatre fichiers fournis | local et GitHub | Succès | Topologie initiale, historique, dimensions et absence d'URL externe |
| 2026-08-23 | Inspection visuelle des deux concepts et du logo | application Codex | Succès | Direction de marque et choix des sources canoniques |
| 2026-08-23 | `./scripts/verify.sh` | macOS arm64, Docker et Node 24 | Succès | Runtime, sonde HTTP, catalogue, Markdown, tests, types, build Nimbus, recherche et lint |
| 2026-08-23 | Contrôle navigateur en 1440 x 900 et 390 x 844 | navigateur intégré | Succès | Aucun débordement horizontal, interactions et statut dynamiques, contraste CTA 6,72:1, aucune ressource externe ni erreur console |
| 2026-08-23 | Contrôle source du clavier et du mouvement réduit | `scripts/check_prototype.py` | Succès | Noms accessibles, libellé photo, focus visible et défilement adapté |

## Blocages externes

Aucun blocage externe connu au 2026-08-23.

## Dérives connues

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Voyage commandable à 50 € | Le bouton ne fait qu'afficher un retour local | Promesse prise pour un paiement réel | Étiqueter le prototype et ne pas activer de paiement avant F03 |
| Mini-site privé et PDF | La maquette montre seulement des aperçus | Capacité surestimée | Prouver une livraison manuelle en F02 |
| Logo source unique | Le prototype embarque encore un dérivé WebP en base64 | Dérive visuelle et cache inefficace | Externaliser depuis le master lors de F01 |

## Risques et hypothèses

| Sujet | Type | Impact | Prochaine preuve | Responsable | Date de réévaluation |
| --- | --- | --- | --- | --- | --- |
| Prix de 50 € puis 50 € | hypothèse | Valeur ou conversion insuffisante | Signal commercial réel | `nclsppr` | Avant activation du paiement |
| Droits des visuels | risque | Publication ou réutilisation bloquée | Confirmation du propriétaire | `nclsppr` | 2026-09-23 |
| Photos personnelles | risque | Atteinte à la vie privée | Contrat de données et test d'effacement | `nclsppr` | Avant tout stockage distant |
| Exactitude du voyage | risque | Mauvaise décision de voyage | Revue humaine et sources datées | Florian | Avant premier client réel |

La prochaine tranche reste F00 jusqu'au commit distant et à la CI verte.
