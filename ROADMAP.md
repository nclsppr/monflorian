# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Mon Florian doit devenir un guide continu. Il aide à choisir avant le départ, reste pratique pendant le séjour et peut devenir un souvenir après le retour. La tranche actuelle prouve seulement la composition initiale et une projection dessinée facultative.

## Principes de séquencement

- Vérifier chaque fournisseur avec des données synthétiques avant une photo ou un brief réel.
- Maintenir Florian dans la boucle pour les trajets, horaires, fermetures, prix et réservations.
- Garder les générations fermées tant que les coûts, les données et le parcours ne sont pas observés sur Atlas.
- Séparer l'image OCI publiée, son admission par Atlas, le DNS et l'ouverture publique.
- Ne pas confondre un lien Booking.com externe avec un partenariat affilié.
- Ne terminer une phase qu'avec une preuve datée dans l'environnement concerné.

## Vue d'ensemble

| Ordre | ID | Phase | Résultat utilisateur ou opérationnel | État macro | Critère de sortie | Preuve observée | Sortie le |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | F00 | Dépôt et prototype reproductible | Le concept est versionné et consultable localement | done | Vérification locale, Compose, navigateur, push et CI verte | Commit `e8f5d97`, preuve `6c6824a`, runs `32637460676` et `32637925764` | 2026-08-23 |
| 1 | F01 | Candidat applicatif critique | Une personne peut préparer un brief, recevoir un voyage structuré et demander un dessin | done | Tests, OpenAPI, image de production, Compose et contrôle navigateur valides | Candidat `fc9212f`, trois workflows verts, digests et attestations consignés | 2026-08-23 |
| 2 | F02 | Frontières OpenAI vérifiées | Les deux générations fonctionnent avec données synthétiques et erreurs sûres | in_progress | Smoke tests Responses et Image Edits, coût observé, aucune donnée dans les logs | Générations fermées dans l'aperçu public; parcours fournisseur complets non prouvés | |
| 3 | F03 | Release Atlas privée | Le digest validé tourne derrière une protection privée | cancelled | Release immuable, admission du contrôle central, secret monté, santé et parcours synthétique | ADR-0004 remplace cette étape par un aperçu public sans génération | 2026-08-23 |
| 4 | F04 | Domaine et aperçu public | Le rendu répond sur `monflorian.com` avec TLS, sans génération | done | Route Atlas, Caddy valide, sondes apex et `www`, fonctions coûteuses fermées | Source `4ac2c42`, release `af8d18a`, contrôle Atlas `d98db4e`, sondes et navigateur publics réussis | 2026-08-24 |
| 5 | F05 | Attribution Booking.com | Les liens affiliés approuvés portent une mention commerciale claire | blocked | Partenariat accepté, liens CJ validés, domaines autorisés et test d'attribution | Aucun partenariat ou identifiant accepté observé | |
| 6 | F06 | Offre payante et livraison durable | Un client paie et retrouve un mini-site ou PDF relu | planned | Paiement, contrat de données persistant, support et rollback prouvés | | |
| 7 | F07 | Voyage vivant | Le guide s'ajuste pendant le séjour et devient un carnet après le retour | planned | Parcours avant, pendant et après vérifié avec un utilisateur réel | | |

États autorisés : `planned`, `in_progress`, `blocked`, `done`, `cancelled`.

## F01, candidat applicatif critique

### Inclus

- Application web sous `app/` et prototype F00 conservé sous `prototype/`.
- Backend Node.js sans package npm d'exécution tiers.
- Contrat OpenAPI et validation stricte des entrées et sorties.
- Appels OpenAI isolés derrière des fakes dans les tests.
- Itinéraire, alternatives pluie et fatigue, listes de vérification et étapes d'hébergement.
- Illustrations dessinées à partir de photos réencodées avec consentement.
- Modes Booking `off`, `external` et `cj-static`.
- Image de conteneur non privilégiée, Compose et documentation Critique.

### Exclu

- Photo personnelle dans les tests ou le dépôt.
- Scraping, prix ou disponibilité Booking.com.
- Persistance, compte, paiement, PDF ou partage public.
- Mutation Atlas ou DNS dans la même preuve que le build local.

### Critère de sortie

- `./scripts/verify.sh` passe localement puis sur le SHA poussé.
- Les tests couvrent les tailles, formats, origines, accès, quotas, refus du fournisseur et liens autorisés.
- Le conteneur démarre sans privilège et répond sur `/api/health` et `/api/config`.
- Le parcours visible fonctionne sur petit mobile et bureau, au clavier et avec mouvement réduit.
- La preuve nomme le SHA, le digest éventuel, les commandes et les limites.

## F02, frontières OpenAI vérifiées

- Lire la clé hors du dépôt et ne jamais l'imprimer.
- Utiliser un brief synthétique et une image générée pour le test.
- Vérifier que la requête Responses contient `store: false`.
- Vérifier une sortie JSON conforme puis une image WebP lisible.
- Rechercher le brief, l'image et la clé dans les logs et artefacts produits.
- Consigner les identifiants de requête, le modèle, le résultat et le coût observable sans contenu utilisateur.

Un test local simulé ne termine pas cette phase. Un appel fournisseur réel contrôlé est requis.

## F03, release Atlas privée

- Publier une image OCI par digest depuis le SHA vert.
- Livrer le contrat de release et le profil Mon Florian dans `vps-infra`.
- Monter les secrets avec les permissions minimales.
- Déployer sans port hôte public, derrière le réseau applicatif et Caddy.
- Protéger l'accès avant toute génération payante.
- Observer santé, logs, quotas et un parcours synthétique, puis tester le rollback.

Une image publiée n'est pas un déploiement. Une CI du dépôt produit ne prouve pas l'admission ni l'exécution par Atlas.

## F04, domaine et ouverture publique

Le domaine `monflorian.com` a été enregistré chez OVHcloud le 2026-08-23 à
13:00:22Z. Le 2026-08-24, les deux serveurs autoritaires et les résolveurs
publics renvoient Atlas `137.74.174.163` pour l'apex et `www`, sans AAAA. La
route, le certificat et le backend ont été activés ensemble avec les deux
générations fermées.

La preuve de sortie comprend :

- confirmer que la zone conserve tous les enregistrements non liés au site ;
- ne pas ajouter d'AAAA sans chemin IPv6 vérifié ;
- préserver les MX de priorités 1, 5 et 100 ainsi que le SPF qui inclut `mx.ovh.com` ;
- valider Caddy avant reload et attendre le certificat ;
- sonder HTTP, HTTPS, apex, `www`, en-têtes et parcours critique depuis l'extérieur ;
- conserver le rollback DNS et le TTL observé dans la preuve.

## F05, attribution Booking.com

Le mode par défaut reste `external`. Il ouvre une recherche Booking.com ordinaire et ne présente aucune commission.

Le mode `cj-static` reste fermé tant que le propriétaire ne possède pas une relation acceptée, les conditions applicables et des liens approuvés. Son activation exige aussi la mention suivante près des liens concernés : "Liens affiliés Booking.com. Mon Florian peut percevoir une commission si tu réserves via ces liens."

L'API Demand ne fait pas partie de cette roadmap. Son usage demanderait un contrat de partenaire géré, une revue de production et la validation écrite nécessaire avant d'utiliser l'IA avec des éléments Booking.com.

## Règle de mise à jour

- Mettre à jour une phase uniquement avec une preuve observable.
- Reporter l'exécution et les limites dans `DELIVERY-EVIDENCE.md` et `STATUS.md`.
- Créer une ADR si l'ordre ou un fournisseur change.
- Garder une seule roadmap.
