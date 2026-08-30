# Traitement des données

Ce document sépare l'aperçu Cloudflare actuellement fermé du parcours persistant
cible. Il ne constitue pas une déclaration de conformité juridique. Rôles,
bases légales, transferts et canal de droits doivent être validés avant une
personne réelle.

## État courant

L'aperçu public ne reçoit aucun brief ni photo : l'interface désactive l'action,
`/api/config` annonce `serviceReady: false` et les routes de génération répondent
`503`. D1 contient le schéma mais aucun voyage. Le bucket R2 privé est vide, sans
URL publique, avec des règles d'expiration de secours. Le Worker déployé relie
D1 et R2, et le Workflow déployé contient les appels OpenAI sans retry
automatique. La création reste fermée : aucun appel OpenAI n'est exécuté,
le widget Turnstile reste masqué et le courriel n'est pas activé.

`TravelGuideV1`, son validateur, son compilateur d'image et la fixture Japon
enrichie restent des artefacts candidats du dépôt, non intégrés au runtime. Le
Worker déployé ne les importe pas et aucun de ces artefacts n'est transmis à
OpenAI dans cette tranche.

## Parcours cible

| Catégorie | Exemples | Finalité | Emplacement cible |
| --- | --- | --- | --- |
| Brief | destination, intérêts, contraintes | composer le voyage | chiffré dans D1 |
| Paramètres | dates, voyageurs, rythme | borner et adapter | chiffrés dans D1 |
| Courriel | adresse de notification | envoyer le lien privé | chiffré dans D1 jusqu'à l'envoi |
| Identifiant réseau pseudonymisé | SHA-256 avec secret de quota | limiter l'abus | D1, sans adresse brute |
| Photos | visages et apparence | créer une projection synthétique éditoriale | R2 privé |
| Plan d'images | références de lieu et choix visuels bornés | choisir les scènes sans prompt libre | dans `TravelGuideV1` chiffré après validation |
| Résultat | guide `TravelGuideV1` validé et listes de vérification | rendre la page privée | chiffré dans D1 |
| Images générées | WebP générés | illustrer le voyage | R2 privé |
| Jeton privé | secret dans l'URL | autoriser consultation et retrait | SHA-256 seulement dans D1 |
| Logs | route normalisée, statut, durée, identifiants techniques | diagnostic et sécurité | Cloudflare Logs |
| Navigation Booking.com | destination, dates, voyageurs | recherche au clic | navigateur puis site externe |

Ne saisis pas de diagnostic médical, document d'identité, adresse privée, moyen
de paiement, secret ou information inutile au voyage.

## Limites d'entrée

- brief : 2 000 caractères ;
- voyage : 14 jours et 8 voyageurs ;
- photos : 1 à 4 ;
- photo réencodée : 1 500 000 octets, 256 à 2 048 pixels par côté et au plus
  4 194 304 pixels ;
- corps itinéraire : 32 768 octets ;
- corps illustration historique : 8 500 000 octets.

Le navigateur réencode les photos en PNG ou WebP. Le Worker doit aussi contrôler
signature, dimensions, poids et format avant R2 et avant OpenAI.

## Destinataires

### Cloudflare

Workers traite les requêtes. D1 conserve l'état et les champs chiffrés. R2
conserve les images privées. Workflows conserve les états techniques de
traitement. La juridiction UE de D1 et R2 réduit la dispersion des données, mais
ne prouve pas à elle seule une résidence complète de tous les services
Cloudflare. La revue contractuelle reste requise.

R2 ne doit avoir ni domaine public, ni listing, ni URL d'objet directe. Le
Worker contrôle chaque lecture à partir du jeton de voyage.

### OpenAI

Responses reçoit le brief, les paramètres et un `safety_identifier`
pseudonymisé. Dans le parcours cible, Image Edits reçoit seulement les
références réencodées et une consigne compilée côté serveur depuis des champs de
scène validés. Il ne reçoit ni le brief brut, ni un prompt libre produit par
Responses. Les appels Responses fixent `store: false` et demandent une sortie
JSON stricte.

Selon la [documentation OpenAI sur les contrôles de
données](https://developers.openai.com/api/docs/guides/your-data), `store: false`
n'est pas une promesse d'absence de journaux de sûreté. Les contrôles du projet,
la région, les sous-traitants et toute option de partage doivent être vérifiés
sur le compte réellement utilisé avant ouverture.

### Cloudflare Email Service

Le binding d'envoi reçoit l'adresse, le lien privé et sa date d'expiration. Il ne
reçoit ni photo, ni brief complet, ni contenu de voyage dans le courriel.
Cloudflare gère aussi le journal de livraison, les bounces et les suppressions.
Le message réel et les réglages de rétention doivent être vérifiés avant une
personne réelle.

### Booking.com et CJ

Le backend n'envoie aucune donnée à Booking.com ou CJ. Le navigateur les contacte
seulement après un clic. Le mode `external` peut placer destination, dates et
nombre d'adultes dans l'URL. `cj-static` reste fermé sans partenariat, liens
approuvés et notice commerciale.

### Stripe, plus tard

Stripe recevra les données nécessaires au paiement depuis Checkout. Mon Florian
ne recevra aucune donnée de carte. La durée, la fiscalité, les remboursements et
le lien entre paiement et voyage seront décidés avant toute ressource réelle.

## Consentement sur les photos

Avant envoi, l'interface exige que la personne confirme :

- qu'elle peut utiliser chaque fichier ;
- que les personnes représentées comprennent l'envoi à OpenAI ;
- qu'elles acceptent une projection synthétique éditoriale pour ce voyage ;
- qu'aucune personne ne nécessite une autorité ou procédure absente.

Ce contrôle ne vérifie ni l'identité, ni l'âge, ni l'autorité. Le consentement ne
vaut pas publication, entraînement, galerie ou conservation indéfinie.

## Rétention et effacement cible

| Emplacement | Données | Durée maximale MVP | Retrait |
| --- | --- | --- | --- |
| Mémoire navigateur | formulaire et prévisualisations | onglet courant | rechargement ou fermeture |
| R2, sources | photos réencodées | suppression après génération, limite dure 24 h | purge automatique ou retrait du voyage |
| R2, résultats | images générées | 30 jours | expiration ou retrait anticipé |
| D1 | demande et résultat chiffrés, métadonnées | 30 jours | expiration ou retrait anticipé |
| D1, courriel | adresse chiffrée | jusqu'à l'envoi réussi, au plus 30 jours | suppression après envoi ou expiration |
| D1, quotas | date et sujet pseudonymisé par HMAC | 31 jours | purge automatique |
| Logs Cloudflare | métadonnées techniques | durée minimale à configurer et consigner | politique Cloudflare |
| OpenAI | entrées et sorties | selon le contrat et les contrôles du compte | procédure fournisseur |
| Booking.com, CJ, Stripe | données après action explicite | politiques propres | procédure du fournisseur |

La tâche de purge doit être idempotente, supprimer R2 avant de marquer D1 comme
expiré et produire une preuve sans nom de fichier ni contenu. Tant qu'elle n'est
pas déployée et testée, aucune donnée réelle n'est autorisée.

## Accès et incidents

- Les secrets sont des Worker Secrets, jamais des variables commitées.
- Le jeton de page n'est jamais journalisé ; les paramètres d'URL sont exclus des
  logs applicatifs.
- Les champs persistés sont chiffrés avec AES-GCM et une clé distincte des clés
  fournisseur.
- Une fuite de clé coupe la fonction concernée, révoque la clé et recherche
  l'exposition sans recopier de contenu.
- Une fuite de brief ou photo coupe les générations, conserve les métadonnées
  utiles et identifie les destinataires.
- Le canal de contact des droits manque encore et bloque une personne réelle.

## Tests autorisés

- Brief fictif sans identité ni réservation réelle.
- Personnages entièrement fictifs produits par génération d'image et scènes
  synthétiques versionnés comme fixtures éditoriales.
- Fixture `TravelGuideV1` du dépôt sans appel fournisseur ni information de
  réservation présentée comme vérifiée.
- Les futures photos de voyageurs réels suivent le flux R2 privé ; elles ne sont
  pas confondues avec les fixtures fictives du dépôt.
- Un seul parcours fournisseur contrôlé avant ouverture.

## Changements qui imposent une nouvelle décision

- durée supérieure à 30 jours ;
- compte, partage public, historique ou PDF ;
- biométrie ou reconnaissance ;
- nouveau fournisseur, modèle ou territoire ;
- API Demand Booking.com ;
- paiement réel ;
- exposition directe de R2.

## Références

- [`PROJECT.md`](PROJECT.md)
- [`THREAT-MODEL.md`](THREAT-MODEL.md)
- [`RUNBOOK.md`](RUNBOOK.md)
- [OpenAI, contrôles de données](https://developers.openai.com/api/docs/guides/your-data)
- [Cloudflare, localisation D1](https://developers.cloudflare.com/d1/configuration/data-location/)
- [Cloudflare, juridictions R2](https://developers.cloudflare.com/r2/reference/data-location/)
