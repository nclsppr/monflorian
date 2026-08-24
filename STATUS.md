# État courant

Dernière vérification : 2026-08-24 sur Cloudflare, GitHub et le DNS public.

## Résultat

`https://monflorian.com`, `https://www.monflorian.com` et la surface de
diagnostic `workers.dev` servent le même Worker Cloudflare. L'apex et `www`
répondent en HTTPS avec la version
`621217cf-3033-4144-8f74-be1cd7c3ff4b`.

La zone ne reçoit aucun courriel humain. Cloudflare Email Service est activé
avec ses seuls DNS d'envoi, de signature et de gestion des bounces.
La génération reste fermée avec `generationReady: false`, `serviceReady: false`,
`tripCreationEnabled: false` et `POST /api/trips` en `503`. Le quota
transactionnel, les appels Responses et Image Edits, la page privée, la lecture
privée des images, R2 et le cron de purge sont déployés sans accepter de demande
réelle.

## Ressources Cloudflare vérifiées

| Ressource | État | Preuve |
| --- | --- | --- |
| Worker `monflorian` | déployé | version `621217cf-3033-4144-8f74-be1cd7c3ff4b` |
| Static Assets | actifs | interface et visuels servis par l'apex et `www` |
| D1 `monflorian-production` | actif, juridiction `eu`, région d'exécution `EEUR` | migrations `0001`, `0002` et `0003` appliquées |
| Tables D1 | vides et prêtes | `trips`, `trip_assets`, `daily_quotas` |
| Workflow `monflorian-trip` | déployé | Responses et Image Edits sans retry, garde-fou fermé |
| R2 `monflorian-media-production` | actif, privé, juridiction `eu`, région `EEUR`, vide | aucun domaine, `r2.dev` désactivé, règles 24 h et 30 jours |
| Turnstile | widget géré configuré | apex, `www` et `workers.dev`, parcours encore fermé |
| Email Service | domaine activé, quota initial de 200 envois par jour | binding déployé restreint à `voyage@monflorian.com`, drapeau fermé |
| Secrets Worker | trois secrets installés | chiffrement, quota et Turnstile, valeurs jamais consignées |
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
- Une image inconnue sous `/api/trips/{jeton}/media/0` répond `404`, `no-store`,
  `same-origin` et `no-referrer`.
- Un jeton synthétique inconnu sous `/voyages/` répond `404`, `no-store`,
  `noindex`, `nofollow` et `no-referrer`.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Source runtime : `main` à `ab852a55d5dcd8095b445cdc5dd7e868b95a20fa`,
  issue des PR [#22](https://github.com/nclsppr/monflorian/pull/22),
  [#23](https://github.com/nclsppr/monflorian/pull/23) et
  [#25](https://github.com/nclsppr/monflorian/pull/25).
- Les runs `32767377995` (`Cloudflare release`) et `32767378027` (`Verify`) du
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
| MX apex | absent, aucune boîte de réception humaine |
| MX `cf-bounce` | trois routes Cloudflare pour les retours de livraison |
| TXT | SPF et DKIM d'envoi, DMARC `p=reject` |

Cloudflare peut faire évoluer ses adresses anycast. Les deux résolveurs publics
`1.1.1.1` et `8.8.8.8` ont renvoyé les deux noms pendant la vérification.

## Limites

Cette tranche prouve le runtime Cloudflare fermé, son domaine web, le quota D1
atomique, la configuration privée du bucket R2 vide et le rendu fermé de la page
privée. Elle ne prouve ni appel OpenAI réel, ni coût fournisseur, ni purge
applicative distante sur des données synthétiques, ni validation Turnstile de
bout en bout, ni envoi synthétique de courriel, ni affiliation, ni paiement. Aucun
utilisateur ne doit envoyer de brief ou de photo tant que les gates de
`RESTE-A-FAIRE.md` ne sont pas terminées.
