# ASSETS.md

Source canonique des visuels de marque et des références importées le 2026-08-23.

## Inventaire

| Fichier | Rôle | Statut | Dimensions | SHA-256 à l'import | Provenance |
| --- | --- | --- | --- | --- | --- |
| `assets/brand/monflorian-logo.png` | Lockup principal avec Florian, nom et avion | Master raster provisoire | 2172 x 724, RGBA | `40b062b5c99b4adacfba105fda1801d9e743c25953d94be119e4fec1e48dd161` | Fourni par le propriétaire du dépôt sous le nom `monflorian-logo.png` |
| `references/concepts/landing-primary.png` | Capture de la direction retenue | Référence non éditable | 1440 x 1100, RGB | `78497298fa76359524fdbb384ef7bffb3dae835939c2bcbaadafacce5040e2f7` | Fourni sous le nom `concet01.png` |
| `references/concepts/landing-alternative.png` | Exploration plus dense de type agence | Archive non canonique | 1448 x 1086, RGB | `c6f37af3934b8bb0ab92e13904b3d6c6be729e76c2cc6721e7f5d8500f2c3216` | Fourni sous le nom `monflorian-concept-utopie.png` |

## Frontières

- Le logo PNG est le master actuel. Une future vectorisation doit être validée visuellement contre ce fichier et faire l'objet d'une provenance propre.
- `prototype/index.html` est la source éditable de l'expérience. Sa capture principale n'est jamais modifiée pour simuler un changement du produit.
- Le prototype contient encore deux WebP embarqués en base64. Ils sont des dérivés propres au prototype, pas des masters concurrents.
- L'application active charge le master depuis `/assets/monflorian-logo.png`. Ce chemin ne crée pas un second master.
- La capture alternative contient des promesses non prouvées, dont avis, paiement sécurisé et annulation. Elle ne doit pas guider la copie ni être publiée comme preuve.
- Les textes fonctionnels restent en HTML et ne sont pas extraits depuis les images.

## Droits et données

Les trois fichiers ont été fournis par le propriétaire pour ce dépôt. Aucun fichier de licence ni preuve de droits distincte n'accompagne actuellement les sources. Toute diffusion hors de ce projet ou utilisation commerciale doit confirmer les droits, l'auteur et les éventuelles conditions du générateur d'origine.

Aucune photo personnelle réelle ne doit être ajoutée au dépôt. Les photos choisies dans le prototype restent en mémoire locale. Dans l'application candidate, le navigateur les réencode avant l'envoi ponctuel à OpenAI. Elles ne deviennent pas des artefacts versionnés. Le détail de ce flux vit dans [`DATA-PROCESSING.md`](DATA-PROCESSING.md).

Les projections créées par l'API sont des sorties temporaires reçues par le navigateur. Elles portent la mention "Projection personnalisée · image générée". Une future conservation, publication ou livraison de ces images exige une décision de stockage, une durée de rétention et un moyen d'effacement.

## Retrait

Pour retirer un visuel, supprimer son fichier, ses références dans `ASSETS.md`, `PROJECT.md` et `DESIGN.md`, puis vérifier tous ses consommateurs avec `./scripts/verify.sh` et un contrôle navigateur. Ne pas laisser de copie encodée ou de capture présentée comme source active.
