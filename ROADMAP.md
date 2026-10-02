# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Mon Florian prépare un voyage, montre les voyageurs dans les destinations sous
forme d'images éditoriales cohérentes, conserve une page privée et peut en envoyer le lien par
courriel. La bêta est gratuite. Le paiement viendra après la bêta, avec un prix
à définir. Booking affilié et Stripe restent hors de la tranche courante.

## Principes de séquencement

- Un seul runtime et un seul déploiement Cloudflare.
- Aucune photo réelle avant R2 privé, rétention et suppression prouvées.
- Aucun appel payant avant quotas persistants, Turnstile et budget.
- Aucun retry aveugle d'une étape OpenAI au résultat incertain.
- Aucun déplacement DNS avant preuve sur `workers.dev` et décision explicite sur
  les services non web de la zone.
- Aucun paiement avant la preuve du parcours gratuit.
- Une ressource provisionnée ne vaut pas capacité livrée.

## Vue d'ensemble

| Ordre | ID | Phase | État | Critère de sortie |
| --- | --- | --- | --- | --- |
| 0 | F00 | Prototype reproductible | done | concept local, Compose et CI |
| 1 | F01 | Contrats métier et OpenAI simulé | done | validateurs, OpenAPI et fakes fournisseur |
| 2 | F02 | Aperçu historique sans génération | done | interface publique fermée sur l'ancienne cible |
| 3 | F03 | Runtime Cloudflare fermé | done | Worker, D1, Workflow, PR, CI et preuve publique |
| 3b | F03-V2 | Parcours éditorial V2 | done | `/v2`, carnet Japon, partage simulé et preuve publique |
| 3c | F03-SITE | V2 comme site principal | done | livré le 7 septembre 2026 : cinq pages pré-rendues, outils locaux, PR #54 fusionnée, contrôles et preuve publique |
| 4 | F04 | Stockage privé et cycle de vie | in_progress | R2 UE, chiffrement, jetons et purge prouvés |
| 5 | F05 | Génération synthétique asynchrone | in_progress | texte, images, quotas, reprise et coûts observés |
| 6 | F06 | Page privée et courriel | in_progress | rendu, suppression, notification et notice validés |
| 7 | F07 | Domaine Cloudflare | done | web, DNS d'envoi, apex, `www`, TLS et release vérifiés |
| 8 | F08 | Bêta gratuite limitée | in_progress | candidat ADR-0013, preuves fournisseur et publiques encore requises |
| 9 | F09 | Attribution Booking.com | blocked | partenariat et liens approuvés |
| 10 | F10 | Paiement Stripe | planned | Checkout, webhook signé, fiscalité et remboursement décidés |
| 11 | F11 | Voyage vivant | planned | parcours pendant et après le séjour testé |

États autorisés : `planned`, `in_progress`, `blocked`, `done`, `cancelled`.

## F03, runtime Cloudflare fermé

Inclus :

- Worker TypeScript et Static Assets ;
- D1 avec migrations versionnées ;
- Workflow déployé mais incapable d'appeler OpenAI ;
- suppression du serveur HTTP et des releases OCI/VPS du chemin courant ;
- CI Wrangler et Docker Compose local ;
- URL `workers.dev` avec génération fermée.

La phase est terminée quand la branche est fusionnée, `main` est vert, la règle
de protection exige `Validate Cloudflare release`, la version Worker issue du
SHA fusionné répond et la preuve est consignée.

## F03-SITE, V2 comme site principal

Décision acceptée dans l'ADR-0012 et tranche publiée le 7 septembre 2026 par la
[PR #54](https://github.com/nclsppr/monflorian/pull/54). Elle promeut l'interface
V2 sans ouvrir le backend personnalisé ni modifier les phases F04 à F11.

- [x] Pré-rendre l'accueil, le carnet Japon, l'index des guides et deux articles.
- [x] Conserver leur lecture et leur navigation sans JavaScript ; hydrater React
  pour les outils interactifs.
- [x] Rediriger l'ancienne entrée `/v2` en `308` et conserver les destinations des
  liens historiques de carnet et d'inspiration.
- [x] Remplacer le questionnaire déterministe par un pense-bête utile, copiable,
  téléchargeable en texte et enregistrable sur l'appareil par choix explicite.
- [x] Conserver les cases de la checklist localement à chaque modification, avec
  explication et effacement. Aucune case ne vaut réservation.
- [x] Partager le lien public du carnet et proposer son impression. Retirer le
  faux partage privé et l'attente artificielle.
- [x] Donner aux pages des métadonnées, des liens internes et des sources utiles.
  Vérifier la disponibilité du contenu ; ne pas promettre de classement SEO.
- [x] Garder les cinq portraits V2, le logo, les couleurs, la pile système, Kalam
  et Outfit. Réduire l'introduction desktop et placer l'action mobile avant
  l'aperçu du téléphone.
- [x] Mettre à jour la notice et les contrats des copies locales.

La validation complète, les contrôles requis de `main`, la fusion et le
déploiement sont terminés. Les sondes retrouvent les cinq pages HTML et les
assets attendus, les redirections `308` et les erreurs `404`. La création reste
fermée avec `503 TRIP_CREATION_UNAVAILABLE`. `STATUS.md` et
`DELIVERY-EVIDENCE.md` conservent les contrôles détaillés, la version Cloudflare
active et les limites du parcours.

## Candidat du 2 octobre 2026

L'ADR-0013 fixe la tranche courante : formulaire relié à la création, recherche
web, carnet `itinerary.v2`, hôtels sourcés, transport selon le besoin et
personnalisation facultative par une image. Tokyo à deux et Luxembourg sans
vol sont les deux scénarios de qualification. Les phases F04 à F08 restent
ouvertes jusqu'à la preuve du parcours en production.

La migration additive `0004_trip_research.sql`, les alias API `/api/v1` et les
règles de rétention accompagnent ce candidat. La liste d'activation détaillée
vit dans `RESTE-A-FAIRE.md`.

## F04, stockage privé et cycle de vie

Le bucket privé UE, ses règles de cycle de vie, les secrets de chiffrement et
la migration d'idempotence sont en place. Le Worker déployé ajoute l'écriture R2, le
chiffrement AES-GCM, le jeton haché, la suppression anticipée et la tâche de
purge. La phase reste ouverte jusqu'à une preuve synthétique après déploiement.

- Activer R2 et créer un bucket à juridiction UE.
- Garder le bucket privé et refuser `r2.dev`.
- Écrire les photos dans R2 avant de démarrer le Workflow.
- Chiffrer brief, résultat et courriel dans D1 avec un Worker Secret.
- Hacher le jeton de consultation et ne jamais le journaliser.
- Supprimer les sources après génération, au plus tard sous 24 heures.
- Expirer à création + 30 jours ou retour + 7 jours, selon la date la plus
  tardive, sans dépasser 180 jours. Garder la suppression anticipée.
- Porter la règle R2 des résultats à 180 jours avant activation et prouver la
  purge applicative propre à chaque échéance.
- Prouver la purge avec des objets et données synthétiques.

## F05, génération sourcée asynchrone

L'ADR-0013 enrichit le contrat historique sous `itinerary.v2` et reporte la
promotion dynamique de `TravelGuideV1`. Sa fixture continue d'alimenter le
carnet Japon. La bêta produit une seule illustration facultative par voyage.

- Vérifier Turnstile puis débiter atomiquement les quotas D1.
- Démarrer une seule instance Workflow par voyage.
- Rechercher les faits utiles avec Responses `web_search`, conserver les
  sources réellement retournées et chiffrer le résultat en D1.
- Composer le carnet avec Responses, `store: false`, schéma strict et plafonds
  de sortie, puis revalider dates, nuits, transport, hôtels et références.
- Construire les liens Booking côté serveur et ne publier aucun prix ou
  disponibilité comme garanti.
- Produire l'illustration seulement si des photos et leur accord sont présents.
  Conserver le texte si l'image échoue et expliquer cet état au voyageur.
- Refuser les retries aveugles ; un résultat fournisseur incertain ne prouve
  pas qu'aucun coût n'a été engagé.
- Prouver Tokyo avec départ et vols, puis Luxembourg avec une nuit et sans vol.
- Mesurer durée, volume, coût, erreurs et contenu des logs.

Les appels simulés ne terminent pas cette phase. Les accès et réglages du
projet OpenAI utilisé doivent être contrôlés avant la première donnée réelle.

## F06, page privée et courriel facultatif

Le navigateur reçoit le lien privé dès la création. La notification ne bloque
pas l'accès au carnet et reste facultative. Cloudflare Email Service est le
fournisseur retenu ; Resend reste une option future sans implémentation dans
cette tranche.

- Rendre `/voyages/{jeton}` depuis D1 et R2 avec `noindex` et `no-store`.
- Montrer le vrai statut et une erreur exploitable, sans faux temps d'attente.
- Permettre de copier le lien, d'imprimer et de supprimer le voyage.
- Envoyer le lien seulement si une adresse est fournie ; ne joindre ni photo,
  ni brief ni contenu du carnet.
- Supprimer l'adresse chiffrée après envoi confirmé et distinguer acceptation
  fournisseur de réception effective.
- Prouver suppression et purge, y compris pendant un traitement en cours.
- Publier la notice à jour avec `support@monflorian.com`, adresse fournie par
  le propriétaire, et contrôler sa présence. Vérifier séparément son routage
  et sa réception ; aucune preuve n'est encore consignée.

## F07, domaine Cloudflare

- L'ancienne zone OVHcloud a été relevée avant mutation.
- Les anciens MX, SPF et DMARC inutilisés n'ont pas été recréés. L'ADR-0009
  ajoute seulement les DNS propres à l'envoi transactionnel Cloudflare.
- Le Worker porte l'apex et `www` comme Custom Domains.
- Les anciennes valeurs A web restent consignées pour un rollback explicite.
- DNS public, TLS, page, configuration et release ont été sondés après
  propagation.

## F08, bêta gratuite limitée

- Limite quotidienne globale et par client.
- Turnstile visible et erreurs compréhensibles.
- Budget OpenAI, alerte de coût et mesure du coût par voyage.
- Aucun paiement ni carte demandée au voyageur ; paiement annoncé après la bêta.
- Consentement photo et durée de rétention visibles.
- Premier parcours humain volontaire, limité et supprimable.

## F09, attribution Booking.com

Le mode `external` reste la valeur par défaut. `cj-static` exige un partenariat
accepté, des liens approuvés, une liste d'hôtes et la mention commerciale près de
chaque lien. Aucune affiliation n'est déduite d'une URL trouvée en ligne.

## F10, paiement Stripe

Le paiement ponctuel utilisera Checkout Sessions hébergé avec méthodes de
paiement dynamiques et clé restreinte. Seul un webhook signé et idempotent peut
marquer le paiement comme acquis. Fiscalité, remboursements, support et mode réel
font l'objet d'une décision séparée.

## Règle de mise à jour

- Mettre à jour une phase uniquement avec une preuve observable.
- Reporter résultats et limites dans `DELIVERY-EVIDENCE.md` et `STATUS.md`.
- Créer une ADR si l'ordre, la durée de rétention ou un fournisseur change.
- Garder une seule roadmap.
