# État courant

Dernière vérification : 2026-08-25 sur Cloudflare, GitHub et les réponses
publiques. Le relevé DNS de fond date du 2026-08-24.

## Résultat

`https://monflorian.com`, `https://www.monflorian.com` et la surface de
diagnostic `workers.dev` servent le même Worker Cloudflare. L'apex répond en
HTTPS avec la version `36448047-c74a-4e92-b0f5-913bf3ca8212`. `www`, HTTP et
les suffixes HTML publics redirigent désormais en `308` vers leur URL HTTPS
canonique.

L'accueil indexable présente le service comme s'il était ouvert sur
invitation : code d'accès avant le brief, informations réelles, limites
visibles, FAQ, titre, description, canonical, carte sociale, `robots.txt` et
sitemap. Les API, les voyages privés, leurs médias et `workers.dev` restent
hors index. Les redirections privées et techniques restent en `no-store`.

La zone ne reçoit aucun courriel humain. Cloudflare Email Service est activé
avec ses seuls DNS d'envoi, de signature et de gestion des bounces.
La génération reste fermée avec `generationReady: false`, `serviceReady: false`,
`tripCreationEnabled: false` et `POST /api/trips` en `503`. Le quota
transactionnel, les appels Responses et Image Edits, la page privée, la lecture
privée des images, R2 et le cron de purge sont déployés sans accepter de demande
réelle. La notice `/confidentialite` nomme les données, les destinataires, les
durées et la suppression anticipée, sans masquer les réglages et le canal encore
manquants.

## Ressources Cloudflare vérifiées

| Ressource | État | Preuve |
| --- | --- | --- |
| Worker `monflorian` | déployé | version `36448047-c74a-4e92-b0f5-913bf3ca8212` |
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

- `/` répond `200` sur l'apex avec le titre
  `Itinéraire de voyage personnalisé | Mon Florian`, sa canonical et les
  en-têtes de sécurité.
- HTTP, `www`, `/index.html` et `/confidentialite.html` répondent `308` vers
  l'URL HTTPS canonique en conservant la requête utile.
- `/robots.txt`, `/sitemap.xml`, la carte sociale PNG et les portraits WebP
  répondent `200` avec leur type attendu. Le sitemap contient seulement
  l'accueil canonique.
- `/api/health` répond `200`, version Worker exacte et
  `generationReady: false`.
- `/api/config` répond `200`, `serviceReady: false` et Booking `external`.
- `workers.dev` répond avec `X-Robots-Tag: noindex, nofollow, nosnippet,
  noimageindex`.
- Une redirection HTTP synthétique sous `/voyages/` répond `308`, `no-store`,
  `no-referrer` et `noindex` vers l'apex HTTPS.
- `/.well-known/monflorian-release` annonce `cloudflare-workers` et la même
  version.
- `POST /api/trips` répond `503 TRIP_CREATION_UNAVAILABLE` avant de lire une
  demande.
- Une image inconnue sous `/api/trips/{jeton}/media/0` répond `404`, `no-store`,
  `same-origin` et `no-referrer`.
- Un jeton synthétique inconnu sous `/voyages/` répond `404`, `no-store`,
  `noindex`, `nofollow` et `no-referrer`.
- Le navigateur public à `1280 × 720` mesure un dépassement horizontal nul,
  un champ de code à `52 px` avec `13 px` de padding vertical et un bouton à
  `52 px`. Les sections éditoriales et la FAQ ont aussi été contrôlées.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Source runtime : `main` à `344c26e9d01dfd872cd8b39f96ff0f84098dcb52`,
  issue de la PR [#29](https://github.com/nclsppr/monflorian/pull/29).
- Les runs `32828870730` (`Cloudflare release`) et `32828870752` (`Verify`) du
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

Cette tranche prouve le runtime Cloudflare fermé, son domaine web, l'accueil
indexable, le quota D1 atomique, la configuration privée du bucket R2 vide, le
rendu fermé de la page privée et la notice publique. Elle ne prouve ni
positionnement dans les moteurs, ni Core Web Vitals réels, ni appel OpenAI, ni
coût fournisseur, ni purge applicative distante sur des données synthétiques,
ni validation Turnstile de bout en bout, ni envoi synthétique de courriel, ni
affiliation, ni paiement. La trace spécialisée Chrome DevTools n'a pas été
exécutée car son serveur MCP n'est pas encore activé dans Codex. Aucun
utilisateur ne doit envoyer de brief ou de photo tant que les gates de
`RESTE-A-FAIRE.md` ne sont pas terminées.
