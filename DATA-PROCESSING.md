# Traitement des données

Ce contrat décrit le candidat Mon Florian au 2026-08-23. Il ne constitue pas une déclaration de conformité juridique. Le propriétaire doit valider les rôles, la base légale, les transferts et le canal de droits avant une ouverture publique ou un test avec des personnes qui ne participent pas au développement.

## Périmètre

Le service ne possède ni compte, ni base de données, ni stockage d'objet, ni volume utilisateur. Il traite les données pendant une requête puis les renvoie au navigateur. L'absence de persistance Mon Florian ne supprime pas les traitements et journaux possibles des fournisseurs.

## Catégories et finalités

| Catégorie | Exemples | Finalité | Obligatoire | Sensibilité |
| --- | --- | --- | --- | --- |
| Brief de voyage | Destination souhaitée, intérêts, contraintes racontées librement | Composer une proposition | Oui pour l'itinéraire | Peut contenir une donnée personnelle ou sensible saisie librement |
| Paramètres du séjour | Dates, nombre de voyageurs, rythme | Borner la durée et adapter le parcours | Voyageurs et rythme oui, dates facultatives | Donnée de contexte personnel |
| Adresse réseau | Adresse vue par le serveur | Limiter l'abus et dériver un identifiant de sûreté | Technique | Identifiant en ligne |
| Photos | Visages et apparence des voyageurs | Créer une projection dessinée | Facultatif | Donnée personnelle. Aucune identification biométrique n'est mise en oeuvre |
| Description de scène | Destination et moment à illustrer | Diriger l'illustration | Oui pour l'image | Peut révéler un projet de déplacement |
| Résultats générés | Itinéraire, alternatives, dessin | Afficher la proposition | Produit par le service | Peut reprendre des éléments personnels du brief ou des photos |
| Journaux techniques | Date, identifiant de requête, route, statut, code d'erreur, durée | Diagnostic et sécurité | Technique | Ne doit pas contenir de contenu utilisateur |
| Navigation externe | Destination, dates, voyageurs et paramètres affiliés dans le lien | Ouvrir une recherche d'hébergement | Facultatif, au clic | Transmise au site externe choisi |

Ne saisis pas dans le brief un diagnostic médical, un document d'identité, une adresse privée, un moyen de paiement, un secret ou une information dont le voyage n'a pas besoin.

## Destinataires et flux

### Navigateur Mon Florian

Le navigateur conserve le formulaire, les prévisualisations, l'itinéraire et l'image dans la mémoire de la page. L'application ne doit pas utiliser `localStorage`, `IndexedDB`, Cache Storage ou un service worker pour ces données. Un rechargement ou la fermeture de l'onglet perd le résultat.

Avant l'envoi d'une photo, le navigateur la décode puis la réencode en PNG ou WebP. Ce passage retire les métadonnées que le navigateur ne retranscrit pas. Le serveur vérifie aussi la signature, le format, les dimensions, le poids et plusieurs blocs de métadonnées connus. Ces contrôles ne remplacent pas une revue des droits et du contenu.

### Serveur Mon Florian

Le serveur traite les données en mémoire pendant la requête. Il ne les écrit ni dans un fichier, ni dans une base, ni dans un cache. Node.js libère la mémoire quand les références deviennent inaccessibles, sans garantir une heure précise d'effacement au niveau physique.

Le serveur limite :

- le brief à 2 000 caractères ;
- le voyage à 14 jours et 8 voyageurs ;
- l'illustration à 4 photos ;
- chaque photo à 1 500 000 octets, entre 256 et 2 048 pixels par côté et au plus 4 194 304 pixels ;
- les corps HTTP à 32 768 octets pour l'itinéraire et 8 500 000 octets pour l'illustration.

Le serveur ne journalise pas les corps, les photos, les résultats, le code d'accès ou la clé OpenAI.

### OpenAI

L'API Responses reçoit le brief, les dates éventuelles, le nombre de voyageurs, le rythme et un identifiant de sûreté. Cet identifiant est un HMAC tronqué de l'adresse cliente, calculé avec un secret de runtime. OpenAI ne reçoit pas l'adresse brute depuis un champ applicatif, mais voit l'adresse réseau du serveur appelant.

L'API Image Edits reçoit les photos réencodées, la destination et la scène. Les noms de fichiers envoyés sont génériques. Le prompt demande un dessin, pas une photographie.

Les appels Responses fixent `store: false`. D'après la [documentation OpenAI sur les contrôles de données](https://developers.openai.com/api/docs/guides/your-data), les données API ne servent pas à l'entraînement par défaut. Des journaux de surveillance des abus peuvent toutefois contenir les entrées et sorties pendant une durée maximale indiquée de 30 jours, sauf contrôles différents du compte. Les images font aussi l'objet de contrôles de sûreté. Une détection peut entraîner une revue ou une conservation selon les règles du fournisseur.

Avant l'ouverture publique, le propriétaire doit vérifier sur le compte utilisé :

- les contrôles de rétention disponibles ;
- l'organisation, le projet et la région applicables ;
- la liste courante des sous-traitants et transferts ;
- les conditions de traitement et la procédure d'incident ;
- l'absence d'opt-in au partage pour l'amélioration des modèles.

### Booking.com et CJ

Mon Florian n'envoie aucune donnée à Booking.com ou CJ depuis le backend. Le navigateur contacte le site externe seulement quand l'utilisateur ouvre un lien.

En mode `external`, le lien peut contenir la destination, les dates et le nombre d'adultes. Booking.com reçoit alors les données normales d'une navigation web, dont l'adresse IP et les en-têtes du navigateur selon sa propre politique.

En mode `cj-static`, un lien approuvé peut aussi contenir des paramètres d'attribution. CJ et Booking.com peuvent traiter la navigation pour attribuer une éventuelle commission. Ce mode reste fermé tant que le partenariat, les conditions, la notice et les liens ne sont pas vérifiés.

## Consentement et droits sur les photos

L'interface exige une case explicite avant l'envoi. La personne qui utilise le service confirme :

- qu'elle peut utiliser chaque fichier ;
- que les personnes représentées comprennent la création d'une image dessinée par OpenAI ;
- qu'elles acceptent cet envoi et cette finalité ;
- qu'aucune photo ne montre une personne qui ne peut pas donner l'accord requis sans représentant autorisé.

Le service ne peut pas vérifier ces déclarations. Pour un mineur, une personne sous protection ou une photo prise par un tiers, le propriétaire doit définir une procédure adaptée avant tout usage réel.

Le consentement porte sur une génération ponctuelle. Il ne vaut pas autorisation de publier, vendre, entraîner un modèle, constituer une galerie ou conserver l'image.

## Rétention et effacement

| Emplacement | Données | Rétention prévue | Effacement ou retrait |
| --- | --- | --- | --- |
| Mémoire de la page | Formulaire, photos, résultat | Jusqu'au rechargement ou à la fermeture | Recharger ou fermer l'onglet |
| Mémoire du serveur | Corps et résultat pendant la requête | Durée de la requête et libération mémoire ultérieure | Aucun enregistrement à supprimer |
| Logs Mon Florian | Métadonnées techniques | Selon la rotation Atlas à définir avant production | Rotation et purge opérateur |
| OpenAI | Entrées et sorties API | Pas d'état applicatif Responses avec `store: false`, journaux de sûreté possibles jusqu'à 30 jours selon le compte | Procédure fournisseur, pas de suppression instantanée promise par Mon Florian |
| Booking.com ou CJ | Données de navigation après un clic | Selon leurs politiques et le contrat accepté | Procédure du fournisseur |

Il n'existe aucun export ou compte à supprimer chez Mon Florian. Cette phrase décrit l'architecture actuelle, pas les fournisseurs.

## Accès, sécurité et incidents

- La production de lancement reste privée.
- Les secrets sont injectés hors Git et ne passent pas dans le navigateur.
- Les requêtes de génération doivent venir de l'origine configurée.
- Les quotas limitent les usages répétés. Ils ne constituent pas une protection distribuée.
- Le serveur renvoie un code de support aléatoire. Les logs permettent de retrouver la route, le statut et la durée sans relire le contenu.
- Une fuite de clé impose sa révocation, la désactivation de la génération, la recherche de l'exposition et une nouvelle clé avec portée minimale.
- Une fuite de photo ou de brief impose l'arrêt des générations, la préservation des preuves sans recopier le contenu et l'analyse des destinataires concernés.

Le canal de contact pour les demandes d'accès, d'opposition ou d'incident n'est pas encore défini. Cette absence bloque l'ouverture publique.

## Tests autorisés

- Utiliser des briefs fictifs sans adresse, santé, identité ou réservation réelle.
- Produire les fixtures d'image par code ou utiliser des formes sans visage réel.
- Ne jamais copier une photo personnelle dans Git, un ticket, une capture, un log ou un artefact CI.
- Pour le premier test humain, informer la personne avant l'envoi, limiter le test à une génération et fermer l'onglet après inspection.

## Changements qui imposent une nouvelle décision

- base de données, cache partagé ou stockage d'objet ;
- compte, paiement, historique ou partage de voyage ;
- conservation ou publication des illustrations ;
- analyse biométrique, reconnaissance ou rapprochement d'identité ;
- nouveau fournisseur, nouveau modèle ou nouveau territoire de traitement ;
- API Demand Booking.com ;
- ouverture publique.

## Références

- [`PROJECT.md`](PROJECT.md)
- [`THREAT-MODEL.md`](THREAT-MODEL.md)
- [`RUNBOOK.md`](RUNBOOK.md)
- [OpenAI, contrôles de données](https://developers.openai.com/api/docs/guides/your-data)
- [OpenAI, génération et édition d'images](https://developers.openai.com/api/docs/guides/image-generation)
