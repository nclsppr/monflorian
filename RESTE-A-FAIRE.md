# Gates de la migration Cloudflare

Dernière mise à jour : 2026-09-08.

## Acquis

- [x] Worker TypeScript et Static Assets déployés sur `workers.dev`.
- [x] Générations texte et image fermées en configuration et dans le code.
- [x] D1 créé en juridiction UE et migration initiale appliquée.
- [x] Bucket R2 privé créé en juridiction UE, sans domaine public, avec règles
  d'expiration à 24 heures et 30 jours.
- [x] Secrets de chiffrement et de pseudonymisation installés sans valeur dans
  Git ni dans les preuves.
- [x] Workflow `monflorian-trip` déployé avec garde-fou fermé.
- [x] Chaîne OCI et contrats Atlas retirés du chemin de livraison du dépôt.
- [x] ADR-0007 acceptée.

## Livraison Cloudflare encore à automatiser

- [ ] Relier le dépôt à Workers Builds ou installer un jeton GitHub limité au
  déploiement du Worker.
- [x] Domaine, apex, `www`, TLS et absence de réception humaine vérifiés.

## Avant la première génération synthétique

### Contrat TravelGuideV1 avant intégration

- [x] Versionner le contrat JSON candidat et le carnet Japon de référence.
- [x] Alimenter statiquement le carnet Japon de `/v2` depuis la fixture
  canonique, sans appel fournisseur.
- [x] Compiler les consignes d'image depuis des champs bornés avec le profil
  `fuji-editorial-v1`, sans prompt libre fourni au modèle d'image.
- [ ] Tester le schéma, les relations entre journées, chapitres, nuits et images.
- [ ] Tester le compilateur avec des URL, du HTML, des pseudo-instructions et
  des valeurs hors limites.
- [x] Borner le JSON itinéraire extrait à 131 072 octets derrière l'enveloppe
  fournisseur de 512 000 octets, avec 32 000 tokens de sortie au maximum.
- [ ] Mesurer les volumes sur 3, 7, 10 et 14 jours, puis dimensionner le stockage
  et les quotas avant l'intégration dynamique.
- [ ] Séparer dans le contrat les correspondances d'un transfert et ses modes
  alternatifs, au lieu d'utiliser une seule liste `modes` ambiguë.
- [ ] Remplacer le contrat d'itinéraire courant dans le Workflow et l'OpenAPI.
- [ ] Introduire dans D1 et le Workflow les états `proposal_pending`,
  `proposal_ready`, `illustration_pending` et `ready`, puis séparer la génération
  du guide de la production des illustrations. Le choix facultatif des
  portraits intervient dès la commande selon l'ADR-0013.
- [ ] Définir un `FactPack` sourcé et daté pour les faits volatils avant de les
  présenter comme vérifiés dans un guide.

### Régressions V2 reportées

- [ ] Ajouter des parcours navigateur sur Chrome, Firefox et Safari mobile pour
  l'introduction, l'en-tête, le téléphone, les trois étapes et le carnet Japon.
- [ ] Couvrir au clavier les dialogues de partage, l'erreur de mot de passe et
  les accordéons du guide, avec restitution du focus à la fermeture.
- [ ] Mesurer LCP, CLS et poids transféré sur la page d'accueil et le carnet,
  puis décider si le carnet et les dialogues doivent être chargés à la demande.
- [ ] Générer plusieurs images sans retry aveugle, avec un plafond de coût.

### Suite de l'audit V2 après la démonstration

- [ ] Ajouter saison ou dates, départ, budget, transport, intérêts et
  contraintes par divulgation progressive quand le moteur consommera réellement
  ces réponses.
- [ ] Intégrer les photos facultatives dès la première étape du parcours
  personnalisé web et iOS, avec finalité, destinataire et rétention visibles
  avant envoi. La sélection iOS candidate reste locale.
- [ ] Permettre d'alléger, remplacer, décaler ou conserver une journée depuis
  un carnet réellement persistant.
- [ ] Remplacer la simulation de partage par un jeton serveur révocable, limité
  en tentatives, expirant et servi sans cache avant toute donnée personnelle.
- [ ] Créer des pages d'exemples publiques, prérendues et indexables avec leurs
  propres métadonnées, sans ouvrir les carnets privés à l'indexation.
- [ ] Instrumenter les étapes du parcours seulement après décision sur la
  mesure, le consentement et la durée de conservation.
- [ ] Afficher un prix uniquement quand le périmètre, le paiement, les délais,
  les modifications et les remboursements seront décidés et livrables.

- [x] Écrire les photos validées dans R2 avant de démarrer le Workflow, avec la
  création toujours fermée.
- [x] Chiffrer le brief et l'adresse de courriel stockés dans D1.
- [x] Porter l'adaptateur OpenAI dans les étapes Workflow sans retry aveugle,
  derrière les drapeaux fermés.
- [x] Rendre les états de la page privée depuis D1 avec un jeton haché.
- [x] Installer les secrets de chiffrement hors Git.
- [x] Servir l'illustration privée depuis R2 après génération, avec un jeton
  valide et sans cache.
- [ ] Installer et appeler OpenAI depuis le Workflow.
- [x] Ajouter les quotas D1 persistants et atomiques.
- [x] Créer Turnstile et installer son secret.
- [x] Choisir Cloudflare Email Service, activer le domaine et câbler son binding.
- [ ] Prouver le nettoyage des photos sous 24 heures et des voyages sous 30
  jours.
- [ ] Exécuter un seul parcours synthétique texte et image, puis inspecter les
  coûts et les logs.
- [ ] Envoyer un seul courriel synthétique et inspecter livraison, bounce et
  suppression de l'adresse chiffrée.

## Avant une personne réelle

- [x] Publier la notice de traitement et la suppression anticipée.
- [ ] Publier un canal de droits complémentaire au retrait depuis le lien privé.
- [ ] Vérifier les réglages de rétention du projet OpenAI utilisé.
- [ ] Tester le consentement, le retrait et le lien privé avec des données sans
  identité réelle.
- [ ] Définir un budget et une limite quotidienne du MVP gratuit.

## Avant une commande iOS payée

L'ADR-0013 prépare le client natif et l'API commune. La génération et l'achat
restent fermés tant que les gates précédentes et les points suivants ne sont
pas terminés.

- [ ] Définir l'identité et la récupération du carnet après réinstallation ou
  changement d'appareil.
- [ ] Décider une conservation couvrant le séjour, puis modifier la purge et
  la notice avant une durée supérieure à 30 jours.
- [ ] Configurer l'équipe Apple Developer, la signature et le produit App Store
  Connect avec le titulaire.
- [ ] Vérifier la transaction StoreKit côté serveur et associer une seule
  consommation du droit à une commande durable.
- [ ] Traiter les notifications et remboursements ; prouver la reprise d'un
  échec de génération sans nouvel achat.
- [ ] Définir les protections d'admission native sans contourner Turnstile sur
  les routes web historiques.
- [ ] Mesurer les coûts texte, images et reprises avant le prix de vente final.
- [ ] Tester le parcours complet en sandbox avant l'ouverture commerciale.
- [ ] Préparer les déclarations App Store, le support et les preuves appareil.
- [ ] Examiner l'inscription Small Business avec le titulaire du compte.

## Reporté

- Affiliation Booking.com tant qu'aucun partenariat ni lien n'est approuvé.
- Affiliation Amazon jusqu'à l'approbation de l'app gratuite et des liens
  accessibles sans achat du carnet.
- Stripe, fiscalité, remboursements et webhooks réels après validation du MVP
  gratuit.
- Compte client, historique long, PDF, partage public et Voyage vivant.

L'ancien environnement Atlas reste hors de cette migration. Son retrait ou ses
secrets relèvent d'une tâche séparée explicitement autorisée.
