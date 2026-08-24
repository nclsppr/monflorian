# Gates de la migration Cloudflare

Dernière mise à jour : 2026-08-24.

## Acquis

- [x] Worker TypeScript et Static Assets déployés sur `workers.dev`.
- [x] Générations texte et image fermées en configuration et dans le code.
- [x] D1 créé en juridiction UE et migration initiale appliquée.
- [x] Workflow `monflorian-trip` déployé avec garde-fou fermé.
- [x] Chaîne OCI et contrats Atlas retirés du chemin de livraison du dépôt.
- [x] ADR-0007 acceptée.

## Avant de déplacer le domaine

- [ ] Activer R2 dans le compte Cloudflare puis créer un bucket privé en
  juridiction UE.
- [ ] Relier le dépôt à Workers Builds ou installer un jeton GitHub limité au
  déploiement du Worker.
- [ ] Ajouter la zone `monflorian.com` à Cloudflare et recopier tous les
  enregistrements existants.
- [ ] Vérifier en particulier les trois MX OVHcloud, le SPF et les autres TXT.
- [ ] Tester l'apex et `www` sur Cloudflare avant le changement de serveurs de
  noms.
- [ ] Conserver le relevé DNS précédent et le délai de rollback.

## Avant la première génération synthétique

- [ ] Écrire les photos dans R2 avant de démarrer le Workflow.
- [ ] Chiffrer le brief et l'adresse de courriel stockés dans D1.
- [ ] Porter l'adaptateur OpenAI dans les étapes Workflow sans retry aveugle.
- [ ] Rendre la page privée depuis D1 et R2 avec un jeton haché.
- [ ] Installer les secrets OpenAI et de chiffrement hors Git.
- [ ] Ajouter Turnstile et les quotas persistants.
- [ ] Choisir et configurer le fournisseur de courriel transactionnel.
- [ ] Prouver le nettoyage des photos sous 24 heures et des voyages sous 30
  jours.
- [ ] Exécuter un seul parcours synthétique texte et image, puis inspecter les
  coûts et les logs.

## Avant une personne réelle

- [ ] Publier la notice de traitement, le canal de droits et la suppression
  anticipée.
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
