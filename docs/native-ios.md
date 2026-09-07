# Client iOS natif

Le client SwiftUI est un candidat local pour iOS 18 et versions suivantes.
L'[ADR-0013](decisions/adr-0013-ios-natif-et-api-commune.md) fixe son contrat.
Les preuves de construction et d'exécution vivent dans
[`DELIVERY-EVIDENCE.md`](../DELIVERY-EVIDENCE.md).

## Sources et construction

Le projet Xcode vit sous `ios/MonFlorian.xcodeproj`. Les scripts à la racine
préparent et vérifient le client :

| Commande | Rôle |
| --- | --- |
| `node scripts/generate-api-clients.mjs` | Régénérer les chemins JavaScript et les types de configuration Swift depuis OpenAPI |
| `python3 scripts/ios-generate.py` | Générer le projet, la projection de lecture et les ressources depuis les sources canoniques |
| `./scripts/ios-build.sh` | Construire l'application pour le simulateur |
| `./scripts/ios-test.sh` | Exécuter les tests iOS |
| `./scripts/ios-photo-contract.sh` | Vérifier sur macOS le PNG réencodé avec le validateur photo du backend |
| `./scripts/verify.sh` | Vérifier le site, le Worker, les contrats et la documentation |

Après modification d'OpenAPI, régénérer les clients et vérifier leur cohérence
avec `node scripts/generate-api-clients.mjs --check`. Les types Swift dérivés
se trouvent sous `ios/MonFlorian/Generated/`.

Le contrôle `ios:photo-check`, équivalent au script de contrat photo ci-dessus,
requiert macOS et Xcode. Il vérifie les limites et le retrait des métadonnées
sur une image synthétique, puis fait accepter la sortie par le validateur du
backend. Il ne transmet aucune image au service.

Les résultats Xcode sont conservés sous `build/ios/`. Le projet généré et les
ressources dérivées ne doivent pas diverger des sources canoniques. Les images
viennent du catalogue existant de [`ASSETS.md`](../ASSETS.md). Aucun nouveau
visage ou visuel de voyage n'est généré pour ce candidat.

## Parcours disponible dans le candidat

Le carnet Japon fournit un exemple natif consultable hors ligne. Le formulaire
prépare un voyage sans envoyer la demande. Dès sa première étape, la personne
peut sélectionner jusqu'à quatre photos ou continuer sans photo.

Le brouillon textuel se conserve seulement à la demande de la personne. Son
fichier utilise la protection complète iOS et est exclu des sauvegardes. Il
peut être repris, effacé et exporté en texte. Les photos réencodées restent en
mémoire et ne font pas partie de cette sauvegarde. Une reprise du brouillon
demande donc de les sélectionner de nouveau. La checklist conserve ses cases
localement à chaque modification, avec une explication visible.

La configuration et l'exemple public viennent de `/api/v1`. L'exemple
embarqué permet la lecture en absence de réseau. Une ancienne API qui répond
`404` à la configuration versionnée peut être relue par son chemin historique.
Une erreur réseau ou serveur ne doit pas être masquée comme une activation du
service.

La configuration versionnée ajoute `apiVersion: "v1"` et les capacités
`nativeOrdersEnabled` et `storeKitPurchasesEnabled`, toutes deux à `false`.
Les capacités héritées du web, dont `photoUploadEnabled`, n'autorisent pas à
elles seules une commande native. Les routes sont décrites dans le contrat
`docs/api/openapi.json` à la racine du dépôt.

Le site et le client utilisent la même fixture `TravelGuideV1`. La projection
publique retire les paramètres du plan d'images réservés au serveur. Les
liens Booking restent des recherches externes à vérifier.

## Commande personnalisée encore fermée

Le candidat n'envoie ni brief, ni photo, ni consentement à l'IA. Il n'appelle
pas OpenAI et ne crée pas de voyage privé. Le carnet Japon reste un exemple
fictif, même après avoir rempli le formulaire.

StoreKit 2 prépare la lecture du produit et le futur achat, mais les capacités
serveur ferment le passage en caisse. Le prix cible d'environ 30 euros ne vaut
pas offre disponible. Le prix facturé sera celui du produit StoreKit localisé.

Les contrôles serveur doivent rester déterminants après ouverture. L'app
n'embarque aucun secret et n'essaie pas de passer les routes web protégées par
Turnstile avec un faux contexte navigateur.

## Préparation de la distribution

Avant TestFlight ou l'App Store, le titulaire du compte doit disposer de son
équipe Apple Developer, d'un identifiant de bundle attribué et d'une fiche App
Store Connect. Signature, produit d'achat, informations de confidentialité,
support et captures doivent décrire les comportements effectivement ouverts.

Avant un premier achat, terminer la vérification serveur StoreKit, les
notifications et remboursements, la récupération d'un carnet après
réinstallation et le parcours d'échec sans double paiement. Une preuve
sandbox doit couvrir la commande et la génération ensemble.

La collecte facultative de photos dès la commande demande une information
claire avant envoi, le choix de continuer sans photo et les contrôles de
suppression décrits dans [`DATA-PROCESSING.md`](../DATA-PROCESSING.md).
Revoir la conservation du carnet payé avant de conserver un voyage au-delà
des 30 jours actuels. Les affiliations Booking et Amazon nécessitent leurs
accords propres.

L'inscription Small Business est prévue plus tard avec le titulaire. La
présence d'un projet Xcode ne prouve ni inscription, ni acceptation, ni taux
de commission appliqué.
