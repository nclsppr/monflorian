# Mon Florian

Mon Florian transforme un brief libre en proposition de voyage expliquée. Le candidat actuel compose l'itinéraire avec OpenAI, construit séparément des recherches d'hébergement et peut créer une projection dessinée à partir de photos fournies avec consentement.

Le dépôt contient l'application web, son backend sans dépendance npm d'exécution, le prototype historique et les références de marque. Il ne contient ni paiement, ni compte, ni base de données. Le service public n'est pas actif. `monflorian.com` est enregistré chez OVHcloud, mais ses enregistrements web pointent encore vers le parking OVH et aucun partenariat Booking.com n'a été prouvé.

## Démarrage

```bash
cp .env.example .env
docker compose up --build --wait
```

L'application est alors disponible sur `http://127.0.0.1:8080`. Sans clé OpenAI et sans code d'accès, l'interface reste consultable mais les routes de génération restent fermées. Les prérequis et résultats attendus vivent dans [`PROJECT.md`](PROJECT.md).

## Carte documentaire

- [`PROJECT.md`](PROJECT.md) : contrat produit, architecture, données et commandes.
- [`STATUS.md`](STATUS.md) : état réellement vérifié à une date donnée.
- [`ROADMAP.md`](ROADMAP.md) : ordre de livraison et critères de sortie.
- [`DESIGN.md`](DESIGN.md) : langage visuel extrait des concepts existants.
- [`ASSETS.md`](ASSETS.md) : sources, rôles, provenance et limites des visuels.
- [`CHANGELOG.md`](CHANGELOG.md) : changements livrés et impact observable.
- [`FOUNDATION.md`](FOUNDATION.md) : version du socle, profils et dérogations.
- [`DATA-PROCESSING.md`](DATA-PROCESSING.md) : données reçues, destinataires et rétention.
- [`THREAT-MODEL.md`](THREAT-MODEL.md) : scénarios d'abus et contrôles.
- [`RUNBOOK.md`](RUNBOOK.md) : préparation, déploiement et rollback sur Atlas.
- [`DELIVERY-EVIDENCE.md`](DELIVERY-EVIDENCE.md) : preuves et limites de la tranche en cours.
- `docs/api/openapi.json` : contrat canonique de l'API HTTP.
- [`DOCUMENTATION-CATALOG.md`](DOCUMENTATION-CATALOG.md) : navigation exhaustive des Markdown et de leurs audiences.
- [`AGENTS.md`](AGENTS.md) : règles locales d'intervention.

Le dépôt est public mais aucune licence de réutilisation n'est accordée à ce stade.
