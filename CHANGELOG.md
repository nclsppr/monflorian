# Changelog

Git reste la source du diff technique. Les ADR expliquent les décisions importantes.

## 2026-08-23, configuration des skills d'ingénierie

- Déclaration de GitHub Issues, des labels de triage par défaut et du contexte de domaine unique consommés par les skills d'ingénierie.
- Lecture structurée des tickets et limites explicites pour éviter les files de triage tronquées.

## 2026-08-23, candidat F01

- Reclassification de Produit à Critique avec les profils backend, infrastructure et changement de dépendance de Project Foundation `v0.5.2`.
- Ajout d'un backend Node.js sans base de données pour composer les itinéraires via l'API Responses avec `store: false`.
- Ajout d'une génération de projections dessinées via l'API Image Edits, limitée aux photos réencodées et envoyées avec consentement.
- Séparation stricte entre le contenu envoyé à OpenAI et les recherches Booking.com construites côté serveur.
- Ajout des modes d'hébergement `off`, `external` et `cj-static`. Le mode affilié n'accepte que des liens approuvés et configurés sur une liste de domaines autorisés.
- Ajout du contrat OpenAPI, du contrat de traitement, du modèle de menace, du runbook Atlas et de la preuve de livraison.
- Ajout d'un contrat de publication OCI avec image non privilégiée, provenance, scan, bundle d'intégration et signal de release Atlas immuables.
- Validation locale de F01 : 25 tests applicatifs, 13 tests de contrat Atlas, Compose sain, documentation Nimbus et contrôle responsive sur bureau et mobile.
- Publication des trois artefacts OCI du candidat `a7c5d1c`, avec CI, scan et attestations verts.
- Admission Atlas dormante fusionnée et convergée sans secret ni conteneur Mon Florian.
- Bascule des deux A web OVHcloud vers Atlas, sans toucher aux enregistrements de messagerie. La route reste désactivée.
- Protection de `main` avec PR obligatoire, historique linéaire, conversations résolues et contrôles `verify` et `Validate application release` avant fusion. La publication immuable reste exécutée après fusion.
- Maintien du service fermé tant que la nouvelle clé OpenAI, l'accès privé et les preuves fournisseur manquent.
- Import du logo et des concepts avec une source canonique et une provenance explicites.
- Isolation du concept interactif dans un prototype local sans paiement, stockage ou appel réseau.
- Ajout d'un aperçu Docker Compose, de contrôles statiques et de la CI.
- Formalisation de la promesse avant, pendant et après le voyage, ainsi que de ses limites actuelles.
- Validation locale et distante de la phase F00 sur le commit `e8f5d97`.
