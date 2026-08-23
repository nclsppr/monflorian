# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Mon Florian doit devenir un objet continu : projection désirable avant le départ, guide pratique pendant le voyage et souvenir transmissible après le retour.

## Principes de séquencement

- Prouver un flux utile avant de choisir une architecture complète.
- Maintenir Florian dans la boucle pour les choix et les vérifications de voyage.
- Ne pas activer paiement, compte ou stockage de photos avant le contrat de données et la reclassification du risque.
- Distinguer le prototype, le service manuel validé et la production automatisée.
- Exiger une preuve observable pour terminer chaque phase.

## Vue d'ensemble

| Ordre | ID | Phase | Résultat utilisateur ou opérationnel | État macro | Critère de sortie | Preuve observée | Sortie le |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | F00 | Dépôt et prototype reproductible | Le concept est compris, versionné et consultable localement | in_progress | `verify`, Compose, mobile et bureau valides, puis SHA distant vert | Vide tant que non prouvé | |
| 1 | F01 | Brief de voyage utilisable | Une personne fournit une intention exploitable sans questionnaire long | planned | Test utilisateur, erreurs, accessibilité et copie honnête validés | | |
| 2 | F02 | Première livraison manuelle | Florian livre un mini-site privé et un PDF vérifiés sans automatisation prématurée | planned | Un voyage complet relu et livré dans un espace privé | | |
| 3 | F03 | Paiement et données personnelles | Un client peut payer et retrouver son voyage sans exposer ses données | planned | Reclassification, ADR, contrat de données, sécurité et rollback prouvés | | |
| 4 | F04 | Voyage vivant | Le guide s'adapte pendant le séjour et devient un carnet après le retour | planned | Parcours avant, pendant et après vérifié avec un utilisateur réel | | |

États autorisés : `planned`, `in_progress`, `blocked`, `done`, `cancelled`.

## Phase F00 : Dépôt et prototype reproductible

### Objectif

Transformer les fichiers conceptuels existants en un socle de produit explicite, exécutable et reprenable sans les présenter comme une production.

### Dépendances

- Project Foundation `v0.5.2`.
- Les concepts et le logo fournis le 2026-08-23.
- Docker Compose, Node, npm et Python aux versions documentées.

### Inclus

- Adoption du pack Produit et des profils web, expérience et artefacts générés.
- Inventaire de la marque et distinction entre logo, capture et prototype.
- Aperçu local statique avec santé Compose.
- Contrat produit, design, validation et CI.

### Exclu

- Refonte complète du prototype.
- Backend, IA, génération de PDF, paiement et authentification.
- Déploiement public ou modification de DNS.

### Risques

- Droits des visuels non documentés par une licence séparée.
- Promesses de la maquette supérieures aux capacités actuelles.
- Protection de branche et checks GitHub non obligatoires.

### Critère de sortie

- `./scripts/verify.sh` passe localement et sur GitHub Actions.
- Docker Compose atteint l'état sain, la page répond, puis le service s'arrête proprement.
- Le prototype est inspecté sur petit mobile et bureau avec clavier et mouvement réduit.
- Le SHA validé existe sur `origin/main`.

### Retour arrière ou abandon

Revenir par commit inverse au commit initial `585ebb93b844fe3bef7de15bbf342f508a208813`. Aucun service distant ni donnée persistante n'est concerné.

## Règle de mise à jour

- Mettre à jour l'état d'une phase uniquement avec sa preuve.
- Reporter les détails d'exécution dans `STATUS.md`.
- Créer une ADR si le séquencement change à cause d'une décision structurante.
- Ne pas créer une seconde roadmap.
