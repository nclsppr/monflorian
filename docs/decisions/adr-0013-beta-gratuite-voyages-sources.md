# ADR-0013, ouvrir une bêta gratuite avec des voyages sourcés

## Statut

Acceptée le 2026-10-02 pour la construction du candidat demandé par le
propriétaire. L'ouverture en production reste à prouver dans `STATUS.md` et
`DELIVERY-EVIDENCE.md`.

Cette décision remplace partiellement les ADR-0007, ADR-0009, ADR-0011 et
ADR-0012 sur la durée de conservation, le caractère facultatif du courriel, le
contrat dynamique, la séquence photo et l'action principale du site. Le runtime
Cloudflare, le carnet Japon public et les contrôles d'accès restent conservés.

## Contexte

Le site publié permet de lire un exemple et de préparer une note locale. Le
propriétaire veut maintenant tester son propre voyage en production, sans
paiement : Tokyo à deux début novembre avec photos facultatives, ou une nuit
au Luxembourg avec hôtel luxueux et courte randonnée, sans avion.

Un simple retrait de prix ne répond pas à ce besoin. Le formulaire doit
commander un vrai carnet privé et les recommandations doivent utiliser les
contraintes saisies. Une recherche web ne prouve ni le meilleur prix du marché,
ni la disponibilité d'une chambre ou d'un billet.

## Décision

### Offre et parcours

- La bêta est gratuite pour le voyageur, sans carte, compte ni paywall. Les
  appels fournisseur restent payants pour l'opérateur et soumis aux quotas.
- Le paiement sera ajouté après la bêta. Aucun tarif n'est fixé dans cette
  tranche ; l'ancien montant de 50 € ne devient pas une promesse commerciale.
- L'action principale est « Créer mon voyage gratuitement ». L'exemple Japon reste
  accessible avant la saisie et ne se fait jamais passer pour son résultat.
- Le formulaire recueille destination, départ, dates ou durée de 1 à 14 jours,
  voyageurs, rythme, transport, budget global en euros et style d'hébergement.
  La valeur `none` du transport écarte les suggestions de vol.
- Les photos et le courriel sont facultatifs. Choisir une photo prépare son
  aperçu local ; seul l'envoi explicite du formulaire la transmet. L'accord
  sur les fichiers et les personnes représentées est exigé si une photo existe.
- Le navigateur reçoit immédiatement le lien privé et suit l'état réel du
  traitement. La notification facultative utilise Cloudflare Email Service.

### Contrat dynamique compact

Le candidat enrichit le contrat d'itinéraire existant sous la version
`itinerary.v2`. Il conserve la lecture des anciens résultats et ajoute les
informations utiles à la décision : journées, alternatives, hébergements
nommés, transport, conseils, vérifications et sources.

L'intégration dynamique de `TravelGuideV1` prévue par l'ADR-0011 est reportée.
Son volume, ses relations entre chapitres et ses images multiples ne sont pas
nécessaires à la première preuve complète. Sa fixture continue d'alimenter le
carnet Japon public. Ce choix remplace volontairement sa promotion au Workflow,
sans réduire le parcours à une démonstration statique.

La bêta produit au maximum une illustration personnalisée par voyage. Si cette
étape échoue, l'itinéraire textuel déjà valide reste livré et la page signale
l'absence d'image. Aucune relance payante n'est automatique après un résultat
incertain. Le brief libre n'est pas une consigne d'image de confiance.

### Recherche et liens

Une étape Responses distincte utilise `web_search` avant la rédaction. Les
requêtes portent sur les paramètres utiles et les catégories d'intérêts,
jamais sur le brief brut, les photos, le courriel ou le jeton privé. Le résultat
de recherche est borné, chiffré en
D1 et traité comme une donnée non fiable.

Les sources viennent des résultats et annotations réellement retournés par la
recherche. Un hôtel nommé doit être lié à une source vérifiable ; une URL
inventée par le texte généré ne suffit pas. Les références retenues sont
visibles et cliquables près des recommandations. La date de recherche indique
une consultation, pas une garantie d'actualité permanente.

Le serveur construit les recherches Booking.com après validation du résultat.
Les vols restent des options et des liens de recherche adaptés au départ, aux
dates et au transport demandé. Aucun scraping, inventaire partenaire, achat ou
affiliation n'est ajouté. Prix, disponibilités, bagages et conditions restent à
vérifier sur le site du prestataire avant réservation.

### Durées et suppression

Le voyage expire à la plus tardive de ces deux dates : création + 30 jours ou
retour + 7 jours, avec une limite absolue de création + 180 jours. Sans date de
retour, la durée est de 30 jours. Les dates passées et les retours à plus de
173 jours sont refusés à la création.

Les sources photo restent supprimées après traitement, au plus tard sous
24 heures. L'adresse de notification est supprimée après envoi confirmé. Le
retrait anticipé révoque le lien et supprime données et médias même si un
Workflow est encore en cours ; un résultat tardif ne doit pas recréer le voyage.

La règle R2 de secours des images générées doit passer de 30 à 180 jours avant
l'activation. La purge applicative conserve l'échéance précise de chaque
voyage. Une modification du contrat local ne prouve pas la règle distante.

### Fournisseurs et API

Le compte OpenAI existant reçoit une clé dédiée selon l'autorisation du
propriétaire. Aucun nouveau compte voyageur ou Resend n'est nécessaire pour
cette tranche. Resend reste une option future, sans adaptateur ni secret ajouté.

`/api/trips` reste l'entrée canonique ; les alias `/api/v1` utilisent les mêmes
validateurs et contrôles. La configuration publique expose la gratuité de la
bêta et les capacités effectivement ouvertes. La présence d'une clé ne suffit
pas à annoncer `serviceReady: true`.

## Vérification avant ouverture

- Exécuter `./scripts/verify.sh` et les contrôles visibles sur mobile et bureau.
- Appliquer la migration de recherche chiffrée et vérifier la règle R2 à
  180 jours, la purge à 24 heures et le retrait pendant un traitement.
- Éprouver Tokyo avec transport aérien et Luxembourg sans vol, puis inspecter
  sources, liens, durée, coût, erreurs et données conservées.
- Prouver une création sans photo ni courriel, puis une avec illustration et
  notification autorisée. Un identifiant de message ne prouve pas sa réception.
- Vérifier le refus de dates passées, quotas, doublons, jetons invalides,
  résultats non sourcés et URLs dangereuses.
- Consigner SHA, CI, version Worker, drapeaux, réponses publiques et limites.

## Rollback

Fermer la création et les appels fournisseur, conserver la lecture des voyages
déjà créés et leur suppression, puis revenir à une version compatible avec les
données présentes. Ne pas ramener la règle R2 à 30 jours tant qu'un voyage
valide dépasse cette durée. Les migrations restent additives.

## Références

- [Web search OpenAI](https://developers.openai.com/api/docs/guides/tools-web-search)
- [Sorties structurées](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Courriel Cloudflare](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Traitement des données](../../DATA-PROCESSING.md)
- [Gates de livraison](../../RESTE-A-FAIRE.md)
