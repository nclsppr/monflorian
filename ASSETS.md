# ASSETS.md

Source canonique des visuels de marque et des références importées le 2026-08-23.

## Inventaire

| Fichier | Rôle | Statut | Dimensions | SHA-256 à l'import | Provenance |
| --- | --- | --- | --- | --- | --- |
| `assets/brand/monflorian-logo.png` | Lockup principal avec Florian, nom et avion | Master raster provisoire | 2172 x 724, RGBA | `40b062b5c99b4adacfba105fda1801d9e743c25953d94be119e4fec1e48dd161` | Fourni par le propriétaire du dépôt sous le nom `monflorian-logo.png` |
| `assets/brand/monflorian-wordmark.png` | Nom et avion fixes du logo modulable | Dérivé de production | 676 x 362, RGBA | `2a61387ff733238b31786bb9d242d7d0578c9a8ad9ba8cf9a973409af5181dcd` | Recadré et réduit depuis le master, sans retouche du dessin |
| `assets/brand/florian-original.png` | Portrait de repli du logo modulable | Dérivé de production | 780 x 724, RGBA | `361dfc5a65e545fe2a11a5c1f9a391a6a65c42ff17ac92556e291d256737b5c6` | Recadré depuis le master, sans retouche du personnage |
| `assets/brand/florian-wind.png` | Variante cheveux au vent | Dérivé généré | 512 x 512, RGB | `0696f371b1cca2b472f8ffcd978a976b1342d955f94deb87375f613614639226` | Édition ImageGen du portrait de repli, fond de médaillon bleu pâle |
| `assets/brand/florian-beanie.png` | Variante avec bonnet | Dérivé généré | 512 x 512, RGB | `bacb544eaec857a3570fcee5142eac6c23ba9d46a0389df5196ebbfe2337f4e8` | Édition ImageGen du portrait de repli, fond de médaillon bleu pâle |
| `assets/brand/florian-summer.png` | Variante avec bob et lunettes de soleil | Dérivé généré | 512 x 512, RGB | `2cc690975e68033fbc6c20caba3e1d4ac2b1962ba772c951551918639130d1a8` | Édition ImageGen du portrait de repli, fond de médaillon bleu pâle |
| `references/concepts/landing-primary.png` | Capture de la direction retenue | Référence non éditable | 1440 x 1100, RGB | `78497298fa76359524fdbb384ef7bffb3dae835939c2bcbaadafacce5040e2f7` | Fourni sous le nom `concet01.png` |
| `references/concepts/landing-alternative.png` | Exploration plus dense de type agence | Archive non canonique | 1448 x 1086, RGB | `c6f37af3934b8bb0ab92e13904b3d6c6be729e76c2cc6721e7f5d8500f2c3216` | Fourni sous le nom `monflorian-concept-utopie.png` |

## Frontières

- Le logo PNG est le master actuel. Une future vectorisation doit être validée visuellement contre ce fichier et faire l'objet d'une provenance propre.
- Les cinq fichiers du logo modulable sont des dérivés. Ils ne remplacent pas le master et peuvent être retirés sans modifier sa provenance.
- `prototype/index.html` est la source éditable de l'expérience. Sa capture principale n'est jamais modifiée pour simuler un changement du produit.
- Le prototype contient encore deux WebP embarqués en base64. Ils sont des dérivés propres au prototype, pas des masters concurrents.
- L'application active conserve le master comme source de référence et repli de l'atelier. L'en-tête charge séparément `/assets/monflorian-wordmark.png` et un portrait `/assets/florian-*.png`.
- Une visite utilise une seule variante de Florian. Le portrait original reste le repli sans JavaScript ou en cas d'échec de chargement.
- La capture alternative contient des promesses non prouvées, dont avis, paiement sécurisé et annulation. Elle ne doit pas guider la copie ni être publiée comme preuve.
- Les textes fonctionnels restent en HTML et ne sont pas extraits depuis les images.

## Droits et données

Les trois fichiers ont été fournis par le propriétaire pour ce dépôt. Aucun fichier de licence ni preuve de droits distincte n'accompagne actuellement les sources. Toute diffusion hors de ce projet ou utilisation commerciale doit confirmer les droits, l'auteur et les éventuelles conditions du générateur d'origine.

Aucune photo personnelle réelle ne doit être ajoutée au dépôt. Les photos choisies dans le prototype restent en mémoire locale. Dans l'application candidate, le navigateur les réencode avant l'envoi ponctuel à OpenAI. Elles ne deviennent pas des artefacts versionnés. Le détail de ce flux vit dans [`DATA-PROCESSING.md`](DATA-PROCESSING.md).

Les projections créées par l'API sont des sorties temporaires reçues par le navigateur. Elles portent la mention "Projection personnalisée · image générée". Une future conservation, publication ou livraison de ces images exige une décision de stockage, une durée de rétention et un moyen d'effacement.

## Retrait

Pour retirer un visuel, supprimer son fichier, ses références dans `ASSETS.md`, `PROJECT.md` et `DESIGN.md`, puis vérifier tous ses consommateurs avec `./scripts/verify.sh` et un contrôle navigateur. Ne pas laisser de copie encodée ou de capture présentée comme source active.
