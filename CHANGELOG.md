# Changelog

Git reste la source du diff technique. Les ADR expliquent les décisions importantes.

## Non publié

- Suppression du double rendu de Florian au rechargement : le portrait choisi
  est chargé avant d'être révélé et le portrait original reste le repli sans
  JavaScript ou en cas d'échec.
- Empilement des sélecteurs de date sur petit écran et bornage explicite des
  champs et boutons pour éviter le débordement des contrôles natifs sur iPhone.
- Migration du runtime vers un Worker TypeScript unique avec Static Assets,
  healthcheck, configuration publique et version Cloudflare. La génération reste
  fermée pendant la migration.
- Création de la base D1 en juridiction UE, application du schéma de cycle de vie
  des voyages et déploiement du Workflow fermé `monflorian-trip`.
- Retrait des workflows OCI, des contrats VPS, des scripts Atlas et de l'ancien
  serveur HTTP du chemin de livraison. Docker Compose sert désormais uniquement
  le Worker local.
- Ajout de l'ADR-0007 pour R2 privé, pages à jeton, rétention, courriel,
  Turnstile, OpenAI asynchrone et futur Checkout Stripe.
- Séparation du logo en un mot-symbole fixe et un portrait modulable. Une visite
  choisit parmi le Florian original, cheveux au vent, avec bonnet, avec bob ou
  avec chapeau fleuri, puis garde ce choix sur toute la page. Tous les portraits
  utilisent désormais un fond réellement transparent et le contrôle automatisé
  rejette un fichier opaque.
- Mise en ligne de l'aperçu public sur `monflorian.com` avec TLS, redirection
  `www`, backend non privilégié et absence de port hôte. Les deux générations
  restent désactivées et aucune demande n'est envoyée.
- Préparation d'un aperçu public sur Atlas qui sert l'interface réelle, désactive
  les deux générations OpenAI et annonce cette indisponibilité dans le produit.
- Ajout d'une règle d'intervention qui impose la mise à jour du registre des
  secrets Atlas dans `nclsppr/vps-infra` avant de terminer toute tâche qui
  prévoit ou exige le déploiement, la rotation ou la révocation d'un secret.

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
