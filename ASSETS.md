# ASSETS.md

Source canonique des visuels de marque et des références importées le 2026-08-23.

## Inventaire

| Fichier | Rôle | Statut | Dimensions | SHA-256 à l'import | Provenance |
| --- | --- | --- | --- | --- | --- |
| `assets/brand/monflorian-logo.png` | Lockup principal avec Florian, nom et avion | Master raster provisoire | 2172 x 724, RGBA | `40b062b5c99b4adacfba105fda1801d9e743c25953d94be119e4fec1e48dd161` | Fourni par le propriétaire du dépôt sous le nom `monflorian-logo.png` |
| `assets/brand/monflorian-wordmark.png` | Nom et avion fixes du logo modulable | Dérivé de production | 676 x 362, RGBA | `2a61387ff733238b31786bb9d242d7d0578c9a8ad9ba8cf9a973409af5181dcd` | Recadré et réduit depuis le master, sans retouche du dessin |
| `assets/brand/florian-original.png` | Portrait de repli du logo modulable | Dérivé généré | 1254 x 1254, RGBA | `05e7d579661357685a75057990ca2526101b287be1a15c0b6cf0e374d7f5f20c` | Fourni par le propriétaire après édition du portrait canonique dans ChatGPT, avec fond transparent |
| `assets/brand/florian-wind.png` | Variante cheveux au vent | Dérivé généré | 1254 x 1254, RGBA | `e7886a41ce1e3975c9a89935ba352160a0b8f0095aafc21dde1d4bc0d5c936dc` | Fourni par le propriétaire après édition du portrait canonique dans ChatGPT, avec fond transparent |
| `assets/brand/florian-beanie.png` | Variante avec bonnet | Dérivé généré | 1254 x 1254, RGBA | `0ec7f32e8fc276a5ec6b824cf7cb841bc5ac5db0ddbaae678dc8c16f8955c7e6` | Fourni par le propriétaire après édition du portrait canonique dans ChatGPT, avec fond transparent |
| `assets/brand/florian-summer.png` | Variante avec bob et lunettes de soleil | Dérivé généré | 1254 x 1254, RGBA | `8ebf4de989f1d5a84b9c56b00fc33e18e8ee5e930ea25b96d005bc34869382cc` | Fourni par le propriétaire après édition du portrait canonique dans ChatGPT, avec fond transparent |
| `assets/brand/florian-flower.png` | Variante avec chapeau de paille fleuri | Dérivé généré | 1254 x 1254, RGBA | `cdd5e43f5bcc015517682313faca5077b12b84cc71e03e1fca2058ec8c51d202` | Fourni par le propriétaire après édition du portrait canonique dans ChatGPT, avec fond transparent |
| `references/concepts/landing-primary.png` | Capture de la direction retenue | Référence non éditable | 1440 x 1100, RGB | `78497298fa76359524fdbb384ef7bffb3dae835939c2bcbaadafacce5040e2f7` | Fourni sous le nom `concet01.png` |
| `references/concepts/landing-alternative.png` | Exploration plus dense de type agence | Archive non canonique | 1448 x 1086, RGB | `c6f37af3934b8bb0ab92e13904b3d6c6be729e76c2cc6721e7f5d8500f2c3216` | Fourni sous le nom `monflorian-concept-utopie.png` |

## Frontières

- Le logo PNG est le master actuel. Une future vectorisation doit être validée visuellement contre ce fichier et faire l'objet d'une provenance propre.
- Les six fichiers du logo modulable sont des dérivés. Ils ne remplacent pas le master et peuvent être retirés sans modifier sa provenance.
- `prototype/index.html` est la source éditable de l'expérience. Sa capture principale n'est jamais modifiée pour simuler un changement du produit.
- Le prototype contient encore deux WebP embarqués en base64. Ils sont des dérivés propres au prototype, pas des masters concurrents.
- L'application active conserve le master comme source de référence et repli de l'atelier. L'en-tête charge séparément `/assets/monflorian-wordmark.png` et un portrait `/assets/florian-*.png`.
- Une visite utilise une seule variante de Florian. Le portrait original reste le repli sans JavaScript ou en cas d'échec de chargement.
- Les cinq portraits sont des PNG RGBA carrés de même taille. Leurs quatre coins et au moins 30 % de leur canevas sont totalement transparents. Les composants d'accueil ne leur ajoutent aucun fond.
- La capture alternative contient des promesses non prouvées, dont avis, paiement sécurisé et annulation. Elle ne doit pas guider la copie ni être publiée comme preuve.
- Les textes fonctionnels restent en HTML et ne sont pas extraits depuis les images.

## Droits et données

Les visuels ont été fournis par le propriétaire pour ce dépôt. Aucun fichier de licence ni preuve de droits distincte n'accompagne actuellement les sources. Toute diffusion hors de ce projet ou utilisation commerciale doit confirmer les droits, l'auteur et les éventuelles conditions du générateur d'origine.

Aucune photo personnelle réelle ne doit être ajoutée au dépôt. Les photos choisies dans le prototype restent en mémoire locale. Dans l'application candidate, le navigateur les réencode avant l'envoi ponctuel à OpenAI. Elles ne deviennent pas des artefacts versionnés. Le détail de ce flux vit dans [`DATA-PROCESSING.md`](DATA-PROCESSING.md).

Les projections créées par l'API sont des sorties temporaires reçues par le navigateur. Elles portent la mention "Projection personnalisée · image générée". Une future conservation, publication ou livraison de ces images exige une décision de stockage, une durée de rétention et un moyen d'effacement.

## Retrait

Pour retirer un visuel, supprimer son fichier, ses références dans `ASSETS.md`, `PROJECT.md` et `DESIGN.md`, puis vérifier tous ses consommateurs avec `./scripts/verify.sh` et un contrôle navigateur. Ne pas laisser de copie encodée ou de capture présentée comme source active.
