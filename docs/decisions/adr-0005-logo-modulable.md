# ADR-0005, séparer le mot-symbole et les variantes de Florian

## Statut

Acceptée le 2026-08-24.

La règle du médaillon bleu pâle est remplacée par
[ADR-0006](adr-0006-portraits-florian-transparents.md).

## Contexte

Le master raster réunit le personnage, le nom et l'avion dans un seul fichier.
Ce lockup garantit la direction d'origine, mais oblige à modifier tout le logo
pour changer une coiffure ou un accessoire de Florian.

Le propriétaire souhaite que le personnage varie parfois, sans que le nom ni
le style de marque changent. Le produit doit aussi rester lisible sans
JavaScript et éviter une animation continue dans l'en-tête.

## Décision

Conserver `assets/brand/monflorian-logo.png` comme master provisoire et produire
deux familles de dérivés :

- `monflorian-wordmark.png` contient le nom et l'avion fixes ;
- `florian-*.png` contient le portrait original et les variantes approuvées.

Au chargement, le navigateur choisit une variante dans une liste locale. Tous
les portraits de la page utilisent ce même fichier. L'original apparaît dans
le HTML et reste affiché si JavaScript est absent ou si le chargement du choix
échoue. Aucun appel réseau externe, stockage ou profil utilisateur n'intervient.

Les variantes peuvent changer les cheveux, le couvre-chef et un petit
accessoire. Elles gardent le visage, les lunettes dorées, les yeux bruns, la
barbe, le sourire, le cadrage et le rendu 3D doux du master. Un médaillon bleu
pâle absorbe les différences de fond entre les rendus.

## Conséquences

- Le mot-symbole reste reconnaissable et indépendant du personnage.
- Une nouvelle variante demande seulement un fichier local, son inventaire et
  son contrôle visuel.
- Le choix varie à chaque chargement, mais reste stable pendant la visite.
- Les dérivés générés ne deviennent pas des masters concurrents.
- Une future vectorisation du mot-symbole reste une décision séparée.

## Vérification

- Vérifier les dimensions, les formats, les empreintes et la provenance dans
  `ASSETS.md`.
- Servir chaque dérivé avec le backend et tester ses routes statiques.
- Contrôler l'en-tête et la note de Florian sur petit mobile et bureau.
- Recharger plusieurs fois pour observer les variantes sans déplacement de la
  mise en page, erreur de console ou requête externe.
- Vérifier le repli original avec JavaScript désactivé et le mouvement réduit.

## Rollback

Restaurer le lockup unique dans l'en-tête et le pied de page, puis retirer les
dérivés et leurs routes. Le master ne change pas pendant cette opération.

## Références

- [`DESIGN.md`](../../DESIGN.md)
- [`ASSETS.md`](../../ASSETS.md)
- `app/public/index.html`
