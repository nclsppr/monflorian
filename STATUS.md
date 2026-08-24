# État courant

Dernière vérification : 2026-08-24 sur Cloudflare, GitHub et le DNS public.

## Résultat

`https://monflorian.com`, `https://www.monflorian.com` et la surface de
diagnostic `workers.dev` servent le même Worker Cloudflare. L'apex et `www`
répondent en HTTPS avec la version
`e0a0dae3-7330-4912-afe0-679608886323`.

La zone est volontairement web-only. Aucun MX, SPF ou DMARC n'a été recréé.
La génération reste fermée avec `generationReady: false`, `serviceReady: false`,
`tripCreationEnabled: false` et `POST /api/trips` en `503`. Le contrat
asynchrone, la page privée, R2 et le cron de purge sont déployés sans accepter de
demande réelle.

## Ressources Cloudflare vérifiées

| Ressource | État | Preuve |
| --- | --- | --- |
| Worker `monflorian` | déployé | version `e0a0dae3-7330-4912-afe0-679608886323` |
| Static Assets | actifs | interface et visuels servis par l'apex et `www` |
| D1 `monflorian-production` | actif, juridiction `eu`, région d'exécution `EEUR` | migrations `0001` et `0002` appliquées |
| Tables D1 | vides et prêtes | `trips`, `trip_assets`, `daily_quotas` |
| Workflow `monflorian-trip` | déployé | classe `TripWorkflow`, garde-fou fermé |
| R2 `monflorian-media-production` | actif, privé, juridiction `eu`, région `EEUR`, vide | aucun domaine, `r2.dev` désactivé, règles 24 h et 30 jours |
| Turnstile | absent | requis avant génération gratuite |
| Secrets Worker | fondation installée | `TRIP_DATA_KEY` et `TRIP_QUOTA_HASH_KEY`, valeurs jamais consignées |
| Domaines Cloudflare | actifs | `monflorian.com` et `www.monflorian.com` comme Custom Domains |

## Preuves publiques Cloudflare

- `/` répond `200` sur l'apex et `www`, avec le titre attendu et les en-têtes de
  sécurité.
- `/api/health` répond `200`, version Worker exacte et
  `generationReady: false`.
- `/api/config` répond `200`, `serviceReady: false` et Booking `external`.
- `/.well-known/monflorian-release` annonce `cloudflare-workers` et la même
  version.
- `POST /api/trips` répond `503 TRIP_CREATION_UNAVAILABLE` avant de lire une
  demande.
- Un jeton synthétique inconnu sous `/voyages/` répond `404`, `no-store`,
  `noindex`, `nofollow` et `no-referrer`.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Source runtime : `main` à `e8718a4507ca3e491f9b4d8eadc469c21fdf14a5`,
  issue des PR [#19](https://github.com/nclsppr/monflorian/pull/19) et
  [#20](https://github.com/nclsppr/monflorian/pull/20).
- Les runs `32762468302` (`Cloudflare release`) et `32762468303` (`Verify`) du
  SHA fusionné sont verts.
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

Cette tranche prouve le runtime Cloudflare fermé, son domaine web et la
configuration privée du bucket R2 vide et le rendu fermé de la page privée. Elle
ne prouve ni traitement de photo, ni génération OpenAI, ni purge applicative sur
des données synthétiques, ni courriel transactionnel, ni Turnstile, ni quotas,
ni affiliation, ni paiement. Aucun utilisateur ne doit envoyer de brief ou de
photo tant que les gates de `RESTE-A-FAIRE.md` ne sont pas terminées.
