# ADR-0007, runtime et production Cloudflare

## Statut

Acceptée le 2026-08-24. Implémentation en cours.

La reprise de la messagerie pendant la migration du domaine est remplacée par
[l'ADR-0008](adr-0008-domaine-web-only-cloudflare.md).

Cette décision remplace l'ADR-0002 pour le runtime et la production, ainsi que
l'ADR-0004 pour la cible de l'aperçu. L'ADR-0003 reste applicable uniquement à
l'ancien environnement Atlas tant qu'il existe. La migration Cloudflare ne le
lit pas, ne le modifie pas et ne l'utilise pas comme dépendance.

## Contexte

Le produit cible reçoit un brief et des photos, compose un voyage et des
illustrations avec OpenAI, conserve le résultat derrière une page privée, ajoute
des liens Booking.com puis envoie cette page par courriel. Le premier MVP est
gratuit. Un paiement ponctuel Stripe viendra seulement après la preuve du
parcours gratuit.

La chaîne Node.js, OCI et Atlas fonctionne pour un aperçu fermé, mais elle rend
une modification statique dépendante de plusieurs artefacts et d'un contrôle
central. Le propriétaire choisit Cloudflare comme nouvelle cible afin de réduire
le délai entre un changement et sa publication.

## Options considérées

### Conserver Java ou Node.js dans un conteneur

Cloudflare Containers permettrait de garder un runtime serveur classique. Cette
option conserve toutefois l'image, son démarrage, son registre et une seconde
couche d'exploitation. Elle n'apporte rien au MVP et n'est pas retenue.

### Séparer Pages et un backend externe

Cette option accélère le frontend, mais maintient deux déploiements et deux
frontières opérationnelles. Elle est refusée pour le MVP.

### Un Worker TypeScript avec Static Assets

Le même déploiement sert l'interface et les routes API. Les modules métier
JavaScript existants restent réutilisables. D1, R2 et Workflows sont accessibles
par bindings sans réseau privé ni SDK d'infrastructure. Cette option est retenue.

## Décision

### Composants

| Composant | Rôle dans le MVP | Décision |
| --- | --- | --- |
| Workers et Static Assets | Servir le site, l'API et les pages de résultat | Un seul projet Wrangler, sans framework HTTP |
| D1 | Statuts, quotas, métadonnées, itinéraire structuré et jetons privés hachés | Base européenne, migrations SQL versionnées |
| R2 | Photos d'entrée et illustrations générées | Bucket privé à juridiction européenne, jamais de domaine `r2.dev` public |
| Workflows | Enchaîner OpenAI, persistance, nettoyage et courriel sans garder une requête HTTP ouverte | Un identifiant de workflow par voyage, étapes idempotentes |
| Turnstile | Réduire les créations automatisées du MVP gratuit | Obligatoire avant l'ouverture de la génération |
| OpenAI | Produire l'itinéraire structuré et éditer les images | Responses avec `store: false`, Image Edits, sorties revalidées |
| Courriel transactionnel | Envoyer le lien privé quand le voyage est prêt | Fournisseur HTTP dédié, choisi avant l'ouverture; Email Routing ne suffit pas à ce besoin |
| Booking.com | Ouvrir des recherches externes ou des liens affiliés approuvés | Construction côté Worker, jamais par le modèle |
| Stripe | Paiement ponctuel après le MVP gratuit | Checkout Sessions hébergé et webhook signé, aucune ressource Stripe dans cette tranche |

KV, Queues, Durable Objects, Vectorize, Workers AI et Containers ne sont pas
ajoutés. D1 et Workflows couvrent le besoin initial. Une nouvelle dépendance doit
résoudre une limite observée, pas une hypothèse.

### Parcours d'un voyage

1. Le Worker valide le brief, le consentement, les limites et le jeton Turnstile.
2. Il crée un identifiant opaque, hache le jeton de consultation et écrit l'état
   `pending` dans D1.
3. Il valide les photos puis les écrit dans R2. Le workflow reçoit seulement les
   identifiants et les clés R2, jamais les images dans ses paramètres.
4. Le Workflow appelle OpenAI. Un appel payant n'est pas relancé aveuglément
   après un résultat incertain. Chaque étape vérifie l'état D1 avant d'agir.
5. L'itinéraire JSON validé et les métadonnées restent dans D1. Les images
   générées restent dans R2. Le Worker rend `/voyages/{jeton}` depuis ces données.
6. Le fournisseur de courriel reçoit l'adresse nécessaire et le lien privé après
   le passage à `ready`. Le courriel n'embarque ni photo ni brief complet.

La page HTML n'est pas dupliquée dans un objet par voyage. Un template commun
rend les données structurées au moment de la lecture. Cette forme garde une seule
source à corriger et permet de publier une correction visuelle sans régénérer les
voyages.

### Données et durée

- Le jeton de page possède au moins 256 bits aléatoires. Seul son SHA-256 est
  indexé dans D1.
- Les photos d'entrée sont supprimées dès que les illustrations sont produites,
  avec une limite dure de 24 heures après succès ou échec.
- Le brief, l'adresse de courriel, l'itinéraire et les illustrations expirent au
  plus tard après 30 jours pour le MVP.
- L'adresse de courriel est chiffrée au niveau applicatif et supprimée après
  l'envoi réussi. La clé de chiffrement reste un Worker Secret.
- Une route liée au jeton permet de supprimer le voyage avant l'échéance.
- Les logs et traces excluent briefs, adresses, jetons, photos, prompts et
  résultats.

Ces durées doivent apparaître dans l'interface et la notice avant la première
photo réelle. Tant que le nettoyage automatique et sa preuve n'existent pas, la
génération reste fermée.

### OpenAI

Le Workflow conserve l'adaptateur HTTP existant. Responses produit un JSON
strict avec `store: false`, un plafond de sortie et un `safety_identifier`
pseudonymisé. Image Edits reçoit seulement les photos réencodées et la scène.
Les identifiants fournisseur et l'usage mesuré peuvent être conservés sans
contenu pour le diagnostic et le suivi de coût.

Le statut asynchrone du produit vient de Cloudflare Workflows. Le mode
`background` de Responses n'est pas requis au départ, car il ajouterait un
second état distant à synchroniser. Il pourra être évalué si la durée réelle
des réponses dépasse la fenêtre utile d'une étape.

### Stripe après le MVP

Le paiement futur utilise une Checkout Session ponctuelle, hébergée par Stripe,
avec méthodes de paiement dynamiques. Le Worker crée la session avec une clé
restreinte et ne marque jamais un voyage payé depuis le retour navigateur. Un
webhook dont la signature est vérifiée crée ou libère la génération de façon
idempotente. La fiscalité et les remboursements demandent une décision séparée
avant le mode réel.

### Domaines et livraison

Le bootstrap peut publier une version fermée sur `workers.dev`. Le transfert de
`monflorian.com` vers Cloudflare vient seulement après cette preuve. Il recopie
et vérifie les MX, SPF, TXT et sous-domaines avant de changer les serveurs de
noms. L'ancien Atlas reste intact pendant le délai de rollback et n'est pas une
source de secret pour le nouveau runtime.

GitHub Actions vérifie le bundle Wrangler. La publication de `main` utilise un
jeton Cloudflare limité au Worker et aux ressources nécessaires. Une image ou un
texte statique doit pouvoir être livré par un seul déploiement Worker.

## Garde-fous d'activation

Les routes coûteuses restent fermées tant que tous les points suivants ne sont
pas prouvés :

- D1 migré et R2 privé avec règles d'expiration effectives ;
- Workflow synthétique complet et reprise après échec contrôlée ;
- secrets OpenAI, chiffrement, Turnstile et courriel installés hors Git ;
- quotas globaux et par client persistants ;
- page privée non indexable, retrait anticipé et nettoyage automatique ;
- notice, contact de droits et consentement visibles ;
- budget et limites fournisseur configurés ;
- sondes publiques sans contenu personnel dans les logs.

L'absence d'un seul garde-fou maintient `serviceReady: false`.

## Conséquences

La cible n'a plus de backend Java ou Node.js à opérer en production. TypeScript
est le choix le plus direct pour Workers et permet de conserver le coeur métier.
Le dépôt garde Docker Compose uniquement comme parcours local Foundation.

Le MVP dépend davantage de Cloudflare. Cette dépendance est acceptée en échange
d'un seul déploiement, de bindings natifs et d'un rollback par version Worker.
Les contenus privés restent accessibles à Cloudflare et OpenAI selon leurs
contrats respectifs. Une région européenne réduit la dispersion mais ne vaut pas
promesse de résidence complète sans revue contractuelle.

## Rollback

1. Couper les drapeaux de génération.
2. Revenir à la version Worker précédente.
3. Restaurer uniquement les enregistrements web ou les serveurs de noms à partir
   du relevé DNS conservé, sans toucher à la messagerie.
4. Ne supprimer D1 ou R2 qu'après expiration ou export des données requises.
5. Ne modifier l'ancien Atlas que dans une tâche séparée explicitement autorisée.

## Réexamen

Réexaminer cette décision avant le premier paiement réel, un compte client, une
durée supérieure à 30 jours, un partage public, un second fournisseur d'IA ou
une exigence contractuelle de résidence plus stricte.

## Références

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2)
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)
- [`DATA-PROCESSING.md`](../../DATA-PROCESSING.md)
- [`THREAT-MODEL.md`](../../THREAT-MODEL.md)
