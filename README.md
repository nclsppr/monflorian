# Mon Florian

Mon Florian transforme un brief libre en proposition de voyage expliquée. La
cible Cloudflare servira ensuite une page privée avec l'itinéraire, des
projections synthétiques éditoriales à partir de photos consenties et des liens
d'hébergement.

Le runtime courant est un Worker TypeScript avec Static Assets. Il expose déjà
l'interface sur `workers.dev`, mais maintient les générations fermées. D1 et un
Workflow, R2, les secrets de chiffrement et de quota, Turnstile et le courriel
sont provisionnés derrière des drapeaux fermés, sans donnée utilisateur. La clé
OpenAI n'est pas installée et Stripe n'est pas activé.

## Démarrage

```bash
cp .env.example .env
docker compose up --build --wait
```

L'application répond sur `http://127.0.0.1:8080`. Les variables publiques vivent
dans `wrangler.jsonc`. Les secrets locaux éventuels vont dans `.dev.vars`, jamais
dans Git.

Commandes utiles :

```bash
npm run dev
npm run check:worker
./scripts/verify.sh
```

## Carte documentaire

- [`PROJECT.md`](PROJECT.md) : contrat produit, architecture et commandes.
- [`STATUS.md`](STATUS.md) : état vérifié de Cloudflare et limites publiques.
- [`RESTE-A-FAIRE.md`](RESTE-A-FAIRE.md) : gates restantes avant génération.
- [`ROADMAP.md`](ROADMAP.md) : ordre de livraison.
- [`DATA-PROCESSING.md`](DATA-PROCESSING.md) : données, destinataires et durées.
- [`THREAT-MODEL.md`](THREAT-MODEL.md) : menaces et contrôles.
- [`RUNBOOK.md`](RUNBOOK.md) : déploiement et rollback Cloudflare.
- [`DELIVERY-EVIDENCE.md`](DELIVERY-EVIDENCE.md) : preuves actuelles et archives.
- [`DESIGN.md`](DESIGN.md) et [`ASSETS.md`](ASSETS.md) : interface et visuels.
- [`CHANGELOG.md`](CHANGELOG.md) : changements livrés.
- [`FOUNDATION.md`](FOUNDATION.md) : socle, profils et dérogations.
- [`DOCUMENTATION-CATALOG.md`](DOCUMENTATION-CATALOG.md) : catalogue exhaustif.
- [`AGENTS.md`](AGENTS.md) : règles locales d'intervention.

Le dépôt est public, mais aucune licence de réutilisation n'est accordée.
