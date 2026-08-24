# État courant

Dernière vérification : 2026-08-24 sur Atlas et depuis le réseau public.

## Résultat

L'aperçu public est en ligne sur `https://monflorian.com`. La page réelle répond
sans identifiant, mais aucune demande de voyage ni photo n'est envoyée. Le
formulaire annonce l'indisponibilité et son action reste désactivée, conformément
à [ADR-0004](docs/decisions/adr-0004-apercu-public-sans-generation.md).

## Release active

| Champ | Valeur |
| --- | --- |
| Source produit | `4ac2c42339941e34c128f779399688032c8ef304` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:f5340476e924a15618a95f215b7172b50c98f5deff7a47a4cc07c698cad46e7d` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:f5785b6b37d482c279b62386231810ced750c6189c1595aafa71f95851f1b102` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:af8d18a3df82f8be18f2fd48aebb0a7ff5d62159baf552f1d9fe00ef92d418ba` |
| Contrôle central Atlas | `d98db4e339224faebacbc0bc415388749abac91e` |
| Booking | Mode `external`, aucune affiliation prouvée |

## Preuves publiques et Atlas

- L'apex répond `200` en HTTPS avec un certificat valide et HSTS.
- `www` répond `308` vers l'apex.
- `/api/config` répond `200` avec `serviceReady: false` et
  `illustrationEnabled: false`.
- `/.well-known/monflorian-release` expose la source produit exacte.
- Le conteneur est sain, utilise le digest backend ci-dessus, l'UID/GID
  `10001:10001`, un système de fichiers en lecture seule et aucun port hôte.
- Le backend ne rejoint que `app_monflorian`. Caddy y possède l'adresse
  `172.30.40.254` et reste sain.
- Les transactions applicatives sont vides après activation.
- `nicolaspieper.com`, `papersempire.com` et `parkventory.com` répondent encore
  `200`.
- Le contrôle navigateur passe en 1440 x 900 et 390 x 844, sans débordement ni
  erreur de console.

## Limites

Cette mise en ligne prouve le rendu et la chaîne de déploiement. Elle ne prouve
ni génération OpenAI, ni illustration, ni réservation, ni affiliation, ni
paiement, ni mini-site personnalisé. Ces capacités restent fermées jusqu'à une
nouvelle preuve et une nouvelle décision d'activation.
