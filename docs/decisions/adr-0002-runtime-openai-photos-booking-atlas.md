# ADR-0002 : runtime OpenAI, photos, Booking.com et Atlas

- Statut : remplacé
- Statut d'implémentation : candidat en cours de vérification
- Date : 2026-08-23
- Dernière vérification : 2026-08-23
- Propriétaire : `nclsppr`
- Domaine : architecture, données et production
- Remplace : la frontière de prototype définie par l'ADR-0001
- Remplacé par : ADR-0007 pour le runtime et la production Cloudflare

## Contexte

L'ADR-0001 gardait le HTML sous `prototype/` et interdisait backend, IA, stockage et production tant que le risque n'était pas reclassifié. La demande courante ajoute deux traitements OpenAI, des photos personnelles, des liens Booking.com et une cible de production Atlas. Le projet passe donc du pack Produit au pack Critique.

Le domaine `monflorian.com` a été enregistré chez OVHcloud le 2026-08-23. Ses enregistrements web pointent encore vers le parking OVH. Aucun partenariat Booking.com accepté n'a été observé. La route Atlas, les secrets et le changement DNS limitent l'activation, pas la construction du candidat.

Ce paragraphe conserve l'état observé au moment de la décision. `STATUS.md` porte l'état opérationnel courant, dont le changement DNS réalisé plus tard le même jour.

## Problème à décider

Comment produire une première version déployable sans stocker les données du voyage, sans confier les liens commerciaux au modèle et sans présenter une intégration externe non acceptée comme active ?

## Critères

- Utiliser l'API OpenAI demandée avec des contrats et limites vérifiables.
- Empêcher le modèle de créer des liens, prix, disponibilités ou preuves de réservation.
- Ne pas persister les briefs, photos, itinéraires ou illustrations dans l'application.
- Produire des illustrations clairement dessinées et signalées comme projections.
- Garder la génération payante derrière une protection privée et des quotas.
- Publier un artefact immuable consommé par le contrôle central Atlas.
- Permettre le retrait de chaque fournisseur sans réécrire l'application.

## Options considérées

### Garder le prototype statique

Cette option évite le risque fournisseur mais ne produit aucun itinéraire ni image. Elle ne répond pas à la demande.

### Ajouter un framework, un SDK et une base de données

Une stack complète pourrait accélérer un futur compte client. Elle ajouterait aujourd'hui des packages, une persistance, des migrations et une surface d'attaque sans besoin prouvé. Cette option est refusée pour la tranche actuelle.

### Utiliser Node.js natif et des frontières HTTP explicites

Le serveur utilise `node:http`, `fetch`, `FormData` et les API Web présentes dans Node 24. Les validateurs, l'accès, les quotas et les adaptateurs fournisseurs restent dans trois modules. Aucun package npm tiers n'est nécessaire au runtime. Cette option est retenue.

## Décision

### Itinéraires

Le backend appelle l'[API Responses](https://developers.openai.com/api/docs/guides/structured-outputs) avec le modèle `gpt-5.4-mini-2026-03-17` par défaut. Il transmet le brief, les dates, le nombre de voyageurs, le rythme et un `safety_identifier` dérivé par HMAC de l'adresse cliente. Il envoie `store: false` et impose un schéma JSON strict.

Le backend revalide chaque sortie. Les durées de trajet restent des estimations à vérifier. Le prompt interdit prix, disponibilité, réservation, lien et fausse vérification en direct.

### Illustrations

Le backend appelle l'[API Image Edits](https://developers.openai.com/api/docs/guides/image-generation) avec `gpt-image-2` par défaut. Le navigateur réencode une à quatre photos. Le serveur accepte seulement PNG et WebP dans des limites de poids et de dimensions, puis rejette les blocs de métadonnées connus.

Le prompt impose un dessin éditorial en gouache et crayon. Le résultat porte la mention "Projection personnalisée · image générée". L'application ne le présente pas comme une photographie du séjour.

L'utilisateur doit confirmer les droits sur les fichiers et l'accord des personnes représentées. Ce contrôle n'établit pas à lui seul un consentement légal pour un mineur ou une personne incapable de consentir. Un test réel doit respecter `DATA-PROCESSING.md`.

### Données OpenAI

`store: false` évite le stockage de la réponse comme état applicatif OpenAI. D'après la [documentation OpenAI sur les contrôles de données](https://developers.openai.com/api/docs/guides/your-data), ce réglage ne désactive pas les journaux de surveillance des abus, qui peuvent conserver du contenu jusqu'à 30 jours selon le service et les contrôles du compte. Les entrées et sorties de l'API ne servent pas à entraîner les modèles par défaut, sauf choix explicite du titulaire du compte.

Mon Florian n'enregistre aucun contenu envoyé ou reçu. Cette absence de persistance ne permet pas de promettre une suppression immédiate chez le fournisseur. L'ouverture publique attend une notice de confidentialité et la vérification des conditions du compte OpenAI réellement utilisé.

### Hébergements

OpenAI reçoit seulement les besoins de voyage. Le backend construit les liens d'hébergement après validation de la sortie. Aucun contenu, lien, prix ou inventaire Booking.com n'entre dans le prompt.

Trois modes sont admis :

- `off` ne renvoie aucun lien ;
- `external` construit une recherche ordinaire vers Booking.com, sans commission annoncée ;
- `cj-static` utilise uniquement des liens déjà approuvés, configurés par destination et limités à des domaines autorisés.

Le mode affilié affiche : "Liens affiliés Booking.com. Mon Florian peut percevoir une commission si tu réserves via ces liens." Le frontend ajoute `rel="sponsored noopener noreferrer"` aux liens concernés.

L'[accès aux API CJ](https://developers.cj.com/docs/rest-apis/link-search) demande une relation acceptée, un identifiant éditeur et un jeton. L'[API Demand Booking.com](https://developers.booking.com/demand/docs/getting-started/prerequisites) demande un statut de partenaire géré et une approbation de production. Aucune de ces conditions n'est présentée comme acquise. Le scraping et l'API Demand restent hors périmètre.

### Runtime et production

Le serveur écoute dans une image Node officielle épinglée par version et digest. Il s'exécute avec l'UID et le GID `10001`, sans base de données ni volume utilisateur. Le secret OpenAI arrive par fichier monté hors Git. Les logs structurés excluent le contenu des requêtes et des réponses.

La release cible est `ghcr.io/nclsppr/monflorian/backend` par digest. Le dépôt `vps-infra` contrôle l'admission et le déploiement sur Atlas. Le service n'expose aucun port hôte public. Caddy rejoint son réseau applicatif et protège le lancement avant de router le trafic.

Le DNS vient après une release privée saine. Le runbook arrête la procédure tant que la route Atlas, ses secrets et une session OVHcloud autorisée ne sont pas observés. Les enregistrements de messagerie existants restent hors du diff web.

## Conséquences

### Bénéfices

- Le projet possède un backend testable sans dépendance npm d'exécution.
- OpenAI ne peut pas injecter un lien Booking.com dans la réponse publiée.
- L'absence de base réduit la rétention et simplifie le rollback.
- Les deux générations et les liens d'hébergement peuvent être coupés séparément.

### Coûts et limites

- Une coupure OpenAI rend la composition indisponible.
- Les quotas en mémoire se réinitialisent au redémarrage et ne se coordonnent pas entre plusieurs instances. Le lancement reste donc mono-instance.
- Un code de lancement n'est pas un compte utilisateur. Il peut être partagé ou volé.
- Le réencodage et le rejet de métadonnées réduisent le risque mais ne prouvent pas l'identité, les droits ou le consentement.
- L'absence de persistance empêche de reprendre un voyage après rechargement.
- Les conditions et tarifs des fournisseurs peuvent changer. Leur réexamen précède toute ouverture publique.

## Sécurité et arrêt sûr

- `MONFLORIAN_GENERATION_ENABLED=false` coupe les appels de texte.
- `MONFLORIAN_ILLUSTRATION_ENABLED=false` coupe les appels d'image.
- `BOOKING_MODE=off` retire les liens d'hébergement.
- Le mode privé exige un code côté backend. Atlas ajoute une protection en amont.
- Aucun retry automatique ne multiplie un appel payant après un timeout.
- Les réponses fournisseur invalides échouent sans publier de contenu partiel.

## Vérification

- Valider `docs/api/openapi.json` et les schémas d'entrée et sortie.
- Exécuter les tests unitaires et les fakes de frontière sans secret.
- Construire l'image et vérifier l'utilisateur non privilégié.
- Appeler les deux API avec un brief et une image synthétiques, puis inspecter les logs.
- Contrôler l'interface en mobile et bureau, au clavier, avec zoom et mouvement réduit.
- Déployer le digest en accès privé, sonder la santé et exécuter un parcours synthétique.
- Vérifier le rollback avant toute route publique.

Les résultats vivent dans `DELIVERY-EVIDENCE.md`. Cette ADR ne transforme pas une cible en preuve.

## Rollback et retrait

Un commit inverse peut restaurer F00. En production, Atlas redéploie le digest précédent. Le retrait complet supprime le profil de service et les routes Caddy, révoque la clé OpenAI du runtime, retire les liens CJ, puis confirme qu'aucun volume utilisateur n'existe.

## Réexamen

Réexaminer cette décision avant toute base de données, compte, paiement, API Demand Booking.com, seconde instance, conservation d'image, ouverture publique, changement de modèle ou au plus tard le 2026-09-23.

## Références locales

- [`PROJECT.md`](../../PROJECT.md)
- [`DATA-PROCESSING.md`](../../DATA-PROCESSING.md)
- [`THREAT-MODEL.md`](../../THREAT-MODEL.md)
- [`RUNBOOK.md`](../../RUNBOOK.md)
- Contrat OpenAPI canonique : `docs/api/openapi.json`
