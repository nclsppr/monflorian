# FOUNDATION.md

Contrat d'adoption du socle commun par ce projet.

## Version

| Champ | Valeur |
| --- | --- |
| Source | `https://github.com/nclsppr/project-foundation.git` |
| Version lisible | `v0.5.2` |
| Commit immuable | `708d7374f87060809a805c57abc2cf7e7b66c182` |
| Pack adopté | `critical` |
| Adoptée le | 2026-08-23 |
| Adoptée par | nclsppr |

## Snapshot vendorisé

Les fichiers sous `docs/foundation/` proviennent exactement du commit ci-dessus et ne sont pas édités localement. Une mise à jour remplace le snapshot depuis une nouvelle release et produit un diff relu.

## Profils activés

- `documentation-nimbus`
- `web`
- `experiment`
- `generated-artifacts`
- `backend-data`
- `infrastructure-production`
- `dependency-change`

Les gates d'un profil s'appliquent seulement aux unités qui rencontrent son déclencheur.

## Dérogations et contrôles compensatoires

Aucune dérogation locale n'est documentée au 2026-08-23.

P18 et P19 ne peuvent pas être désactivés par convenance. Le projet conserve le push de chaque tranche validée et le parcours local Docker Compose.

## Sources locales supplémentaires

| Sujet | Source locale |
| --- | --- |
| Produit, architecture, données et livraison | `PROJECT.md` |
| Design et expérience | `DESIGN.md` |
| Visuels, provenance et droits | `ASSETS.md` |
| Séquencement et état | `ROADMAP.md` et `STATUS.md` |

## Adaptateurs locaux

`scripts/check_markdown.py`, `scripts/check_compose.py`, `scripts/documentation_catalog.py` et `scripts/verify.sh` partent de la baseline du socle puis reçoivent les gates propres au projet. Une montée de version fusionne explicitement les corrections utiles sans écraser ces contrôles.

## Reclassification

Le projet est classé Critique depuis le 2026-08-23. Le backend reçoit des briefs de voyage et des photos personnelles, appelle deux API OpenAI et prépare un déploiement de production. Cette combinaison rend insuffisant le pack Produit, même sans base de données ni paiement.

L'[ADR-0007](docs/decisions/adr-0007-runtime-et-production-cloudflare.md) fixe la frontière courante de cette reclassification. Le pack Critique impose notamment le [runbook](RUNBOOK.md), la [preuve de livraison](DELIVERY-EVIDENCE.md), le [contrat de traitement](DATA-PROCESSING.md) et le [modèle de menace](THREAT-MODEL.md). Une activation externe décrite dans ces fichiers demande toujours l'autorité prévue par la tâche et ses checkpoints.

## Challenger le socle

Un besoin local devient une dérogation limitée dans ce fichier. Un problème général se corrige dans le dépôt Project Foundation, avec une nouvelle release ensuite adoptée ici. Le snapshot vendorisé n'est jamais corrigé directement.

## Mise à jour

1. Lire le changelog du socle entre la version actuelle et la cible.
2. Remplacer le snapshot et comparer les adaptateurs locaux.
3. Réconcilier les profils, dérogations et sources locales.
4. Régénérer le catalogue et exécuter `./scripts/verify.sh`.
5. Committer et pousser snapshot, provenance et adaptations dans une seule unité.
