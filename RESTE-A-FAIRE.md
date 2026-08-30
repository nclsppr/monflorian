# Gates de la migration Cloudflare

Dernière mise à jour : 2026-08-30.

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
- [x] Compiler les consignes d'image depuis des champs bornés avec le profil
  `fuji-editorial-v1`, sans prompt libre fourni au modèle d'image.
- [ ] Tester le schéma, les relations entre journées, chapitres, nuits et images.
- [ ] Tester le compilateur avec des URL, du HTML, des pseudo-instructions et
  des valeurs hors limites.
- [ ] Fixer les plafonds de réponse et de stockage avant intégration : le carnet
  Japon minifié mesure environ 58 Ko, au-dessus de la limite courante de
  32 768 octets.
- [ ] Remplacer le contrat d'itinéraire courant dans le Workflow et l'OpenAPI.
- [ ] Définir un `FactPack` sourcé et daté pour les faits volatils avant de les
  présenter comme vérifiés dans un guide.
- [ ] Générer plusieurs images sans retry aveugle, avec un plafond de coût.

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

## Reporté

- Affiliation Booking.com tant qu'aucun partenariat ni lien n'est approuvé.
- Stripe, fiscalité, remboursements et webhooks réels après validation du MVP
  gratuit.
- Compte client, historique long, PDF, partage public et Voyage vivant.

L'ancien environnement Atlas reste hors de cette migration. Son retrait ou ses
secrets relèvent d'une tâche séparée explicitement autorisée.
