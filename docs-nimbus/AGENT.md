# Maintenance du site Nimbus

Ce dossier contient le scaffold Nimbus obligatoire de Project Foundation. Il
reste suivi par `nimbus.json`, mais ses commandes et son adaptateur sont adaptés
au contrat documentaire du socle.

Les règles normatives vivent dans [`DOCUMENTATION.md`](../DOCUMENTATION.md).
Dans un projet adopté, le profil obligatoire est vendorisé sous
`docs/foundation/profiles/documentation-nimbus.md`. La décision d'origine reste
dans Project Foundation sous
`docs/decisions/adr-0003-nimbus-obligatoire.md`.

## Sources et dérivés

- Les Markdown classés par `documentation.json` sont les seules sources
  éditoriales.
- `scripts/sync-content.mjs` génère `src/content/docs/` depuis cet inventaire.
- La collection générée, `dist/`, `.astro/` et `node_modules/` ne sont jamais
  édités ni commités.
- Ce fichier appartient lui-même à la collection documentaire de référence.

## Prérequis

- Node `22.12.0` ou plus récent ;
- npm ;
- Python `3.9` ou plus récent pour le catalogue source.

Le gestionnaire canonique est npm. Ne pas introduire un second lockfile.

## Commandes canoniques

Depuis la racine du projet :

| Action | Commande |
| --- | --- |
| Installer exactement le lockfile | `npm ci --prefix docs-nimbus` |
| Synchroniser les sources | `npm run sync --prefix docs-nimbus` |
| Développer | `npm run dev --prefix docs-nimbus` |
| Tester, typer, construire et linter | `npm run check --prefix docs-nimbus` |
| Vérifier le scaffold amont | `npm run outdated --prefix docs-nimbus` |
| Vérifier tout le projet | `./scripts/verify.sh` |

## Modifier le scaffold

1. Lire `nimbus.json` et vérifier la version amont ciblée.
2. Comparer le nouveau scaffold dans un dossier temporaire isolé.
3. Appliquer uniquement les changements compris, sans écraser l'adaptateur, le
   schéma de contenu, la configuration d'audience ou les scripts du projet.
4. Mettre à jour la dépendance exacte et `package-lock.json` dans le même
   changement.
5. Exécuter `./scripts/verify.sh`.
6. Tracer la décision si le contrat documentaire, les audiences ou la version
   minimale de Node changent.

## Publication

Le build local contient toutes les audiences afin de rendre le corpus
navigable. Il ne doit pas être publié tel quel. Une surface publiée sélectionne
explicitement ses collections autorisées et prouve qu'aucun document interne
n'est exposé.
