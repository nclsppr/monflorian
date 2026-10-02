# Traitement des données

Ce document sépare le site éditorial, ses outils locaux et le parcours
personnalisé candidat de l'ADR-0013. Il ne constitue pas une déclaration de conformité
juridique. Rôles, bases légales, transferts et publication du contact de droits
doivent être validés avant d'ouvrir le parcours personnalisé à une personne réelle.

## État courant

Le dernier état public consigné dans `STATUS.md` ne reçoit aucun brief ni photo :
`/api/config` annonce `serviceReady: false` et les routes de génération répondent
`503`. D1 contient le schéma mais aucun voyage. Le bucket R2 privé est vide, sans
URL publique, avec des règles d'expiration de secours. Le Worker déployé relie
D1 et R2, et le Workflow déployé contient les appels OpenAI sans retry
automatique. La création reste fermée : aucun appel OpenAI n'est exécuté,
le widget Turnstile reste masqué et le courriel n'est pas activé.

Le candidat du 2 octobre 2026 ajoute un envoi explicite du formulaire, une
recherche web et un résultat privé. La migration D1 et les règles R2 sont
appliquées et relues ; les contrôles du fournisseur et l'ouverture distante
restent à prouver. Cette documentation n'annonce aucune activation.

La fixture Japon canonique `TravelGuideV1` alimente statiquement le carnet
public sous `/carnets/japon-10-jours`. Ses textes et ses illustrations
synthétiques sont publics ; ses personnages sont fictifs. Le rendu ne provoque
aucun appel fournisseur. Le schéma, le validateur et le compilateur restent
réservés à ce carnet ; l'ADR-0013 reporte leur promotion dynamique au profit du
contrat compact `itinerary.v2`, compatible avec les résultats historiques.

## Outils locaux du site éditorial

Cette section décrit les copies locales issues de l'ADR-0012. La nouvelle
création privée de l'ADR-0013 possède un bouton d'envoi explicite et suit le
contrat distinct ci-dessous. Une sauvegarde locale n'est pas une création.

### Pense-bête

Le pense-bête contient une envie libre de 2 000 caractères au maximum, une
durée de 2 à 14 jours, 1 à 8 voyageurs, un rythme et une préférence
d'hébergement. Aucun nom, courriel ou portrait n'est demandé. La saisie reste
en mémoire dans la page. Elle ne personnalise pas le carnet Japon et n'est
envoyée ni à Mon Florian, ni à Cloudflare, ni à OpenAI.

Le bouton « Garder sur cet appareil » écrit une copie dans `localStorage`, sous
la clé `monflorian:trip-planner:v1`. Une modification ultérieure reste en mémoire
jusqu'au clic sur « Mettre à jour la copie ». La copie enregistrée est relue au
chargement de l'outil, après validation de sa version et de ses valeurs. Une
copie illisible ne remplace pas le formulaire.

Le bouton « Effacer de cet appareil » retire uniquement cette clé. Le contenu
encore affiché reste en mémoire jusqu'au rechargement ou à la fermeture de la
page. Le téléchargement crée un fichier texte sur l'appareil ; la copie utilise
le presse-papiers après un clic. Ces fichiers et copies suivent ensuite les
actions de la personne et les réglages de son appareil.

### Checklist du carnet

Cocher ou décocher une vérification écrit les identifiants des cases sélectionnées
dans `localStorage`, sous `monflorian:japan-checklist:v1`. L'explication est
visible auprès de la checklist. Il n'existe pas de bouton d'enregistrement
séparé et aucune donnée de réservation n'est reçue. Une case cochée signifie
seulement que la personne a vérifié le point concerné.

Au chargement, seuls les identifiants présents dans le plan de réservation
canonique sont retenus. « Tout décocher » retire cette seule clé et vide la
sélection de la page. Si le stockage échoue, l'interface l'annonce et la
checklist reste utilisable pendant la visite.

### Conservation et partage

Ces deux copies restent dans ce navigateur, pour cette origine, jusqu'à leur
effacement par l'outil, les réglages du navigateur ou le navigateur lui-même.
Elles n'ont pas d'échéance programmée. Elles ne sont ni synchronisées entre
appareils ni envoyées lors du partage du carnet. Une personne utilisant le même
profil de navigateur peut les retrouver. Les fonctions de copie, d'export ou de
partage ne déclenchent aucun envoi automatique à un proche.

Le lien du carnet ouvre toujours le même exemple public. Aucun mot de passe
simulé ne protège ce contenu. Les données des futurs voyages privés suivent le
contrat distinct ci-dessous, avec chiffrement, contrôle d'accès et expiration.

## Parcours personnalisé candidat

| Catégorie | Exemples | Finalité | Emplacement cible |
| --- | --- | --- | --- |
| Brief | destination, intérêts, contraintes | composer le voyage | chiffré dans D1 |
| Paramètres | dates ou durée, départ, voyageurs, rythme, budget, transport, hébergement | borner et adapter | chiffrés dans D1 |
| Courriel facultatif | adresse de notification | envoyer le lien privé si demandé | chiffré dans D1 jusqu'à l'envoi |
| Identifiant réseau pseudonymisé | HMAC avec secret de quota | limiter l'abus | D1, sans adresse brute |
| Photos | visages et apparence | créer une projection synthétique éditoriale | R2 privé |
| Recherche | résultats web, références et date de consultation | appuyer les recommandations | chiffrée dans D1 |
| Résultat | itinéraire `itinerary.v2` validé et listes de vérification | rendre la page privée | chiffré dans D1 |
| Images générées | WebP générés | illustrer le voyage | R2 privé |
| Jeton privé | secret dans l'URL | autoriser consultation et retrait | SHA-256 seulement dans D1 |
| Logs | route normalisée, statut, durée, identifiants techniques | diagnostic et sécurité | Cloudflare Logs |
| Navigation Booking.com | destination, dates, voyageurs | recherche au clic | navigateur puis site externe |
| Navigation transport | départ, destination et critères de recherche | comparer les options au clic | navigateur puis site externe |

Ne saisis pas de diagnostic médical, document d'identité, adresse privée, moyen
de paiement, secret ou information inutile au voyage.

## Limites d'entrée et de sortie

- brief : 2 000 caractères ;
- voyage : 1 à 14 jours et 1 à 8 voyageurs ;
- retour : au plus 173 jours après la création, dates passées refusées ;
- photos : 0 à 4, au maximum une illustration produite en bêta ;
- photo réencodée : 1 500 000 octets, 256 à 2 048 pixels par côté et au plus
  4 194 304 pixels ;
- JSON itinéraire extrait : 131 072 octets ;
- enveloppe JSON de la réponse fournisseur : 512 000 octets ;
- sortie Responses : 32 000 tokens au maximum ;
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

Responses reçoit les paramètres utiles au voyage et un `safety_identifier`
pseudonymisé. Une première étape utilise `web_search` avec destination, départ,
dates ou mois souhaité, durée, voyageurs, budget, transport, hébergement et
catégories d'intérêts déduites du brief.
Elle ne reçoit ni brief brut, ni photo, ni courriel, ni jeton de consultation.
Les résultats web peuvent provenir
de tiers et ne sont jamais des instructions de confiance. La seconde étape
compose le JSON strict à partir du brief et des références validées.

Image Edits reçoit les photos réencodées seulement si elles ont été jointes
avec accord. Sa consigne est contrôlée côté serveur ; le brief brut ne devient
pas une instruction d'image. Tous les appels Responses fixent `store: false`.

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

La notification est facultative et sa panne ne supprime pas le carnet. Resend
n'est pas un destinataire dans cette tranche : aucun adaptateur ni secret n'est
ajouté. Son éventuelle adoption demanderait une mise à jour de ce contrat.

### Booking.com et CJ

Le backend ne réserve rien auprès de Booking.com ou CJ. Une recherche web peut
consulter des pages publiques utiles au voyage, sans adresse de courriel ni
photo. Le navigateur ouvre les liens de réservation seulement après un clic.
Le mode `external` peut placer destination, dates et
nombre d'adultes dans l'URL. `cj-static` reste fermé sans partenariat, liens
approuvés et notice commerciale.

### Stripe, plus tard

Stripe recevra les données nécessaires au paiement depuis Checkout. Mon Florian
ne recevra aucune donnée de carte. La durée, la fiscalité, les remboursements et
le lien entre paiement et voyage seront décidés avant toute ressource réelle.

## Consentement sur les photos

Les photos sont facultatives dès la saisie. Leur sélection affiche un aperçu
local et ne lance aucun téléversement. Elles sont transmises au clic explicite
de création, après validation de l'accord ci-dessous. Aucun carnet n'exige une
photo pour être utile ou consultable.

Avant envoi, l'interface exige que la personne confirme :

- qu'elle peut utiliser chaque fichier ;
- que les personnes représentées comprennent l'envoi à OpenAI ;
- qu'elles acceptent une projection synthétique éditoriale pour ce voyage ;
- qu'aucune personne ne nécessite une autorité ou procédure absente.

Ce contrôle ne vérifie ni l'identité, ni l'âge, ni l'autorité. Le consentement ne
vaut pas publication, entraînement, galerie ou conservation indéfinie.

## Rétention et effacement

Le bouton de conservation hors connexion prépare un fichier HTML local après
un clic. Il contient le carnet et les illustrations déjà disponibles, sans le
jeton d’accès ni les photos sources. Il ne charge aucune ressource distante à
l’ouverture ; les liens des hôtels, transports et sources restent externes.
Cette copie ne reçoit pas les mises à jour ultérieures et reste sur l’appareil
jusqu’à sa suppression, indépendamment du retrait ou de l’expiration du voyage.

| Emplacement | Données | Durée maximale MVP | Retrait |
| --- | --- | --- | --- |
| Mémoire navigateur | formulaire et prévisualisations | onglet courant | rechargement ou fermeture |
| Navigateur, pense-bête | copie demandée explicitement | jusqu'à effacement, sans échéance programmée | « Effacer de cet appareil » ou réglages du navigateur |
| Navigateur, checklist | identifiants des cases sélectionnées | jusqu'à effacement, sans échéance programmée | « Tout décocher » ou réglages du navigateur |
| Fichier téléchargé | carnet et illustrations disponibles | jusqu’à suppression par la personne | suppression du fichier sur l’appareil |
| R2, sources | photos réencodées | suppression après génération, limite dure 24 h | purge automatique ou retrait du voyage |
| R2, résultats | images générées | échéance du voyage, 180 jours maximum | expiration ou retrait anticipé |
| D1 | demande, recherche et résultat chiffrés, métadonnées | échéance du voyage, 180 jours maximum | expiration ou retrait anticipé |
| D1, courriel | adresse chiffrée | jusqu'à l'envoi réussi, au plus l'échéance du voyage | suppression après envoi ou expiration |
| D1, quotas | date et sujet pseudonymisé par HMAC | 31 jours | purge automatique |
| Logs Cloudflare | métadonnées techniques | durée minimale à configurer et consigner | politique Cloudflare |
| OpenAI | entrées et sorties | selon le contrat et les contrôles du compte | procédure fournisseur |
| Booking.com, CJ, Stripe | données après action explicite | politiques propres | procédure du fournisseur |

L'échéance du voyage est la plus tardive entre création + 30 jours et retour +
7 jours, plafonnée à création + 180 jours. Sans date de retour : 30 jours. Elle
est affichée près du lien privé. Cette règle remplace la limite uniforme de
30 jours selon l'ADR-0013.

La purge est idempotente. Le retrait révoque l'accès puis supprime R2 et les
champs chiffrés ; un Workflow encore en cours ne doit pas recréer les données.
La preuve ne contient aucun nom de fichier ni contenu. La règle de secours R2
des résultats doit être portée à 180 jours avant activation, tandis que la
purge applicative respecte l'échéance précise. Les sources restent à 24 heures.
Une configuration locale ne prouve ni purge ni règle distante.

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
- Le propriétaire a fourni `support@monflorian.com` le 2 octobre 2026 pour le
  support et les demandes de droits. Cette adresse figure dans la notice
  candidate ; sa présence publique sera contrôlée après déploiement.
- La désignation de cette adresse ne prouve ni boîte de réception, ni routage,
  ni réception d'un message. Ces contrôles restent à consigner séparément.
  Le courriel de notification du carnet est facultatif et peut rester désactivé
  pendant l'ouverture du texte et des illustrations.

## Tests autorisés

- Brief fictif sans identité ni réservation réelle.
- Personnages entièrement fictifs produits par génération d'image et scènes
  synthétiques versionnés comme fixtures éditoriales.
- Fixture `TravelGuideV1` rendue statiquement dans le carnet public, sans appel fournisseur
  ni information de réservation présentée comme vérifiée.
- Pense-bête fictif et checklist locale, avec restauration, export, effacement
  limité aux clés prévues et refus des valeurs de stockage invalides.
- Les futures photos de voyageurs réels suivent le flux R2 privé ; elles ne sont
  pas confondues avec les fixtures fictives du dépôt.
- Scénarios fournisseur synthétiques Tokyo et Luxembourg, avec nombre d’appels,
  durée et consommation consignés avant ouverture.

## Changements qui imposent une nouvelle décision

- durée supérieure à 180 jours ou changement de la formule d'échéance ;
- compte, partage public de données personnelles, historique serveur ou PDF
  produit par le service ;
- biométrie ou reconnaissance ;
- nouveau fournisseur, modèle ou territoire ;
- API Demand Booking.com ;
- paiement réel ;
- exposition directe de R2.

## Références

- [`PROJECT.md`](PROJECT.md)
- [`THREAT-MODEL.md`](THREAT-MODEL.md)
- [`RUNBOOK.md`](RUNBOOK.md)
- [ADR-0012, V2 comme site principal](docs/decisions/adr-0012-v2-site-principal.md)
- [ADR-0013, bêta gratuite sourcée](docs/decisions/adr-0013-beta-gratuite-voyages-sources.md)
- [OpenAI, contrôles de données](https://developers.openai.com/api/docs/guides/your-data)
- [Cloudflare, localisation D1](https://developers.cloudflare.com/d1/configuration/data-location/)
- [Cloudflare, juridictions R2](https://developers.cloudflare.com/r2/reference/data-location/)
