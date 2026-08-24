# ADR-0006, imposer des portraits de Florian transparents

## Statut

Acceptée le 2026-08-24.

## Contexte

La première version du logo modulable utilisait des variantes avec un fond bleu
pâle peint dans le fichier et un médaillon ajouté en CSS. Ce traitement masquait
les différences entre les rendus, mais empêchait de poser Florian proprement sur
les fonds du site et de la future application.

Le personnage doit rester un élément de marque réutilisable. Son environnement
visuel appartient au composant qui l'accueille, jamais au fichier du portrait.

## Décision

Tous les fichiers `assets/brand/florian-*.png` utilisent le même canevas carré,
le format PNG RGBA et un vrai canal alpha. Les pixels autour du personnage sont
transparents. Aucun portrait ne contient de fond peint, de médaillon, de halo,
de bordure ou d'ombre portée.

Les composants du site gardent eux aussi un fond transparent autour du portrait.
Ils utilisent `object-fit: contain` afin de montrer le personnage entier sans
rogner un chapeau, une coiffure ou un accessoire.

Le test des assets refuse un portrait qui ne respecte pas les propriétés
suivantes :

- PNG RGBA 8 bits non entrelacé ;
- canevas de 1254 x 1254 pixels ;
- quatre coins totalement transparents ;
- au moins 30 % du canevas avec un alpha égal à zéro.

Une nouvelle variante rejoint la rotation seulement après son ajout à
`ASSETS.md`, aux routes statiques, au test du serveur et à la liste locale du
navigateur.

## Conséquences

- Florian peut se poser sur n'importe quelle couleur du site ou de l'application.
- Les variantes gardent le même encombrement et ne déplacent pas le mot-symbole.
- Le navigateur charge un seul portrait choisi par visite et le réutilise partout.
- Le fond bleu pâle prévu par ADR-0005 n'appartient plus au système de logo.

## Vérification

- Exécuter `npm test`, puis `./scripts/verify.sh`.
- Contrôler les cinq PNG à leur taille d'origine.
- Recharger la page jusqu'à voir chaque variante sur bureau et mobile.
- Vérifier l'absence de fond peint, de rognage, de débordement et d'erreur console.

## Rollback

Retirer une variante défectueuse de la rotation et restaurer le dernier PNG RGBA
validé. Ne pas réintroduire de fond opaque ou de médaillon dans le fichier.

## Références

- [`DESIGN.md`](../../DESIGN.md)
- [`ASSETS.md`](../../ASSETS.md)
- [ADR-0005](adr-0005-logo-modulable.md)
- `app/public/app.js`
- `tests/brand-assets.test.mjs`
