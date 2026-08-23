# ADR-0001 : cadre produit et frontière du prototype

- Statut : accepté
- Statut d'implémentation : livré
- Date : 2026-08-23
- Dernière vérification : 2026-08-23
- Propriétaire : `nclsppr`
- Domaine : produit et architecture
- Remplace : aucune
- Remplacé par : aucune

## Contexte

Le dépôt distant contient seulement un README. Le dossier local apporte un logo, deux captures et un prototype autonome. La cible est un produit grand public qui accompagne un voyage avant, pendant et après le séjour, mais aucune capacité de paiement, génération, stockage ou production n'existe encore.

## Problème à décider

Comment versionner et faire progresser la direction existante sans confondre le prototype avec le service cible ?

## Critères

- Conserver l'identité et les apprentissages déjà produits.
- Fournir un prototype exécutable avec le minimum de dépendances.
- Dire explicitement quelles promesses ne sont pas livrées.
- Garder la prochaine architecture ouverte jusqu'à une preuve utilisateur.
- Isoler toute donnée personnelle, tout paiement et toute production.

## Options considérées

### Option A : promouvoir immédiatement le HTML en produit

Cette option est rapide mais transformerait des aperçus, une fausse action de paiement et des exemples synthétiques en capacités apparemment réelles. Elle est refusée.

### Option B : conserver un produit durable avec une expérience isolée

Le dépôt adopte le pack Produit. Le HTML reste sous `prototype/`, servi localement, sans donnée persistante. Le contrat produit et les conditions de promotion sont versionnés. Cette option est retenue.

### Option minimale ou statu quo

Conserver seulement le README et les quatre fichiers évite toute infrastructure, mais ne fournit ni source de vérité, ni exécution reproductible, ni frontière entre concept et capacité. Cette option ne suffit pas.

## Décision

Adopter Project Foundation `v0.5.2` en classe Produit avec les profils web, expérience et artefacts générés. Le prototype statique devient l'expérience exécutable actuelle. Le produit cible conserve l'offre Voyage prêt puis Voyage vivant et la continuité avant, pendant, après.

Le choix d'une stack applicative, d'une IA, d'un fournisseur de paiement, d'un hébergement et d'un stockage reste ouvert. Aucune activation externe n'est autorisée par cette décision.

## Conséquences

### Positives

- Le dépôt distingue clairement l'intention, l'expérience et l'état livré.
- Le prototype reste simple, local et supprimable.
- Le logo et les captures possèdent une source et un rôle explicites.

### Négatives

- Le pack Foundation ajoute une documentation et une CI importantes dès le départ.
- Le prototype conserve temporairement des images encodées dans le HTML.

### Risques

- Une personne peut encore prendre la copie cible pour une capacité active si l'étiquette de prototype disparaît.
- La branche GitHub n'imposait pas encore les checks. Ce risque est levé depuis le 2026-08-23 par une protection qui exige une PR, un historique linéaire, `verify` et la validation de la release applicative.
- Les droits des visuels ne possèdent pas de preuve séparée.

## Mise en oeuvre

1. Vendoriser le socle et remplir les contrats sans marqueur.
2. Ranger le logo, les captures et le prototype selon `ASSETS.md`.
3. Servir uniquement le prototype avec une image NGINX officielle épinglée.
4. Ajouter les gates statiques, runtime, documentaires et visuelles.
5. Pousser le SHA validé puis observer la CI.

## Vérification

- Commandes : `./scripts/verify.sh` et contrôles navigateur.
- Environnements : macOS arm64, Docker Compose, petit mobile et bureau.
- Résultat attendu : prototype sain, aucune transmission réseau de photo, copie honnête et CI verte.
- Preuve observée : commit `e8f5d97667b47b5e74ffc34eff7b3511064a9c4d`, contrôles navigateur consignés dans `STATUS.md` et run GitHub Actions `32637460676` vert.
- Limites de la preuve : aucune production ni commande réelle n'est couverte.

## Rollback

Un commit inverse peut revenir au commit initial `585ebb93b844fe3bef7de15bbf342f508a208813`. Le service Compose et le dossier `prototype/` ne possèdent aucune donnée persistante.

## Réexamen

Réexaminer cette décision avant toute publication, activation de paiement, authentification, persistance de photos, nouvelle stack applicative ou au plus tard le 2026-09-23.

## Références

- [`PROJECT.md`](../../PROJECT.md)
- [`DESIGN.md`](../../DESIGN.md)
- [`ASSETS.md`](../../ASSETS.md)
- [`ROADMAP.md`](../../ROADMAP.md)
