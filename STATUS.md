# État courant

Dernière vérification : 2026-08-25 sur Cloudflare, GitHub et les réponses
publiques. Le relevé DNS de fond date du 2026-08-24.

## Résultat

`https://monflorian.com`, `https://www.monflorian.com` et la surface de
diagnostic `workers.dev` servent le même Worker Cloudflare. L'apex répond en
HTTPS avec la version `53adda80-16a4-40fe-869b-26e5d16a46d2`. `www`, HTTP et
les suffixes HTML publics redirigent désormais en `308` vers leur URL HTTPS
canonique.

L'accueil indexable présente désormais le service comme étant en préparation.
Le lockup complet reprend les gouttières du contenu et ne dépasse jamais
`1240 px` sur grand écran. La note choisit désormais parmi dix phrases courtes,
sans répéter immédiatement la précédente. Elle utilise Kalam auto-hébergée en
crayon sauge `#85897a` sur trois traits blancs irréguliers et translucides. Son
empreinte est fixe et resserrée sur mobile. Les cinq portraits Florian V2 sont
devenus la famille principale de l'accueil ; `/v2` redirige en `308` vers `/`
en conservant le paramètre `?avatar=`. Les icônes et la carte sociale reprennent
elles aussi Florian V2. La copie visible dit « Ton voyage, à ton rythme » et
explique que le formulaire n'envoie encore aucune donnée. Les API, les voyages
privés, leurs médias et `workers.dev` restent hors index. Les redirections
privées et techniques restent en `no-store`.

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
| Worker `monflorian` | déployé | version `53adda80-16a4-40fe-869b-26e5d16a46d2` |
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
  `Préparer un voyage à ton rythme | Mon Florian`, sa canonical, le script
  local `/motion.js` et les en-têtes de sécurité.
- `/v2` et `/v2/` répondent `308` vers l'accueil canonique en conservant la
  requête, par exemple `?avatar=flower`.
- Les cinq couples WebP de la seconde famille répondent `200` avec le type
  `image/webp`. Les portraits compacts pèsent de 25 818 à 36 052 octets et les
  portraits d'introduction de 104 784 à 162 212 octets.
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
- Le runtime `/` relu à `1280 × 720` mesure un dépassement horizontal nul et
  aligne l'introduction, le lockup et le hero à `1240 px`. La note mesure
  `311 px`. À `390 × 844`, les trois surfaces font `362 px`, la note `278 px`
  en `17 px`, sans dépassement.
- La note utilise Kalam chargée depuis le WOFF2 public de `22 336` octets et le
  crayon sauge `rgb(133, 137, 122)`. Vingt chargements publics ont présenté
  neuf des dix phrases sans aucune répétition consécutive ; le dixième choix
  est couvert par la régression déterministe.
- Les appareils tactiles gardent l'aperçu du Portugal fixe. La profondeur CSS
  native est limitée aux pointeurs précis ; la réduction des mouvements la
  supprime aussi. Ces règles sont couvertes par les régressions frontend.
- Le contrôle public a été effectué dans Chromium. Aucun iPhone Safari ni poste
  Windows 11 physique n'était disponible pendant cette tranche.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Source runtime déployée : `8609565b66fd61ac9b087680bc1d8468ac631386`,
  issue de la PR [#43](https://github.com/nclsppr/monflorian/pull/43).
- Les runs `32881682239` (`Cloudflare release`) et `32881682196` (`Verify`) du
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
exécutée car son serveur MCP n'est pas encore activé dans Codex. La suppression
du masque tactile est couverte par le CSS et les tests, sans contrôle sur un
iPhone Safari physique pendant cette tranche. Aucun utilisateur ne doit envoyer
de brief ou de photo tant que les gates de `RESTE-A-FAIRE.md` ne sont pas
terminées.
