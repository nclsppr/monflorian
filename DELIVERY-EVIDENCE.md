# Preuves de livraison

Chaque section nomme son environnement et ses limites. Les sections Atlas sont
des archives historiques ; la section Cloudflare porte la migration courante.

## Génération asynchrone fermée déployée, 2026-08-24

La PR [#22](https://github.com/nclsppr/monflorian/pull/22) câble le parcours
Responses puis Image Edits dans le Workflow Cloudflare. La PR
[#23](https://github.com/nclsppr/monflorian/pull/23) ajoute Turnstile. La version
est publique, mais tous les appels payants et la création de voyage restent
fermés.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `de029d02f5a27976893e82f2e2b16d032d3b0316` |
| Version active | `ff2bc6e7-6bc2-4a6f-968c-3862ed060534` |
| CI du SHA | runs `32765104823` et `32765104771` verts |
| D1 distant | migrations à jour, zéro voyage, zéro asset et zéro quota |
| Quotas | plafond global `10`, plafond client `2`, débit atomique |
| OpenAI Responses | `store: false`, schéma strict, identifiant de sûreté pseudonymisé |
| OpenAI Image Edits | source lue depuis R2 privé, sortie WebP privée |
| Reprise | aucun retry automatique d'un appel OpenAI au résultat incertain |
| Route d'image | `/api/trips/{jeton}/media/{position}`, liée au jeton et `no-store` |
| Turnstile | widget géré pour l'apex, `www` et `workers.dev`, secret Worker installé |
| Secrets présents | chiffrement, quota et Turnstile, valeurs non affichées |
| Garde-fous | création, texte, image et courriel à `false` |

Les sondes de l'apex, de `www` et de `workers.dev` renvoient la même version et
`generationReady: false`. `POST /api/trips` répond `503` avant de lire la
demande. Une route d'image inconnue répond `404` avec `no-store`, `same-origin`
et `no-referrer`. Le contrôle ciblé du quota provoque l'erreur attendue quand un
plafond est dépassé et confirme le rollback des deux compteurs.

`./scripts/verify.sh` passe avec 31 tests. Aucun appel OpenAI, aucun courriel,
aucune photo réelle et aucun coût fournisseur n'ont été déclenchés. L'ouverture
attend encore la clé OpenAI, le fournisseur de courriel, le secret du code
d'accès, la validation Turnstile de bout en bout et un unique essai synthétique
observé.

## Fondation du voyage privé déployée, 2026-08-24

Cette tranche prépare le stockage privé et le contrat asynchrone sans ouvrir la
création. Elle ne contient aucune donnée personnelle et ne lance aucun appel
OpenAI ni courriel.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `e8718a4507ca3e491f9b4d8eadc469c21fdf14a5` |
| PR | [#19](https://github.com/nclsppr/monflorian/pull/19) et [#20](https://github.com/nclsppr/monflorian/pull/20) fusionnées |
| CI du SHA | runs `32762468302` et `32762468303` verts |
| Version active | `e0a0dae3-7330-4912-afe0-679608886323` |
| R2 | `monflorian-media-production`, juridiction `eu`, région `EEUR`, 0 objet |
| Exposition R2 | aucun domaine personnalisé, `r2.dev` désactivé |
| Cycle de vie R2 | `source/` expire après 1 jour, `generated/` après 30 jours |
| D1 distant | migration `0002_trip_idempotency.sql` appliquée |
| Secrets | `TRIP_DATA_KEY` et `TRIP_QUOTA_HASH_KEY` présents, valeurs non affichées |
| Contrat déployé | `POST /api/trips`, page `/voyages/{jeton}`, retrait et purge planifiée |
| Protection des champs | AES-GCM avec contexte, jeton SHA-256, idempotence hachée |
| Garde-fou | `MONFLORIAN_TRIP_CREATION_ENABLED=false` |

Les sondes publiques prouvent `/api/health` et `/api/config` en `200`, le même
identifiant de version sur l'apex, `www` et `workers.dev`, ainsi que
`POST /api/trips` en `503 TRIP_CREATION_UNAVAILABLE`. Un jeton synthétique
inconnu répond `404` avec `no-store`, `noindex`, `nofollow` et `no-referrer`. D1
contient zéro voyage, zéro asset et zéro quota ; R2 contient zéro objet.

Les contrôles locaux ciblés couvrent la validation de la demande combinée,
l'idempotence, le chiffrement lié au contexte, les en-têtes privés et les routes
de jeton normalisées. Le rendu a été contrôlé à `430 × 932` et `1440 × 900` :
aucun débordement horizontal, aucune erreur console et états du formulaire
lisibles. La fondation privée est livrée, mais pas la création de voyage. La
purge applicative reste à prouver avec des données synthétiques ; Turnstile,
quotas, OpenAI, illustration privée et courriel restent fermés.

## Champs de date contenus sur iOS, 2026-08-24

La PR [#17](https://github.com/nclsppr/monflorian/pull/17) retire le padding des
champs `date` qui déclenche le calcul de largeur incorrect de WebKit iOS. La
feuille CSS change aussi d'URL pour éviter de conserver l'ancienne règle dans le
cache du navigateur.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `753fbd91aab7df1f3e4b2ccdac757b2bacadcd35` |
| Version active | `f5a18f77-3f32-466e-a3d4-35fa4218ee97` |
| CI du SHA | runs `32753875356` et `32753875457` verts |
| URL CSS | `/styles.css?v=ios-date-1` sur l'apex et `www` |
| Mobile | viewport `430 × 932`, largeur de page `430`, dépassement `0` |
| Contrôles mesurés | départ, retour, voyageurs et code d'accès |

La régression ciblée échoue sans la surcharge `padding-inline: 0` et passe avec
elle. La page publique, la santé et la nouvelle feuille CSS répondent en `200`
sur `monflorian.com` et `www.monflorian.com`. La génération reste fermée et
aucune donnée utilisateur n'a été envoyée.

## Domaine Cloudflare web-only, 2026-08-24

La PR [#15](https://github.com/nclsppr/monflorian/pull/15) attache l'apex et
`www` au Worker comme Custom Domains. La version a été déployée après fusion,
puis sondée sur les deux noms publics.

| Preuve | Résultat |
| --- | --- |
| URLs | `https://monflorian.com`, `https://www.monflorian.com` |
| Surface de diagnostic | `https://monflorian.nclsppr.workers.dev` conservée |
| Source runtime | `6f6a8438222db31293541c81957434e1841c5df4` |
| Version active | `ce9761c2-5c36-480e-958c-d923bdf49ef0` |
| CI du SHA | runs `32752297195` et `32752297248` verts |
| NS | `armfazh.ns.cloudflare.com`, `uma.ns.cloudflare.com` |
| DNS web | apex et `www` résolus en A et AAAA par `1.1.1.1` et `8.8.8.8` |
| TLS | certificat Google Trust Services pour `monflorian.com` et `*.monflorian.com` |
| HTTP | page, santé et marqueur de release en `200` sur les deux noms |
| Garde-fou | `POST /api/itineraries` en `503 GENERATION_UNAVAILABLE` |
| Courriel de zone | aucun MX, SPF ou DMARC, conformément à l'ADR-0008 |

La santé et le marqueur public renvoient tous deux la version exacte
`ce9761c2-5c36-480e-958c-d923bdf49ef0`. Le titre public est
`Mon Florian · Prépare ton voyage` et la politique de sécurité reste servie par
le Worker. Aucun secret, brief, courriel ou fichier n'a été envoyé pendant ces
sondes. Atlas n'a pas été modifié.

## Bootstrap Cloudflare fermé, 2026-08-24

Cette preuve ouvre la migration décidée par l'ADR-0007. La PR
[#12](https://github.com/nclsppr/monflorian/pull/12) est fusionnée sur `main` et
la version Worker ci-dessous a été redéployée depuis ce SHA.

| Preuve | Résultat |
| --- | --- |
| URL | `https://monflorian.nclsppr.workers.dev` |
| Worker | `monflorian` |
| Source runtime | `6d7029877c9acb098feecea029337d427d0aedd6` |
| Version active | `70b89e6c-e5ce-4e57-a74e-a3bd4186a0ab` |
| Bundle | 9,05 KiB avant compression, 3,13 KiB gzip |
| Static Assets | 13 fichiers lus, 11 objets initiaux chargés |
| D1 | `monflorian-production`, juridiction `eu`, exécution `EEUR` |
| Migration | `0001_trip_lifecycle.sql`, 9 commandes appliquées |
| Workflow | `monflorian-trip`, classe `TripWorkflow` |
| R2 | non activé sur le compte, aucun bucket créé |
| CI du SHA | runs `32742064604` et `32742064568` verts |

Les sondes publiques prouvent : page `200`, en-têtes de sécurité, santé `200`,
configuration fermée, marqueur de release cohérent et itinéraire refusé en
`503 GENERATION_UNAVAILABLE`. Aucun secret ni contenu utilisateur n'a été
envoyé.

Le dry-run Wrangler a validé les bindings Static Assets, D1, Workflow et version
metadata. La base contient seulement `trips`, `trip_assets`, `daily_quotas` et
les tables internes D1 ; aucune ligne utilisateur n'a été créée.

La protection de `main` exige désormais `verify` et
`Validate Cloudflare release`. Limites : le domaine reste hors Cloudflare ; R2,
Turnstile, OpenAI, courriel, page privée, affiliation et Stripe ne font pas
partie de cette preuve. Le déploiement automatique depuis Git reste à connecter.

## Avatars transparents en production, 2026-08-24

La source `4c5619f807c98c929becf7589886577c2bdf9a5b` est active sur
`https://monflorian.com`. La PR produit
[#10](https://github.com/nclsppr/monflorian/pull/10) fournit cinq avatars PNG
RGBA. La PR Atlas [#114](https://github.com/nclsppr/vps-infra/pull/114) aligne
la route publique sur la source attestée avant l'activation applicative.

| Preuve | Résultat |
| --- | --- |
| Source produit | `4c5619f807c98c929becf7589886577c2bdf9a5b` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:47dbc6705f5a1a8ce5a259dc5919a9472bda8afeae406319fb12447b70aaa816` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:528d64d5d3c4b7e70b2de3ecc21c0eaf6d6f064908cacaf5d27d14b4a89f63da` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:73837666d5b4bc7e96560f5c64a5908976c9afd9f3ded3d0686b55c336394f9b` |
| Route publique Atlas | `72b3ad4c8e3d83ce629cdc68cea11c599d9b543e` |
| HTTP | apex `200`, `www` `308`, configuration publique désactivée |
| Runtime | sain, aucun redémarrage, UID/GID `10001:10001`, lecture seule, aucun port hôte |
| Navigateur | 1280 x 720 et 390 x 844, cinq variantes vues, fond transparent et aucun débordement |

Les cinq fichiers publics ont les mêmes SHA-256 que les sources du dépôt :

- `florian-original.png` : `05e7d579661357685a75057990ca2526101b287be1a15c0b6cf0e374d7f5f20c` ;
- `florian-wind.png` : `e7886a41ce1e3975c9a89935ba352160a0b8f0095aafc21dde1d4bc0d5c936dc` ;
- `florian-beanie.png` : `0ec7f32e8fc276a5ec6b824cf7cb841bc5ac5db0ddbaae678dc8c16f8955c7e6` ;
- `florian-summer.png` : `8ebf4de989f1d5a84b9c56b00fc33e18e8ee5e930ea25b96d005bc34869382cc` ;
- `florian-flower.png` : `cdd5e43f5bcc015517682313faca5077b12b84cc71e03e1fca2058ec8c51d202`.

Les workflows produit `32726011754`, `32726011698` et `32726011739` sont
verts. Le workflow Atlas `32735640921` est vert. La convergence de l'edge a
terminé avec `failed=0`. Le contrôle prédictif global a terminé avec `failed=0`
et n'a appliqué aucun changement. Les trois autres apex publics répondent encore
`200`.

## Aperçu public Atlas, 2026-08-24

L'aperçu décidé par ADR-0004 est actif sur `https://monflorian.com`. Il sert
l'interface réelle sans identifiant, tout en refusant les générations.

| Preuve | Résultat |
| --- | --- |
| Source produit | `4ac2c42339941e34c128f779399688032c8ef304` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:af8d18a3df82f8be18f2fd48aebb0a7ff5d62159baf552f1d9fe00ef92d418ba` |
| Contrôle central | `d98db4e339224faebacbc0bc415388749abac91e` |
| Apex | HTTPS `200`, certificat valide, HSTS |
| `www` | `308` vers `https://monflorian.com/` |
| Configuration publique | `serviceReady: false`, `illustrationEnabled: false`, accès `public` |
| Runtime | backend sain, UID/GID `10001:10001`, lecture seule, aucun port hôte |
| Réseau | backend sur `app_monflorian` uniquement, Caddy sain à `172.30.40.254` |
| Navigateur | 1440 x 900 et 390 x 844, aucun débordement ni erreur de console |
| Journaux | champs backend limités au contrat technique; aucun brief, photo, clé, secret ou corps; unique mention Caddy `authorization` liée à ACME |
| Régression Atlas | Mon Florian et les trois apex existants sont restés en `200` pendant quinze minutes |

Les workflows produit `32662637850`, `32662637871` et `32662637854` sont
verts. L'admission Atlas a été fusionnée par la PR 111, puis la correction du
contrôleur historique par la PR 113. Aucun appel OpenAI, aucune photo, aucun
paiement et aucune réservation ne font partie de cette preuve.

> Ce relevé conserve la preuve historique du candidat F01. Il ne décrit pas le candidat courant et ne doit pas servir d'entrée à un déploiement. Utiliser [`STATUS.md`](STATUS.md) pour le tuple figé et [`RESTE-A-FAIRE.md`](RESTE-A-FAIRE.md) pour l'ordre de reprise.

## Référence

| Champ | Valeur |
| --- | --- |
| Unité de travail | F01, backend OpenAI, interface, dessins et contrat Atlas |
| Date | 2026-08-23 |
| Dépôt | `nclsppr/monflorian` |
| Branche | `main` |
| Candidat vérifié | `a7c5d1c32a41c2e43c92f02bff4d584910727eb1` |
| Admission Atlas | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Statut | candidat publié, VPS préparé, service non activé |

## Résultat demandé

Produire une application qui génère un trajet avec OpenAI, ouvre des recherches d'hébergement Booking.com sans inventer d'affiliation, puis crée une projection dessinée à partir de photos consenties. Préparer son déploiement sur Atlas et le domaine OVHcloud.

## Résultat prouvé

- Le backend et le frontend sont commités et poussés sur `main`.
- Les tests locaux, Compose, l'interface mobile et l'interface bureau passent.
- Trois workflows GitHub du même SHA sont verts.
- Les trois artefacts OCI ont des digests et des attestations de provenance.
- L'admission Atlas dormante a été relue, fusionnée et convergée sur le vrai VPS.
- Les enregistrements A de l'apex et de `www` pointent vers Atlas sur les serveurs autoritaires et les résolveurs publics.
- Mon Florian ne tourne pas encore. Le secret, le conteneur, la route active et le certificat sont absents.

## Frontières produit

| Sujet | Contrat retenu |
| --- | --- |
| Itinéraire | Réponse JSON structurée, `store: false`, délai borné et annulation si le client part |
| Photos | 1 à 4 images consenties, validation réelle, réencodage et aucune persistance applicative |
| Illustration | Dessin de projection, jamais présenté comme une photo future réelle |
| Booking.com | Modes `off`, `external` et `cj-static`; aucun hôtel, prix ou stock inventé |
| Affiliation | `rel="sponsored"`; mode `cj-static` interdit sans lien approuvé |
| Runtime | Node.js 24, bibliothèque standard, aucun paquet npm en production |
| Exposition | Aucun port hôte, Caddy doit rejoindre le réseau applicatif et protéger les routes coûteuses |

## Contrôles du candidat

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| `npm test` | 25 tests réussis | Validation, fournisseur simulé, erreurs, annulation et serveur |
| Contrat de release Atlas | 13 tests réussis | Compose, OCI, workflows et règles d'intégration |
| `./scripts/verify.sh` | succès | Tests, documentation, image, santé Compose et arrêt propre |
| Navigateur 1440 x 900 | succès | Mise en page, états et console |
| Navigateur 390 x 844 | succès | Responsive, cibles tactiles et absence de débordement |
| Trivy distant | 0 HIGH, 0 CRITICAL | Image backend publiée |
| Détection de fausse image | rejetée | Le serveur ne fait pas confiance au seul en-tête de fichier |
| Requête HTTP mal formée | `400`, serveur toujours sain | Robustesse du parseur |
| Photo quand la fonction est coupée | bloquée avant envoi | Le drapeau de fonction ne laisse pas fuiter les photos |

## Publication immuable

| Élément | Preuve |
| --- | --- |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:a5c3b1d1f1164697039afe62ccb4bfcb1258c941a5667a220cb3a80a7e3ae114` |
| Intégration | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:cb485c36bc32311f9066bb9e7af6089377090fde2f5d493e7f5d48a9205e052b` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:9f7e279892bb3d2e4fbddf8a3bbb36238485d4c3279ff4ddef15927ec4b460e1` |
| Archive de preuve | [artifact 9494271140](https://github.com/nclsppr/monflorian/actions/runs/32643543726/artifacts/9494271140) |
| SHA-256 de l'archive | `793181a9f1043de7d982e810329843ca1a39b91c0634940cbad62c8d38128aa3` |
| Attestation backend | [42424171](https://github.com/nclsppr/monflorian/attestations/42424171) |
| Attestation intégration | [42424201](https://github.com/nclsppr/monflorian/attestations/42424201) |
| Attestation release | [42424207](https://github.com/nclsppr/monflorian/attestations/42424207) |

## CI distante

| Workflow | Run | État |
| --- | --- | --- |
| Verify | [32643543755](https://github.com/nclsppr/monflorian/actions/runs/32643543755) | succès |
| Container images | [32643543727](https://github.com/nclsppr/monflorian/actions/runs/32643543727) | succès |
| VPS integration release | [32643543726](https://github.com/nclsppr/monflorian/actions/runs/32643543726) | succès |

## Admission Atlas

La PR [vps-infra 96](https://github.com/nclsppr/vps-infra/pull/96) a ajouté un profil désactivé, sans base ni migrateur. Les contrôles de branche et les trois workflows de `main` sont verts.

| Élément | Preuve |
| --- | --- |
| Révision fusionnée | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Validate | [32644204671](https://github.com/nclsppr/vps-infra/actions/runs/32644204671) |
| Platform integration artifact | [32644204694](https://github.com/nclsppr/vps-infra/actions/runs/32644204694) |
| Caddy platform image | [32644204794](https://github.com/nclsppr/vps-infra/actions/runs/32644204794) |
| Convergence réelle | `ok=379`, `changed=13`, `failed=0` |
| Contrôle prédictif | `ok=221`, `changed=0`, `failed=0` |

L'inspection distante confirme la révision installée, le réseau vide `172.30.40.0/24`, les répertoires root et l'absence du secret, du conteneur et du lien d'activation. Caddy, PostgreSQL et les services de supervision déjà présents restent sains.

## Changement DNS

| Contrôle | Résultat |
| --- | --- |
| A autoritaire, apex | `137.74.174.163` |
| A autoritaire, `www` | `137.74.174.163` |
| Cloudflare `1.1.1.1` | les deux noms sur `137.74.174.163` |
| Google `8.8.8.8` | les deux noms sur `137.74.174.163` |
| AAAA | aucun |
| MX | `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, `mx3.mail.ovh.net` préservés |
| TXT | présents, hors du changement |

Une requête avec résolution forcée vers Atlas renvoie `404` en HTTP. TLS renvoie une erreur interne avant émission du certificat. C'est le résultat attendu d'une route encore désactivée, pas une preuve de mise en ligne.

## Gates

| Gate | État | Ce qui manque |
| --- | --- | --- |
| Publication Git et CI | validée | rien pour le candidat `a7c5d1c` |
| Artefacts et provenance | validée | rien pour le candidat `a7c5d1c` |
| Admission Atlas dormante | validée | rien pour la préparation |
| Secret OpenAI | bloquée | nouvelle clé créée hors conversation |
| Smoke test Responses | bloqué | clé sûre et budget borné |
| Smoke test Images | bloqué | clé sûre et fixture synthétique |
| Accès privé | bloqué | identifiant privé et vérification de tous les chemins coûteux |
| Activation Atlas | bloquée | PR d'activation, secret, route, profil et sondes |
| TLS public | bloqué | route active et application saine |
| Booking affilié | bloqué | partenariat et lien approuvé |

## Secrets

La clé OpenAI partagée dans la conversation n'est pas une entrée de production. Elle doit être révoquée. Aucun secret n'a été inscrit dans le dépôt, les sorties de CI ou Atlas. Le contrat de production attend un fichier root lisible par le groupe applicatif, mode `0440`, sous `/etc/vps/secrets/monflorian/`.

## Rollback

| Cible | Procédure |
| --- | --- |
| DNS | Remettre seulement apex et `www` sur `213.186.33.5` |
| Admission dormante | Revenir sur la PR Atlas sans toucher aux autres applications |
| Activation future | Retirer la route, désactiver le profil et revenir au digest précédent |
| Booking.com | Garder ou remettre le mode `external` |
| Données utilisateur | Aucun volume applicatif à restaurer, car l'application ne persiste rien |

## Conclusion

Le candidat est publié et l'hôte est prêt à le recevoir. Le domaine pointe déjà vers Atlas, un peu en avance sur l'application. Le service reste volontairement fermé tant qu'une nouvelle clé OpenAI, un accès privé et les deux smoke tests réels ne sont pas disponibles.
