# STATUS.md

Snapshot de l'état réellement vérifié. Les capacités non livrées restent dans `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-23 |
| Par | Codex pour `nclsppr` |
| Branche | `main` |
| Commit | Implémentation F00 `e8f5d97667b47b5e74ffc34eff7b3511064a9c4d` |
| Environnement | Local, macOS arm64, et GitHub Actions sur Ubuntu 24.04 |
| Version livrée | F00, sans version commerciale |

## Résumé

Le dépôt contient maintenant le socle Foundation, le logo, deux captures de concept et un prototype HTML autonome. Le commit d'implémentation est sur `origin/main` et sa CI est verte. Aucune capacité de production, de paiement, de génération ou de stockage n'est livrée.

## Phase suivante

| Phase roadmap | État observé | Prochaine preuve | Responsable |
| --- | --- | --- | --- |
| F01 | planned | Test du brief avec un voyageur sur mobile et bureau | `nclsppr` |

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
| Implémentation F00 | `origin/main` | `e8f5d97667b47b5e74ffc34eff7b3511064a9c4d` | CI verte | 2026-08-23 |
| Prototype local | `http://127.0.0.1:8080` | `e8f5d97667b47b5e74ffc34eff7b3511064a9c4d` | Sain pendant la vérification, puis arrêté | 2026-08-23 |
| Production | Aucune | Aucun | Inactive | 2026-08-23 |

## Validations récentes

| Date | Commande ou contrôle | Environnement | Résultat | Portée de la preuve |
| --- | --- | --- | --- | --- |
| 2026-08-23 | Audit du remote et des quatre fichiers fournis | local et GitHub | Succès | Topologie initiale, historique, dimensions et absence d'URL externe |
| 2026-08-23 | Inspection visuelle des deux concepts et du logo | application Codex | Succès | Direction de marque et choix des sources canoniques |
| 2026-08-23 | `./scripts/verify.sh` | macOS arm64, Docker et Node 24 | Succès | Runtime, sonde HTTP, catalogue, Markdown, tests, types, build Nimbus, recherche et lint |
| 2026-08-23 | Contrôle navigateur en 1440 x 900 et 390 x 844 | navigateur intégré | Succès | Aucun débordement horizontal, interactions et statut dynamiques, contraste CTA 6,72:1, aucune ressource externe ni erreur console |
| 2026-08-23 | Contrôle source du clavier et du mouvement réduit | `scripts/check_prototype.py` | Succès | Noms accessibles, libellé photo, focus visible et défilement adapté |
| 2026-08-23 | GitHub Actions [run 32637460676](https://github.com/nclsppr/monflorian/actions/runs/32637460676) | Ubuntu 24.04, commit `e8f5d97` | Succès | Vérification distante complète du commit d'implémentation |

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

F00 est terminée. La prochaine tranche est F01, sans activation de production.
