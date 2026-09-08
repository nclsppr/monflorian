# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Mon Florian prépare un voyage, montre les voyageurs dans les destinations sous
forme d'images éditoriales cohérentes, conserve une page privée et l'envoie par
courriel. Le site et l'app SwiftUI partagent le même backend. Les photos
facultatives sont proposées dès la première étape de commande, conformément à
l'ADR-0013. Les pilotes sont gratuits ; l'offre cible est un achat ponctuel
d'environ 30 euros par voyage pour le groupe. Booking affilié, Amazon et les
paiements réels viennent après la preuve du parcours et leurs accords propres.

## Principes de séquencement

- Un seul backend Cloudflare et un contrat `/api/v1` commun aux clients web et iOS.
- Une distribution iOS distincte, avec preuves de build, simulateur, signature et publication.
- Photos facultatives dès la première étape, gardées localement avant envoi consenti.
- Aucun envoi de photo réelle avant R2 privé, rétention et suppression prouvées.
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
| 3d | F03-IOS | Client SwiftUI et API commune | in_progress | app native et contrat commun validés localement et en CI, distribution Apple séparée |
| 4 | F04 | Stockage privé et cycle de vie | in_progress | R2 UE, chiffrement, jetons et purge prouvés |
| 5 | F05 | Génération synthétique asynchrone | in_progress | texte, images, quotas, reprise et coûts observés |
| 6 | F06 | Page privée et courriel | in_progress | rendu, suppression, notification et notice validés |
| 7 | F07 | Domaine Cloudflare | done | web, DNS d'envoi, apex, `www`, TLS et release vérifiés |
| 8 | F08 | MVP gratuit limité | planned | Turnstile, budget et premier utilisateur informé |
| 9 | F09 | Attribution Booking.com | blocked | partenariat et liens approuvés |
| 9b | F09-AMAZON | Conseils équipement et affiliation | blocked | rubrique gratuite, app approuvée et liens autorisés |
| 10 | F10-IOS | Achat ponctuel StoreKit 2 | planned | transaction vérifiée côté serveur, reprise, remboursements et sandbox complet |
| 10b | F10 | Paiement Stripe web | planned | Checkout, webhook signé, fiscalité et remboursement décidés |
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

## F03-IOS, client SwiftUI et API commune

L'ADR-0013 autorise un client iOS 18 et versions suivantes dans le même dépôt.
Le candidat rend le carnet Japon en SwiftUI, prépare un brouillon local et
propose les photos facultatives dès la première étape. Leur sélection reste en
mémoire et n'entre pas dans le brouillon enregistré.

- Versionner `/api/v1` sans supprimer les routes web historiques.
- Distribuer la projection publique du même `TravelGuideV1` aux deux clients.
- Garder l'exemple accessible hors ligne et les erreurs réseau explicites.
- Construire et tester l'app, puis contrôler les écrans sur simulateur.
- Garder `nativeOrdersEnabled` et `storeKitPurchasesEnabled` à `false` jusqu'à
  l'intégration complète de la commande et du paiement serveur.
- Vérifier que le client ne transmet aucune photo ou demande et ne contourne
  pas Turnstile.

Cette phase prépare le produit natif. Elle ne termine pas F04, F05 ou F06 et
ne constitue pas une distribution TestFlight ou App Store.

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
- Expirer le voyage sous 30 jours dans le pilote et offrir une suppression anticipée.
- Décider et migrer une conservation couvrant le séjour avant de vendre un carnet payé.
- Prouver la purge avec des objets et données synthétiques.

## F05, génération synthétique asynchrone

Le quota transactionnel, les étapes Responses et Image Edits sans retry, le
stockage R2 et la lecture privée de l'image sont codés. La phase reste ouverte :
Turnstile est configuré, mais la clé OpenAI n'est pas installée sur le Worker,
les drapeaux sont à `false` et aucun coût fournisseur n'a été engagé.

La fixture canonique `TravelGuideV1` alimente statiquement le carnet
Japon, historiquement sous `/v2` et sous `/carnets/japon-10-jours` dans le
site livré par F03-SITE, sans appel fournisseur. Le schéma, le validateur et le
compilateur restent séparés du contrat OpenAI courant et du Workflow jusqu'à
l'ajout des tests reportés et l'adaptation des quotas multi-images.

L'adaptateur borne le JSON itinéraire extrait à 131 072 octets, à l'intérieur
d'une enveloppe fournisseur limitée à 512 000 octets. Le budget Responses passe
à 32 000 tokens de sortie afin de laisser de la marge au guide Japon de
référence et aux tokens non visibles comptés dans cette limite. Ces plafonds ne rendent pas l'intégration
dynamique active et doivent encore être mesurés sur plusieurs durées.

- Vérifier Turnstile avant création.
- Débiter les quotas D1 de façon atomique.
- Démarrer une seule instance Workflow par voyage.
- Appeler Responses avec `store: false`, schéma strict et plafond de sortie.
- Remplacer le contrat courant par `TravelGuideV1` après validation de la
  fixture Japon, mesure du volume et couverture des invariants métier.
- Appeler Image Edits depuis des clés R2 validées.
- Compiler chaque consigne d'image depuis le profil serveur et un plan typé,
  sans transmettre le brief brut ni un prompt libre produit par Responses.
- Ne pas relancer automatiquement un appel payant si son résultat est inconnu.
- Stocker les identifiants techniques et l'usage sans contenu.
- Exécuter un seul voyage synthétique avec son plan d'images borné, puis
  inspecter coût, volume et logs.

Un test avec fake ne termine pas cette phase.

## F06, page privée et courriel

Le domaine Cloudflare Email Service est actif et le binding restreint à
`voyage@monflorian.com` est déployé derrière
`MONFLORIAN_EMAIL_ENABLED=false`. La notice publique explique les traitements,
les destinataires, les durées et le retrait anticipé. Aucun courriel n'a encore
été envoyé et le canal complémentaire de droits reste à ouvrir.

- Rendre `/voyages/{jeton}` depuis D1 et R2 avec `noindex` et `no-store`.
- Ne pas enregistrer une copie HTML par voyage ; utiliser le template commun.
- Envoyer un lien privé, jamais les photos ou le brief complet dans le courriel.
- Chiffrer puis supprimer l'adresse après envoi réussi.
- Fournir statut, reprise d'envoi et suppression.
- Publier la notice et le canal de droits avant un utilisateur réel.

## F07, domaine Cloudflare

- L'ancienne zone OVHcloud a été relevée avant mutation.
- Les anciens MX, SPF et DMARC inutilisés n'ont pas été recréés. L'ADR-0009
  ajoute seulement les DNS propres à l'envoi transactionnel Cloudflare.
- Le Worker porte l'apex et `www` comme Custom Domains.
- Les anciennes valeurs A web restent consignées pour un rollback explicite.
- DNS public, TLS, page, configuration et release ont été sondés après
  propagation.

## F08, MVP gratuit limité

- Limite quotidienne globale et par client.
- Turnstile visible et erreurs compréhensibles.
- Budget OpenAI et alerte de coût.
- Consentement photo et durée de rétention visibles.
- Premier parcours humain volontaire, limité et supprimable.

## F09, attribution Booking.com

Le mode `external` reste la valeur par défaut. `cj-static` exige un partenariat
accepté, des liens approuvés, une liste d'hôtes et la mention commerciale près de
chaque lien. Aucune affiliation n'est déduite d'une URL trouvée en ligne.

## F09-AMAZON, conseils équipement

La rubrique d'équipement doit être accessible gratuitement. Les liens affiliés
attendent l'approbation de l'app par Amazon et les conditions du programme
concerné. Le carnet ne présente aucune recommandation comme nécessaire sans
expliquer son usage. L'affiliation ne détermine pas le classement des conseils.

## F10-IOS, achat ponctuel StoreKit 2

La cible est un achat par voyage pour tout le groupe. Le backend associe une
transaction vérifiée à une commande et n'autorise qu'une seule consommation du
droit. Il doit reprendre une génération échouée sans nouvel achat et traiter
remboursements, interruption de l'app et récupération sur un autre appareil.
Le prix affiché vient de StoreKit, avec sa devise et sa localisation.

- Configurer le produit App Store Connect et la signature avec le titulaire.
- Définir identité, récupération du carnet et conservation après paiement.
- Vérifier la transaction côté serveur et son environnement.
- Prouver les cas de reprise, doublon, achat en attente et remboursement.
- Mesurer coût complet et marge avant activation.
- Terminer un parcours sandbox puis décider l'ouverture réelle.

L'inscription Small Business reste une démarche ultérieure du titulaire. Elle
ne remplace aucun contrôle de paiement ou de génération.

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
