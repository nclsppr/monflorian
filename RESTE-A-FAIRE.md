# Gates de la bêta gratuite

Dernière mise à jour : 2026-10-02. Candidat décrit par l'ADR-0013 ; une case
reste ouverte tant que la preuve correspondante n'est pas consignée.

## Socle déjà livré

- [x] Worker et Static Assets sur l'apex, `www` et `workers.dev`.
- [x] D1 en juridiction UE, secrets de chiffrement et quotas persistants.
- [x] R2 privé UE et règle de secours des sources à 24 heures.
- [x] Workflow déployé derrière des drapeaux d'activation fermés.
- [x] Turnstile configuré et secret installé.
- [x] Domaine Cloudflare Email Service configuré et binding d'envoi restreint.
- [x] Carnet Japon et guides publics, pré-rendus et lisibles sans JavaScript.

Ces preuves historiques ne valident pas la génération réelle ni les nouvelles
durées. L'ancien délai R2 de 30 jours pour les résultats doit changer avant
d'accepter un voyage conservé plus longtemps.

## Candidat à valider

- [ ] Formulaire relié à `/api/trips` avec destination, départ, dates ou durée,
  budget, transport et style d'hébergement effectivement consommés.
- [ ] Bêta gratuite sans carte ni paywall, paiement annoncé après la bêta sans
  ancien prix présenté comme acquis.
- [ ] Photos facultatives, réencodées, prévisualisées localement et transmises
  seulement à l'envoi explicite avec accord des personnes représentées.
- [ ] Courriel facultatif et accès au lien privé sans compte.
- [ ] Recherche web distincte, sources réellement retournées, recherche
  chiffrée et carnet `itinerary.v2` revalidé.
- [ ] Hôtels nommés sourcés, liens Booking construits par le serveur et absence
  de promesse de meilleur prix ou de disponibilité.
- [ ] Respect du transport `none`, des dates, des nuits et de la durée 1 à
  14 jours ; refus de dates passées ou de retour à plus de 173 jours.
- [ ] Une illustration facultative, erreur visible et texte conservé si elle
  échoue ; aucune relance payante aveugle.
- [ ] Alias `/api/v1` alignés avec les routes canoniques et leurs protections.
- [ ] Contrôles `./scripts/verify.sh`, clavier, mobile, bureau et erreurs du
  parcours visibles.

## Avant l'activation distante

- [ ] Installer la clé OpenAI dédiée hors Git et vérifier accès aux modèles,
  réglages de données, budget et limite quotidienne.
- [ ] Appliquer `0004_trip_research.sql` et vérifier l'état distant D1.
- [ ] Porter la règle R2 des résultats à 180 jours, garder les sources à
  24 heures et confirmer l'absence de domaine public.
- [ ] Prouver la purge à l'échéance exacte : maximum entre création + 30 jours
  et retour + 7 jours, plafonné à 180 jours.
- [ ] Prouver le retrait anticipé pendant la recherche, la génération et
  l'envoi d'image ; aucun résultat tardif ne recrée le voyage supprimé.
- [ ] Vérifier la notice publiée, le consentement et le canal de droits.
- [ ] Vérifier Turnstile de bout en bout, quotas, doublons et concurrence.

## Preuves du parcours complet

- [ ] Tokyo à deux début novembre : départ, dates, budget, rythme et recherche
  aérienne utilisés, hôtels sourcés, jours cohérents et lien privé lisible.
- [ ] Luxembourg : une nuit dans un hôtel luxueux, courte randonnée, départ
  proche et aucun vol proposé avec le choix sans transport.
- [ ] Création sans photo ni courriel et lecture du résultat sur le lien privé.
- [ ] Création contrôlée avec références fictives, image visible et sources
  photo supprimées ; noter le coût fournisseur et la durée observée.
- [ ] Notification demandée : un message autorisé reçu, adresse chiffrée
  supprimée et distinction entre livraison, bounce et envoi incertain.
- [ ] Consultation et média refusés après suppression et expiration.
- [ ] Aucun brief, photo, courriel, jeton ou résultat dans les logs.
- [ ] SHA poussé, PR et CI validées, version Worker identifiée, sondes sur les
  origines publiques et contrôle visible après publication.

## Après la bêta

- Paiement Stripe, prix, fiscalité, remboursement et support avant mode réel.
- Affiliation Booking seulement après partenariat et liens approuvés.
- Inventaire de tarifs et disponibilités seulement avec une intégration dédiée.
- Modification du carnet, illustrations multiples, compte, historique long,
  PDF produit par le service et Voyage vivant après preuve du besoin.
- Resend seulement si le courriel Cloudflare ne répond pas au besoin observé.
- Workers Builds ou jeton GitHub restreint pour automatiser les publications.

L'ancien Atlas reste hors du runtime. Aucun secret n'y est déployé, modifié ou
révoqué dans cette tranche.
