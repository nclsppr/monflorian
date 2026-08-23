# Mon Florian

Mon Florian transforme une envie de voyage en itinéraire cohérent, mini-site privé et guide PDF personnalisé.

Le dépôt contient actuellement un prototype local et les références de marque. Il ne contient encore ni génération de voyage, ni paiement, ni stockage de photos, ni service en production.

## Démarrage

```bash
cp .env.example .env
docker compose up --build --wait
```

Le prototype est alors disponible sur `http://127.0.0.1:8080`. Les prérequis, commandes canoniques et résultats attendus vivent dans [`PROJECT.md`](PROJECT.md).

## Carte documentaire

- [`PROJECT.md`](PROJECT.md) : contrat produit, architecture, données et commandes.
- [`STATUS.md`](STATUS.md) : état réellement vérifié à une date donnée.
- [`ROADMAP.md`](ROADMAP.md) : ordre de livraison et critères de sortie.
- [`DESIGN.md`](DESIGN.md) : langage visuel extrait des concepts existants.
- [`ASSETS.md`](ASSETS.md) : sources, rôles, provenance et limites des visuels.
- [`CHANGELOG.md`](CHANGELOG.md) : changements livrés et impact observable.
- [`FOUNDATION.md`](FOUNDATION.md) : version du socle, profils et dérogations.
- [`DOCUMENTATION-CATALOG.md`](DOCUMENTATION-CATALOG.md) : navigation exhaustive des Markdown et de leurs audiences.
- [`AGENTS.md`](AGENTS.md) : règles locales d'intervention.

Le dépôt est public mais aucune licence de réutilisation n'est accordée à ce stade.
