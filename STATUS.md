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
| Source produit | `4c5619f807c98c929becf7589886577c2bdf9a5b` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:47dbc6705f5a1a8ce5a259dc5919a9472bda8afeae406319fb12447b70aaa816` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:528d64d5d3c4b7e70b2de3ecc21c0eaf6d6f064908cacaf5d27d14b4a89f63da` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:73837666d5b4bc7e96560f5c64a5908976c9afd9f3ded3d0686b55c336394f9b` |
| Route publique Atlas | `72b3ad4c8e3d83ce629cdc68cea11c599d9b543e` |
| Contrôleur applicatif installé | `d98db4e339224faebacbc0bc415388749abac91e` |
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
- Les cinq avatars publics sont les fichiers PNG RGBA attendus. Le navigateur a
  vu `original`, `wind`, `beanie`, `summer` et `flower` en rotation. Le même
  avatar est utilisé dans les deux emplacements pendant une visite.
- `nicolaspieper.com`, `papersempire.com` et `parkventory.com` répondent encore
  `200`.
- Le contrôle navigateur passe en 1280 x 720 et 390 x 844. Les avatars ont un
  fond CSS transparent, conservent leur taille intrinsèque de 1254 x 1254 et ne
  provoquent aucun débordement horizontal.

## Limites

Cette mise en ligne prouve le rendu et la chaîne de déploiement. Elle ne prouve
ni génération OpenAI, ni illustration, ni réservation, ni affiliation, ni
paiement, ni mini-site personnalisé. Ces capacités restent fermées jusqu'à une
nouvelle preuve et une nouvelle décision d'activation.
