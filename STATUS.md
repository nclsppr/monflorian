# STATUS.md

Snapshot de l'état vérifié. Les objectifs et leurs critères vivent dans `ROADMAP.md`.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-23 |
| Par | Codex pour `nclsppr` |
| Branche | `main` |
| Commit distant | `6c6824ae609e816ee34a555d0edcac9cf85877c5` |
| Worktree | Tranche F01 validée localement, non commitée au moment de ce snapshot |
| Environnement prouvé | Local macOS arm64 pour F01 ; GitHub Actions pour F00 seulement |
| Version livrée | F00, sans version commerciale |

## Résumé

F00 est livrée sur `origin/main` avec une CI verte. Le worktree contient désormais une application Critique avec backend Node.js, génération OpenAI, projections dessinées, liens d'hébergement séparés et image de conteneur. Ses 25 tests applicatifs, 12 tests de contrat Atlas, son parcours Compose, sa documentation et son interface responsive sont verts localement. Cette tranche n'est pas encore une release tant que son commit poussé, sa CI et ses artefacts immuables ne sont pas consignés.

Aucun service Mon Florian ne tourne sur Atlas d'après les preuves disponibles. `monflorian.com` a été acheté chez OVHcloud le 2026-08-23 à 13:00:22Z. L'apex et `www` pointent encore vers le parking OVH `213.186.33.5`, pas vers Atlas `137.74.174.163`. Aucun partenariat Booking.com accepté ni identifiant d'affiliation n'a été observé.

## Phase courante

| Phase roadmap | État observé | Prochaine preuve | Responsable |
| --- | --- | --- | --- |
| F01 | in_progress | Commit poussé, CI et artefacts immuables du même SHA | `nclsppr` |
| F02 | planned | Smoke tests OpenAI avec données synthétiques | `nclsppr` |
| F03 | planned | Digest OCI admis et exécuté par Atlas en accès privé | `nclsppr` |
| F04 | blocked | Route et secrets Atlas, puis changement DNS limité dans la session OVHcloud ouverte | `nclsppr` |
| F05 | blocked | Partenariat Booking.com accepté et liens approuvés | `nclsppr` |

## Livré et vérifié

| Capacité | Périmètre réel | Preuve | Limite connue |
| --- | --- | --- | --- |
| Historique Git distant | Branche `main` et deux commits de préparation | `origin/main` à `6c6824a` | Branche non protégée |
| Marque fournie | Logo PNG transparent et deux captures | Dimensions et SHA-256 dans `ASSETS.md` | Droits non documentés par une licence séparée |
| Prototype reproductible | NGINX épinglé sert F00 sans persistance | `./scripts/verify.sh` et runs CI F00 | Ce runtime précède l'application F01 |
| Contrat Foundation F00 | Pack Produit, puis preuve du socle | Commits `e8f5d97` et `6c6824a` | La reclassification Critique appartient à F01 |

## Candidat non encore livré

| Capacité | Source présente | Preuve encore requise | Limite actuelle |
| --- | --- | --- | --- |
| Itinéraire OpenAI | `app/core.mjs`, `app/openai.mjs`, `app/server.mjs` | Appel synthétique réel et CI | 25 tests locaux verts ; clé sûre absente, service non activé |
| Projection dessinée | Route `/api/illustrations` et validation des images | Test avec fixture synthétique, smoke test Image Edits et inspection visuelle | Aucune photo réelle autorisée pour la preuve |
| Hébergements | Modes `off`, `external`, `cj-static` | Tests des hôtes et revue des conditions acceptées | Aucun partenariat Booking.com observé |
| Interface F01 | `app/public/` | CI et parcours sur le runtime publié | 1440 x 900 et 390 x 844 validés sans débordement ni erreur console |
| Image OCI | `Dockerfile` | Scan distant, provenance et digest | Build, identité non privilégiée et santé validés localement ; aucun registre ou Atlas observé |
| Contrat Atlas | Cible documentée | Diff, revue, admission centrale, déploiement et rollback | Profil Mon Florian non prouvé dans `vps-infra` |

## État opérationnel

| Cible | URL ou accès | Artefact ou SHA | Santé | Dernière vérification |
| --- | --- | --- | --- | --- |
| F00 distant | `origin/main` | `6c6824ae609e816ee34a555d0edcac9cf85877c5` | CI verte | 2026-08-23 |
| Prototype F00 local | `http://127.0.0.1:8080` pendant la vérification | `e8f5d97667b47b5e74ffc34eff7b3511064a9c4d` | Sain puis arrêté | 2026-08-23 |
| Application F01 locale | `http://127.0.0.1:8080` pendant la vérification | worktree non commité | Saine puis arrêtée | 2026-08-23 |
| Atlas privé | Aucun accès Mon Florian observé | Aucun digest déployé observé | Inactive | 2026-08-23 |
| Production publique | `monflorian.com` sur parking OVH | A `213.186.33.5` pour apex et `www` | Inactive pour Mon Florian | 2026-08-23 |

## Validations récentes

| Date | Commande ou contrôle | Environnement | Résultat | Portée de la preuve |
| --- | --- | --- | --- | --- |
| 2026-08-23 | Audit du remote et des fichiers initiaux | local et GitHub | Succès | Topologie, historique, dimensions et absence d'URL externe dans le prototype |
| 2026-08-23 | `./scripts/verify.sh` sur F00 | macOS arm64, Docker et Node 24 | Succès | Prototype, Compose, documentation et tests F00 |
| 2026-08-23 | Contrôle navigateur F00 en 1440 x 900 et 390 x 844 | navigateur intégré | Succès | Mise en page, interactions, contraste, réseau et console du prototype |
| 2026-08-23 | GitHub Actions [run 32637460676](https://github.com/nclsppr/monflorian/actions/runs/32637460676) | Ubuntu 24.04, commit `e8f5d97` | Succès | Vérification distante de F00 |
| 2026-08-23 | GitHub Actions [run 32637925764](https://github.com/nclsppr/monflorian/actions/runs/32637925764) | Ubuntu 24.04, commit `6c6824a` | Succès | Vérification distante de la preuve F00 |
| 2026-08-23 | `./scripts/verify.sh` sur F01 | macOS arm64, Node 24, Python et Docker | Succès | 25 tests applicatifs, 12 tests de release, Compose et documentation Nimbus |
| 2026-08-23 | Contrôle navigateur F01 en 1440 x 900 et 390 x 844 | navigateur intégré | Succès | Responsive, états, résultat simulé, liens sponsorisés et console |

## Blocages externes

| Blocage | État observé | Action requise | Autorité |
| --- | --- | --- | --- |
| Route et secrets Atlas | Profil public et secrets requis non installés | Terminer l'admission privée et ses sondes avant le DNS | Propriétaire Atlas |
| Accès OVHcloud | Domaine, zone et session propriétaire observés ; aucun changement effectué | Conserver la session jusqu'à la preuve HTTPS Atlas, puis limiter le diff aux A web | Propriétaire du compte OVHcloud |
| Partenariat Booking.com | Aucun contrat ou compte affilié accepté observé | Rejoindre le programme, accepter les conditions et obtenir des liens approuvés | Propriétaire commercial |
| API Demand Booking.com | Aucun statut Managed Affiliate Partner ni approbation de production observés | Garder cette intégration hors périmètre | Décision et accord Booking.com requis |

## Dérives et risques

| Intention | Réalité observée | Risque | Action |
| --- | --- | --- | --- |
| Voyage prêt à 50 € | Aucun paiement ou PDF | Promesse prise pour une vente active | Garder le prix dans le registre des hypothèses |
| Images de vacances | Projection dessinée, pas souvenir réel | Confusion ou usage sans consentement | Étiquette visible, consentement et aucune persistance |
| Hébergements proposés | Recherche externe, pas inventaire vérifié | Prix ou disponibilité supposés | Ne rien afficher qui ne vient pas d'une source active autorisée |
| Santé HTTP | `/api/health` ne contacte pas OpenAI | Faux sentiment de disponibilité | Ajouter un smoke test séparé et contrôlé |
| Protection privée | Code applicatif et cible Caddy | Coût abusif si exposition trop tôt | Ne pas ouvrir la route avant test des quotas et de la protection |
| Droits des visuels | Fichiers fournis sans licence séparée | Publication commerciale contestée | Confirmer l'auteur et les droits avant ouverture publique |

La prochaine mise à jour de ce fichier doit remplacer les mentions "non consignée" par des SHA, commandes et résultats observés. Elle ne doit pas déduire la production d'un build local ou d'une image publiée.
