# Modèle de menace

## Portée

Ce modèle couvre l'application web, le backend Node.js, les appels OpenAI, les liens Booking.com et la cible Atlas. Il ne couvre pas encore un paiement, un compte, une base de données ou un PDF, car ces composants n'existent pas dans le candidat.

## Actifs à protéger

- les photos et l'apparence des voyageurs ;
- le brief, les dates et le projet de déplacement ;
- la clé OpenAI, le code de lancement et le secret HMAC ;
- le budget fournisseur et les quotas ;
- l'intégrité de l'itinéraire et des liens externes ;
- l'image OCI, la configuration Atlas et la zone DNS ;
- la disponibilité du service privé ;
- la confiance créée par les mentions de projection et d'affiliation.

## Acteurs et capacités

| Acteur | Capacité considérée | Objectif possible |
| --- | --- | --- |
| Visiteur sans accès | Envoie des requêtes HTTP et modifie les en-têtes | Découvrir le service, épuiser le budget ou contourner l'origine |
| Testeur autorisé | Possède le code de lancement et contrôle le contenu envoyé | Abuser du quota, envoyer une photo sans droit ou tenter une injection |
| Site tiers | Incite un navigateur à appeler l'API | Dépenser le quota par CSRF ou récupérer un résultat |
| Fournisseur compromis ou défaillant | Renvoie du JSON, une image, une erreur ou un délai arbitraire | Injecter du contenu, casser le contrat ou bloquer le service |
| Dépendance ou image compromise | Exécute du code pendant le build ou au runtime | Voler un secret ou modifier l'artefact |
| Opérateur mal configuré | Modifie un secret, Caddy, Atlas ou DNS | Exposer le backend, couper le site ou déployer le mauvais digest |
| Attaquant réseau | Observe un trafic sans TLS ou usurpe un proxy mal configuré | Voler le code, le brief ou une photo |

## Frontières de confiance

```text
navigateur
  -> Caddy et protection privée
  -> serveur Mon Florian
      -> API Responses OpenAI
      -> API Image Edits OpenAI
navigateur
  -> Booking.com ou CJ après un clic explicite

GitHub Actions
  -> registre OCI
  -> contrôleur Atlas
  -> runtime Mon Florian
```

Le flux Booking.com ne traverse pas OpenAI. Le registre OCI n'autorise pas à lui seul le déploiement. Le contrôle central Atlas choisit le digest admis.

## Hypothèses de lancement

- Une seule instance Mon Florian tourne sur Atlas.
- Caddy termine TLS et relaie une adresse cliente seulement depuis un proxy de confiance.
- Le service reste privé avant la maîtrise du coût et du traitement des données.
- Aucun stockage utilisateur n'est monté dans le conteneur.
- Les tests fournisseur utilisent des données synthétiques.
- L'opérateur peut désactiver séparément texte, image et liens d'hébergement.

Une violation de ces hypothèses impose une nouvelle revue.

## Menaces et contrôles

| ID | Menace | Impact | Contrôles actuels ou requis | Risque résiduel |
| --- | --- | --- | --- | --- |
| T01 | Vol ou publication de la clé OpenAI | Coût, accès fournisseur et incident | Secret hors Git, lecture par fichier, permissions minimales, logs sans configuration, rotation au moindre doute | Un opérateur privilégié ou un processus du même conteneur peut lire la clé |
| T02 | Deviner ou partager le code de lancement | Générations non autorisées | Comparaison à temps constant, protection Caddy cible, quotas par client, mode privé | Le code reste un secret partagé sans identité ni révocation individuelle |
| T03 | Requête cross-origin ou CSRF | Dépense et fuite de résultat | Origine exacte, `Sec-Fetch-Site`, aucune CORS, origine obligatoire en production | Un client non navigateur qui possède le code peut appeler l'API |
| T04 | Contournement par `X-Forwarded-For` | Quota par client contourné | `MONFLORIAN_TRUST_PROXY` désactivé par défaut et activé seulement derrière Caddy contrôlé | Une mauvaise chaîne de proxy peut rendre l'adresse falsifiable |
| T05 | Rafale de requêtes ou boucle coûteuse | Budget OpenAI épuisé | Limites globales et client par jour, concurrence 2 pour le texte et 1 pour l'image par défaut, aucun retry automatique | Compteurs en mémoire réinitialisés au redémarrage et non partagés |
| T06 | Corps surdimensionné | Mémoire ou disponibilité | `Content-Length`, compteur de flux, limites distinctes texte et image, nombre de photos borné | Une charge proche de la limite consomme encore de la mémoire |
| T07 | Faux format, métadonnées ou bombe d'image | Fuite, crash ou coût fournisseur | Réencodage navigateur, signatures PNG/WebP, dimensions, pixels, poids, rejet de blocs EXIF et texte connus | Le parseur ne prouve pas l'absence de toute donnée cachée ou de contenu malveillant |
| T08 | Photo envoyée sans droit | Atteinte à la personne représentée | Consentement explicite, copie claire, aucune persistance, test réel limité | Le service ne peut pas vérifier l'autorité ou l'âge des personnes |
| T09 | Injection dans le brief | Le modèle ignore les règles ou publie du contenu hostile | Brief placé comme donnée, instructions développeur séparées, schéma strict, revalidation serveur | Une sortie textuelle conforme peut rester mauvaise ou offensante |
| T10 | XSS dans une sortie fournisseur | Exécution dans le navigateur | Affichage par noeuds texte, CSP sans script inline, aucun HTML fournisseur autorisé | Toute future utilisation de `innerHTML` rouvrirait la faille |
| T11 | Lien malveillant produit par le modèle | Phishing ou attribution détournée | Le modèle ne fournit aucun lien, URLs construites côté serveur, HTTPS et domaines autorisés pour `cj-static` | Une configuration opérateur approuvée peut encore pointer vers une redirection tierce |
| T12 | Prix, disponibilité ou trajet inventé | Mauvaise décision de voyage | Prompt interdit les garanties, listes de vérification, copie de projection et revue Florian requise | Le modèle peut produire une information plausible mais fausse |
| T13 | Réponse fournisseur partielle ou corrompue | Interface incohérente | Timeout, erreurs bornées, JSON strict, contrôle des dates et tailles, aucune publication partielle | Un timeout peut correspondre à un appel facturé malgré l'absence de résultat |
| T14 | Fuite dans les logs | Exposition durable d'une photo ou d'un brief | Logs limités à la route, statut, durée et identifiant aléatoire, tests de non-régression | Les logs du proxy et du fournisseur ont leurs propres règles |
| T15 | Cache navigateur ou intermédiaire | Données visibles après le test | API en `Cache-Control: no-store`, aucune persistance navigateur prévue, interface privée | Une capture, un téléchargement manuel ou une extension peut conserver le contenu |
| T16 | Conteneur compromis | Vol de secret ou mouvement latéral | UID non privilégié, cible read-only, capacités retirées et limites de ressources dans le contrat Atlas | Le processus doit lire la clé pour appeler OpenAI |
| T17 | Image ou workflow compromis | Code malveillant livré | Base par digest, lockfiles, actions épinglées, build et contrôles de provenance à consigner, déploiement par digest | Un digest exact peut contenir une vulnérabilité inconnue |
| T18 | Mauvais digest admis | Version non revue en production | Producteur, registre et contrôleur séparés, contrat de release immuable, preuve du SHA au digest | Une erreur d'autorité dans `vps-infra` peut admettre le mauvais artefact |
| T19 | Route Caddy ou port trop large | Backend public sans protection | Aucun port hôte, réseau dédié, validation Caddy, inspection des routes et ports | Une configuration Atlas concurrente peut modifier l'exposition |
| T20 | DNS modifié au mauvais endroit | Coupure, détournement ou perte d'autres services | Résoudre la zone, lister les enregistrements, limiter le diff à apex et `www`, conserver le rollback | Propagation et cache DNS retardent la correction |
| T21 | Domaine expiré ou compte registrar compromis | Coupure ou prise du nom | Renouvellement, MFA, accès limité et supervision à définir | Le domaine est enregistré mais sa continuité n'est pas encore supervisée |
| T22 | Mention affiliée absente | Tromperie commerciale | Mode affilié fermé par défaut, mention renvoyée par le backend, `rel="sponsored"` | Une modification frontend peut masquer la mention |

## Contrôles de sortie

Le backend traite toute sortie OpenAI comme hostile :

- il exige un objet JSON sans propriété supplémentaire pour l'itinéraire ;
- il limite le nombre de jours, de moments et de caractères ;
- il recalcule les dates attendues ;
- il n'accepte aucun URL fournisseur dans le schéma ;
- il construit les liens Booking.com à partir de destinations déjà validées ;
- il borne la réponse image à 12 000 000 octets encodés ;
- il renvoie une erreur générique au navigateur et garde un identifiant de support.

Le frontend doit utiliser `textContent`, `createElement`, `setAttribute` sur des valeurs contrôlées et des liens HTTPS validés. Il ne doit pas injecter les textes générés dans `innerHTML`, dans un attribut d'événement ou dans du CSS.

## Scénarios à tester avant release

- brief qui demande d'ignorer les règles, d'ajouter un prix ou un lien ;
- JSON fournisseur conforme au type mais trop long, avec mauvaise date ou journée manquante ;
- refus, 401, 429, 500, timeout et réponse non JSON d'OpenAI ;
- PNG et WebP tronqués, mauvais MIME, dimensions extrêmes, métadonnées et plus de quatre photos ;
- requête sans origine en production, origine tierce, mauvais code et en-tête `X-Forwarded-For` forgé ;
- deux illustrations simultanées, quota client atteint et compteur global atteint ;
- destination qui contient des caractères de contrôle ou une tentative d'URL ;
- lien `cj-static` HTTP, hôte non autorisé, JSON de configuration cassé et destination sans lien approuvé ;
- texte fournisseur qui contient du HTML et du JavaScript, rendu comme texte inerte ;
- arrêt OpenAI, arrêt du conteneur, redémarrage Atlas et rollback vers le digest précédent ;
- route publique sans protection, qui doit échouer avant le lancement.

## Détection et réponse

| Signal | Seuil de lancement | Réponse immédiate |
| --- | --- | --- |
| Hausse de 401 ou 403 | Répétition hors test | Vérifier la protection, faire tourner le code si un partage est probable |
| Quota quotidien atteint trop tôt | Une occurrence inexpliquée | Couper la génération et analyser les métadonnées de requête |
| Série de 429 fournisseur | Répétition sur plusieurs demandes autorisées | Fermer temporairement la fonction et vérifier le compte OpenAI |
| Erreurs 500 ou timeouts | Plusieurs erreurs dans une fenêtre courte | Désactiver la fonction concernée et conserver les identifiants de requête |
| Contenu utilisateur dans un log | Une occurrence | Arrêter les générations, restreindre l'accès au log et suivre la procédure d'incident |
| Route ou port inattendu | Une occurrence | Retirer la route ou rollback sans poursuivre l'ouverture |
| Digest différent du contrat | Une occurrence | Arrêter le déploiement et restaurer le digest admis |

Les seuils chiffrés d'alerte doivent être définis après le premier parcours synthétique sur Atlas. Aucun volume réel n'existe encore pour les calibrer.

## Risques acceptés pour le lancement privé

- quota en mémoire sur une seule instance ;
- secret d'accès partagé ;
- dépendance complète à OpenAI pour la génération ;
- aucune reprise après rechargement ;
- contrôle déclaratif des droits sur les photos ;
- exactitude éditoriale qui demande une revue humaine.

Ces risques ne sont pas acceptés automatiquement pour une ouverture publique. F04 exige un nouvel examen après les preuves privées.

## Références

- [`PROJECT.md`](PROJECT.md)
- [`DATA-PROCESSING.md`](DATA-PROCESSING.md)
- [`RUNBOOK.md`](RUNBOOK.md)
- Contrat OpenAPI canonique : `docs/api/openapi.json`
- [`docs/decisions/adr-0002-runtime-openai-photos-booking-atlas.md`](docs/decisions/adr-0002-runtime-openai-photos-booking-atlas.md)
