# ADR-0013, application iOS native et API commune

## Statut

Acceptée le 2026-09-08. Implémentation candidate locale.

Le propriétaire autorise la création de l'application native et confirme que
les photos facultatives doivent être proposées dès le début de la commande.
Cette décision remplace la séquence de collecte de l'ADR-0011. Elle complète
l'ADR-0007 pour les clients et le paiement iOS, sans ouvrir la génération,
l'envoi de photos, le courriel ou les paiements réels.

## Contexte

Le site possède un carnet Japon public et des outils de préparation locaux.
Son Worker contient déjà les composants du futur service personnalisé. Une
application iOS doit réutiliser ce service, conserver un carnet consultable
hors ligne et proposer une expérience adaptée à l'iPhone.

L'offre cible est un achat ponctuel d'environ 30 euros par voyage, pour le
groupe. Le prix affiché au moment de l'achat viendra de StoreKit. Les pilotes
gratuits et la mesure du coût complet précèdent l'ouverture commerciale.

## Décision

### SwiftUI et backend partagé

L'application utilise SwiftUI avec iOS 18 comme version minimale. Navigation,
formulaires, sélection de photos et partage utilisent les composants Apple.
Elle ne remplace pas le produit par une WebView. Le système adapte les
contrôles et leur apparence à la version d'iOS.

Le site et l'application utilisent le même Worker, D1, R2 et Workflows. Le
backend valide les commandes et les droits d'achat, protège les secrets,
applique les quotas et termine les traitements après la fermeture de l'app.
L'application gère l'interface, la préparation locale et la lecture du carnet.
Aucune clé OpenAI, Cloudflare, Booking ou Amazon ne réside dans le bundle.

Le préfixe `/api/v1` versionne le contrat commun. `TravelGuideV1` demeure la
source du carnet. Le client reçoit une projection de lecture qui exclut les
champs de contrôle réservés au modèle d'image. Le site et l'app ne possèdent
pas deux catalogues éditoriaux maintenus à la main.

Le candidat ajoute une configuration versionnée et un exemple public. Les
anciennes routes restent compatibles. Il ne crée aucun moyen de contourner
les protections de création existantes. Une réponse de configuration annonce
une capacité, mais ne remplace jamais sa validation au moment de l'action.

### Photos facultatives dès la première étape

La commande propose immédiatement d'ajouter une à quatre photos des voyageurs.
Continuer sans photo doit rester aussi simple. Le choix des images précède la
proposition de voyage, conformément à la demande du propriétaire.

Dans le candidat local, PhotosPicker importe seulement la sélection. L'app
réencode les images et garde ses copies en mémoire. Le brouillon enregistré
n'inclut ni fichier, ni miniature, ni référence à la photothèque. Les photos
peuvent être retirées avant la fin de la préparation. Aucune sélection ne vaut
autorisation d'envoi à un fournisseur.

Dans le service cible, le récapitulatif explique le traitement par OpenAI, la
nature synthétique des illustrations, les droits des personnes représentées
et les durées. L'envoi nécessite une action explicite et les contrôles serveur
ouverts. Les sources entrent dans R2 privé seulement à ce moment, puis sont
supprimées après traitement, au plus tard sous 24 heures. Les illustrations
restent signalées comme synthétiques.

La proposition et ses ajustements restent distincts de la production des
illustrations. Le backend doit éviter de générer à nouveau toutes les images
pour une correction de texte. L'intégration dynamique de `TravelGuideV1`, les
états intermédiaires et les quotas par image restent à terminer.

### Achat StoreKit 2

L'achat iOS porte sur un droit à créer un voyage. La commande, le droit
d'achat et le carnet livré constituent des états distincts côté serveur. Une
transaction réussie suivie d'un échec de génération doit pouvoir reprendre
sans nouvel achat. Le serveur doit empêcher la consommation répétée d'une
même transaction.

L'achat reste fermé tant que le backend n'annonce pas à la fois la création
native disponible et StoreKit prêt. La présence d'un produit App Store ne
suffit pas. Le serveur doit ensuite vérifier la transaction signée, son
environnement, son produit et son association à la commande. Il conserve une
trace idempotente et traite les remboursements. L'app ne décide jamais seule
qu'un voyage est payé.

Cette tranche ne provisionne aucun produit App Store Connect et ne vérifie
aucune transaction réelle. Le mécanisme d'identité et de récupération d'un
carnet payé sur un autre appareil reste à décider avant l'activation. Une
restauration StoreKit seule ne reconstitue pas le contenu d'un voyage.

Turnstile reste obligatoire pour le parcours web gratuit existant. L'app ne
doit ni fabriquer des en-têtes d'origine, ni enlever Turnstile des routes
historiques. L'admission d'une commande native et ses protections contre
l'abus nécessitent un contrat serveur distinct avant ouverture.

### Conservation et partenaires

Le contrat actuel expire les voyages personnalisés sous 30 jours. Cette durée
ne convient pas à une commande payée plusieurs mois avant le départ. Avant
vente, une décision doit fixer la conservation couvrant le séjour, la
récupération et l'export, puis modifier le schéma, la purge et la notice
ensemble. Cette ADR ne prolonge aucune durée serveur.

Booking reste en mode `external`. Sans accord et accès partenaire, le produit
n'annonce ni prix actuel, ni chambre disponible, ni réservation. L'API Demand
requiert un contrat partenaire et son approbation propre.

Les conseils d'équipement peuvent former une rubrique gratuite. L'affiliation
Amazon attend une app gratuite au téléchargement, approuvée, et des liens
accessibles sans achat du carnet,
selon la politique mobile du programme concerné. Aucun lien affilié ou revenu
de commission n'est considéré comme acquis par cette décision.

Le programme App Store Small Business fait l'objet d'une démarche ultérieure
du titulaire du compte. Son inscription et l'acceptation des conditions ne
sont pas réalisées par cette tranche.

## Vérification et livraison

Le candidat doit être construit et testé dans Xcode, puis inspecté sur
simulateur. Les tests vérifient notamment la projection commune, la
persistance volontaire du brouillon, l'exclusion des photos, les erreurs de
configuration et la fermeture des achats. `./scripts/verify.sh` reste requis
pour le Worker et le site.

`STATUS.md` et `DELIVERY-EVIDENCE.md` nomment séparément le code validé, la CI,
le simulateur, un éventuel appareil physique, la signature et la publication.
Un build simulateur ne constitue ni un achat testé, ni une livraison TestFlight,
ni une publication App Store.

## Retour arrière

Retirer le client iOS et les routes publiques versionnées par un commit inverse,
en conservant les routes web historiques. Aucun voyage utilisateur, secret ou
transaction ne doit être supprimé par ce retour du candidat. Avant une future
publication App Store, documenter la durée de compatibilité des versions iOS
déjà installées.

## Références

- [ADR-0007, runtime Cloudflare](adr-0007-runtime-et-production-cloudflare.md)
- [ADR-0011, contrat du guide](adr-0011-contrat-guide-voyage-et-plan-images.md)
- [Guide du client iOS](../native-ios.md)
- [Apple, StoreKit](https://developer.apple.com/documentation/storekit)
- [Apple, règles de validation](https://developer.apple.com/app-store/review/guidelines/)
- [Apple, Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Booking, accès à Demand](https://developers.booking.com/demand/docs/getting-started/prerequisites)
- [Amazon France, politiques du programme](https://partenaires.amazon.fr/help/operating/policies)
