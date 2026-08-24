# État courant

Dernière vérification : 2026-08-24 sur Cloudflare, GitHub et le DNS public.

## Résultat

`https://monflorian.com`, `https://www.monflorian.com` et la surface de
diagnostic `workers.dev` servent le même Worker Cloudflare. L'apex et `www`
répondent en HTTPS avec la version
`f5a18f77-3f32-466e-a3d4-35fa4218ee97`.

La zone est volontairement web-only. Aucun MX, SPF ou DMARC n'a été recréé.
La génération reste fermée avec `generationReady: false`, `serviceReady: false`
et `POST /api/itineraries` en `503`.

## Ressources Cloudflare vérifiées

| Ressource | État | Preuve |
| --- | --- | --- |
| Worker `monflorian` | déployé | version `f5a18f77-3f32-466e-a3d4-35fa4218ee97` |
| Static Assets | actifs | interface et visuels servis par l'apex et `www` |
| D1 `monflorian-production` | actif, juridiction `eu`, région d'exécution `EEUR` | migration `0001_trip_lifecycle.sql` appliquée |
| Tables D1 | vides et prêtes | `trips`, `trip_assets`, `daily_quotas` |
| Workflow `monflorian-trip` | déployé | classe `TripWorkflow`, garde-fou fermé |
| R2 | bloqué | activation initiale du compte requise dans le Dashboard |
| Turnstile | absent | requis avant génération gratuite |
| Secrets Worker | absents | aucun secret requis par l'aperçu fermé |
| Domaines Cloudflare | actifs | `monflorian.com` et `www.monflorian.com` comme Custom Domains |

## Preuves publiques Cloudflare

- `/` répond `200` sur l'apex et `www`, avec le titre attendu et les en-têtes de
  sécurité.
- `/api/health` répond `200`, version Worker exacte et
  `generationReady: false`.
- `/api/config` répond `200`, `serviceReady: false` et Booking `external`.
- `/.well-known/monflorian-release` annonce `cloudflare-workers` et la même
  version.
- `POST /api/itineraries` répond `503 GENERATION_UNAVAILABLE`.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Source runtime : `main` à `753fbd91aab7df1f3e4b2ccdac757b2bacadcd35`,
  fusionné par la PR [#17](https://github.com/nclsppr/monflorian/pull/17).
- Les runs `32753875356` (`Validate Cloudflare release`) et `32753875457`
  (`Verify`) du SHA fusionné sont verts.
- Le dépôt GitHub ne possède actuellement aucun secret Actions Cloudflare.
- Le déploiement du SHA fusionné a donc été réalisé depuis la session Wrangler
  locale.
- La protection de branche exige `verify` et `Validate Cloudflare release` ;
  l'ancien contrôle Atlas a été retiré de la règle.

## DNS public vérifié

| Type | Valeur utile |
| --- | --- |
| NS | `armfazh.ns.cloudflare.com`, `uma.ns.cloudflare.com` |
| A apex et `www` | `188.114.96.2`, `188.114.97.2` lors des sondes |
| AAAA apex et `www` | `2a06:98c1:3120::2`, `2a06:98c1:3121::2` lors des sondes |
| TLS | certificat `monflorian.com` couvrant aussi `*.monflorian.com` |
| MX | absent par décision web-only |

Cloudflare peut faire évoluer ses adresses anycast. Les deux résolveurs publics
`1.1.1.1` et `8.8.8.8` ont renvoyé les deux noms pendant la vérification.

## Limites

Cette tranche prouve le runtime Cloudflare fermé et son domaine web. Elle ne
prouve ni R2, ni génération OpenAI, ni page privée, ni courriel transactionnel,
ni Turnstile, ni affiliation, ni paiement. Aucun utilisateur ne doit envoyer de
brief ou de photo tant que les gates de `RESTE-A-FAIRE.md` ne sont pas terminées.
