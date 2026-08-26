# Changelog

Git reste la source du diff technique. Les ADR expliquent les décisions importantes.

## Non publié

- Déploiement public du réalignement visuel et du correctif mobile V2 au SHA
  `567f27b`, avec contrôle des trois étapes sur le domaine actif.
- Réalignement visuel de `/v2` sur l'accueil historique : pile système, halos
  cyan et citron, surfaces, rayons, présence de Florian et note manuscrite.
  Outfit reste réservée aux titres blancs posés sur les photos.
- Correction du questionnaire V2 sur mobile : libellé facultatif stable,
  contrôles numériques sans steppers natifs, étapes plus compactes et actions
  empilées sans débordement à la troisième étape.
- Déploiement public de la V2 au SHA `6672048` et contrôle de `/v2`, du carnet
  Japon, des six médias, des redirections canoniques et des garde-fous fermés.
- Création de `/v2` comme parcours autonome React 19 et Astryx : accueil,
  questionnaire en trois étapes, génération déterministe et carnet de dix jours
  au Japon, sans appel au backend fermé.
- Ajout de trois scènes Fuji du couple fictif à Tokyo, Hakone et Kyoto, avec le
  nom du lieu centré en Outfit, ainsi que trois couvertures pour le Portugal, la
  Sicile et la Norvège.
- Ajout des recherches Booking.com par ville, de l'itinéraire jour par jour, des
  listes pratiques et du partage public ou privé. Le lien privé transporte une
  preuve SHA-256 et vérifie le mot de passe dans le navigateur.
- Adoption isolée d'Astryx `0.5.0`, du thème Matcha adapté à Mon Florian, de la
  fonte Outfit auto-hébergée et de la transition de confirmation
  Transitions.dev, sans migrer l'accueil historique.
- Routage canonique de `/v2` par le mode Cloudflare
  `drop-trailing-slash`, redirection de `/v2/` et `/v2/index.html`, en-tête
  `noindex` sur toute la surface V2 et maintien hors sitemap.
- Promotion des cinq portraits Florian V2 sur l'accueil, les replis, les icônes
  et la carte sociale.
- Rotation de dix notes manuscrites sans répétition immédiate dans le même
  onglet, avec une largeur stable et la teinte crayon sauge `#85897a`.
- Alignement du grand logo et de toute l'introduction sur les gouttières du
  contenu, avec une largeur maximale commune de `1240 px`.
- Passage de la note « Alors, on part où ? » en Kalam auto-hébergée et gris
  graphite, avec un papier et une empreinte resserrés sur mobile.
- Ajout du paramètre facultatif `?avatar=` pour comparer la même variante dans
  les deux familles et conserver la rotation aléatoire en son absence.
- Remplacement de l'accroche par la note « Alors, on part où ? », en bleu
  électrique sur trois traits blancs irréguliers et translucides, sans animation.
- Passage du lockup complet d'introduction à toute la largeur disponible,
  ajout d'une respiration verticale avant le hero sur grand écran et nouvelles
  sources WebP haute définition dédiées à cette surface.
- Agrandissement du lockup d'introduction sur les écrans larges et mobiles,
  sans agrandir le logo par transformation pendant le défilement.
- Correction de la régression de fluidité sur iPhone : suppression du calcul
  JavaScript continu pendant le défilement, parallaxe désactivé sur les
  appareils tactiles et apparition ponctuelle du logo compact.
- Correction du logo flou sous Chrome Windows : le grand lockup utilise le
  mot-symbole PNG haute définition à sa taille de rendu, sans agrandissement
  d'une petite couche rasterisée.
- Mise en scène du logo au premier écran, puis apparition du lockup compact dans
  l'en-tête après l'introduction.
- Ajout d'une profondeur légère sur l'aperçu du voyage dans le téléphone pour
  les pointeurs précis et les navigateurs compatibles, sans déplacer le texte
  ni ajouter de dépendance d'animation.
- Remplacement du vocabulaire « demandes fermées » par un état de préparation
  factuel, et de l'accroche générique par « Ton voyage, à ton rythme ».
- Suppression de la surbrillance rectangulaire native de Safari iOS sur les
  libellés tactiles et les questions de la FAQ, sans retirer le focus clavier.
- Ouverture de l'indexation de la seule page d'accueil avec titre, description,
  canonical, métadonnées sociales, nom de site structuré, `robots.txt` et
  sitemap limité à l'URL publique canonique. Les pages privées et les API
  restent explicitement exclues des moteurs.
- Réécriture de l'accueil autour de l'itinéraire personnalisé, de la page
  privée, des limites de réservation et d'une FAQ visible, sans avis, prix,
  disponibilité ou autre preuve non sourcée.
- Présentation du code d'accès avant le brief, alignement stable des champs et
  du bouton, erreurs de dates reliées aux contrôles et validation locale de la
  limite de 14 jours.
- Ajout d'une carte sociale 1200 x 630 composée depuis les assets de marque
  canoniques, sans reprendre les promesses non livrées des captures de concept.
- Ajout de portraits, mot-symbole et icônes Web redimensionnés pour alléger le
  premier affichage sans modifier les masters de marque.
- Redirection permanente de `www` vers l'apex et exclusion des surfaces
  `workers.dev`, API, pages privées et médias privés de l'indexation. Les
  redirections privées et techniques restent en `no-store`.
- Passage de toutes les requêtes statiques par le Worker afin d'appliquer la
  canonisation HTTPS et les directives d'indexation sur chaque hôte public.
- Protection des extraits contre les statuts dynamiques fermés, canonisation de
  `/index.html` et métadonnées génériques sur les liens de voyage privés.
- Routage explicite des deux documents HTML publics pour éviter les variantes
  et boucles liées au traitement automatique des suffixes par Static Assets.
- Publication d'une page de confidentialité qui nomme les données, Cloudflare,
  OpenAI, les durées maximales et la suppression depuis le lien privé, sans
  masquer l'absence actuelle de canal de droits complémentaire.
- Ajout du parcours asynchrone unique : demande, photos facultatives, page
  privée à jeton, états d'attente, d'échec et de suppression, sans stocker une
  page HTML par voyage.
- Chiffrement AES-GCM du brief et du courriel dans D1, jetons privés hachés,
  idempotence des créations et purge planifiée des données expirées.
- Activation d'un bucket R2 privé en juridiction UE, sans `r2.dev` ni domaine
  personnalisé, avec expiration de secours des sources à 24 heures et des
  images générées à 30 jours.
- Ajout du binding R2, de la seconde migration D1 et des secrets de fondation.
  La création, OpenAI et le courriel restent fermés.
- Les secrets du code d'accès et de Turnstile restent facultatifs tant que la
  création est fermée ; leur absence ne bloque plus un déploiement sûr.
- Création du widget Turnstile géré `monflorian-production` pour l'apex, `www`
  et `workers.dev`, avec secret installé directement dans le Worker.
- Activation de Cloudflare Email Service pour `monflorian.com` et ajout du
  binding `EMAIL`, restreint à `voyage@monflorian.com`, sans secret tiers.
- Envoi du seul lien privé après génération, sans photo ni brief, avec effacement
  de l'adresse chiffrée après succès et aucun retry automatique.
- Ajout des quotas D1 atomiques, globaux et par client pseudonymisé, avec
  rollback complet quand une limite est atteinte et purge après 31 jours.
- Portage des adaptateurs Responses et Image Edits dans le Workflow, sans retry
  automatique des appels payants et sans contenu privé dans le résultat des
  étapes techniques.
- Stockage de la projection WebP dans R2, suppression des portraits sources et
  lecture de l'image uniquement depuis le jeton privé du voyage.
- Suppression du padding natif des champs de date qui faisait dépasser leur
  largeur sur WebKit iOS, avec renouvellement de l'URL de la feuille CSS.
- Activation publique vérifiée de `monflorian.com` et `www.monflorian.com` sur
  le même Worker, avec DNS, TLS, santé et version contrôlés. La zone reste sans
  boîte de réception humaine.
- Rattachement versionné de `monflorian.com` et `www.monflorian.com` au Worker
  comme Custom Domains Cloudflare, avec maintien de `workers.dev` comme surface
  de diagnostic.
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
