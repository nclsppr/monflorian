# Modèle de menace

## Portée

Ce modèle couvre le navigateur, Cloudflare Workers et Static Assets, D1, R2,
Workflows, OpenAI, le fournisseur de courriel, les liens Booking.com et le futur
webhook Stripe. L'aperçu actuel garde les générations fermées ; les contrôles
marqués requis sont des gates d'activation.

## Actifs à protéger

- photos et apparence des voyageurs ;
- brief, dates, courriel et projet de déplacement ;
- jeton de page privée et clé de chiffrement ;
- secrets OpenAI, Turnstile, courriel et Stripe ;
- budget fournisseur et quotas gratuits ;
- intégrité du voyage, des images et des liens externes ;
- Worker, D1, R2, Workflow, zone DNS et compte Cloudflare ;
- confiance créée par les mentions de projection et d'affiliation.

## Acteurs

| Acteur | Capacité | Objectif possible |
| --- | --- | --- |
| Visiteur automatisé | crée des requêtes et modifie les en-têtes | épuiser le budget ou remplir le stockage |
| Voyageur autorisé | contrôle brief, photos et adresse | injecter, dépasser les limites ou envoyer une photo sans droit |
| Site tiers | provoque une requête navigateur | CSRF, dépense ou fuite de résultat |
| Détenteur d'un lien | consulte ou partage le jeton | accéder au voyage privé |
| Fournisseur défaillant | renvoie délai, erreur ou contenu arbitraire | casser le Workflow ou injecter du contenu |
| Dépendance compromise | exécute au build ou au runtime | voler un secret ou modifier le bundle |
| Opérateur mal configuré | change binding, secret, bucket ou DNS | exposer les données, le mail ou une mauvaise version |
| Compte Cloudflare compromis | administre toutes les ressources | lire, modifier, supprimer ou détourner le service |

## Frontières de confiance

```text
navigateur
  -> edge Cloudflare
      -> Worker
          -> Turnstile
          -> D1
          -> R2 privé
          -> Workflow
              -> OpenAI
              -> fournisseur de courriel

navigateur -> Booking.com ou CJ après clic
navigateur -> Stripe Checkout plus tard
Stripe -> webhook Worker plus tard

GitHub Actions ou Workers Builds -> version Worker
OVHcloud registrar -> serveurs de noms Cloudflare
```

Booking.com ne traverse pas OpenAI. R2 ne sert jamais un objet directement. Le
retour navigateur Stripe ne prouve jamais un paiement.

## Hypothèses d'activation

- Les routes coûteuses restent fermées si R2, Turnstile, secrets, quotas,
  nettoyage ou budget manquent.
- Le bucket R2 est privé et à juridiction UE.
- D1 indexe seulement le hachage du jeton ; le contenu est chiffré.
- Le Workflow possède une instance unique par voyage.
- Les tests fournisseur utilisent des données synthétiques.
- L'opérateur peut couper texte, image, courriel et Booking séparément.

Une violation impose la fermeture de la fonction concernée et une nouvelle
revue.

## Menaces et contrôles

| ID | Menace | Impact | Contrôles actuels ou requis | Risque résiduel |
| --- | --- | --- | --- | --- |
| T01 | Secret publié ou journalisé | coût et accès fournisseur | Worker Secrets, Git public sans valeur, logs structurés, rotation | un administrateur du compte peut lire ou remplacer un secret |
| T02 | Jeton de voyage deviné | accès au contenu privé | 256 bits aléatoires, SHA-256 en D1, routes normalisées et journaux d'invocation désactivés | partage volontaire ou historique navigateur |
| T03 | Jeton présent dans logs ou referer | fuite durable | URL exclue des logs, `Referrer-Policy: no-referrer` sur page privée, liens externes nettoyés | extension ou capture locale |
| T04 | CSRF ou origine tierce | génération et coût | origine exacte, `Sec-Fetch-Site`, aucune CORS, jeton Turnstile | client non navigateur automatisé |
| T05 | Bot contourne le MVP gratuit | budget épuisé | Turnstile, quota D1 global et pseudonymisé, limite du projet OpenAI | fermes de navigateurs et identifiants tournants |
| T06 | Course sur le quota | dépassement simultané | batch D1 transactionnel, triggers de limite et clé d'idempotence | indisponibilité D1 |
| T07 | Corps ou photo surdimensionné | mémoire et disponibilité | limites avant lecture complète, nombre et taille bornés, écriture R2 en flux | charge proche de la limite |
| T08 | Faux format ou bombe d'image | crash, fuite ou coût | réencodage navigateur, signatures, dimensions, pixels et métadonnées contrôlés | stéganographie ou parseur incomplet |
| T09 | Photo sans droit | atteinte aux personnes | consentement explicite, durée courte, retrait, pas de galerie | déclarations impossibles à vérifier automatiquement |
| T10 | Prompt injection | contenu trompeur ou hostile | brief comme donnée, instructions séparées, JSON strict, revalidation | texte conforme mais faux ou offensant |
| T11 | XSS dans la sortie | exécution navigateur | rendu par noeuds texte, CSP, aucun HTML fournisseur | future régression de rendu |
| T12 | Lien injecté par le modèle | phishing ou attribution fausse | aucun URL dans le schéma, liens construits après validation, hôtes autorisés | mauvaise configuration opérateur |
| T13 | Voyage halluciné | mauvaise décision | mentions de projection, vérifications, revue Florian, aucune disponibilité annoncée | information plausible mais fausse |
| T14 | Retry Workflow duplique un appel payant | coût et résultats multiples | étapes à zéro retry, résultat chiffré en D1 et identifiant fournisseur | timeout après traitement fournisseur |
| T15 | État partiel entre D1 et R2 | page cassée ou donnée orpheline | statuts explicites, clés déterministes, écritures idempotentes, purge des orphelins | panne entre deux écritures |
| T16 | Bucket ou objet public | fuite de photos | pas de `r2.dev`, binding Worker uniquement, noms opaques, contrôle périodique | erreur d'administration Cloudflare |
| T17 | D1 lu sans clé | contenu personnel exposé | AES-GCM, clé distincte, nonces uniques, métadonnées minimales | clé et base compromises ensemble |
| T18 | Purge non exécutée | rétention excessive | échéances D1/R2, tâche planifiée et règles R2 de secours à 24 heures et 30 jours | panne prolongée du nettoyage |
| T19 | Courriel envoyé au mauvais destinataire | lien privé divulgué | validation, confirmation visible, envoi unique, contenu minimal | faute de saisie de l'utilisateur |
| T20 | Logs contiennent du contenu | fuite durable | allowlist de champs, pas de query string, tests négatifs | logs propres aux fournisseurs |
| T21 | Bundle ou action compromis | code malveillant | lockfiles, actions par SHA, dry-run Wrangler, PR protégée | vulnérabilité inconnue d'une dépendance |
| T22 | Compte Cloudflare pris | contrôle total | MFA forte, portée minimale des jetons, comptes séparés si possible, audit | propriétaire unique sans suppléant |
| T23 | Bascule DNS casse le mail | perte de réception | inventaire complet, copie MX/SPF/TXT, diff limité, rollback par NS | caches et propagation |
| T24 | Webhook Stripe falsifié ou rejoué | génération non payée | signature brute vérifiée, identifiant d'événement unique, état idempotent | erreurs opérateur et litiges |

## Contrôles de sortie

Le Worker traite toute sortie OpenAI comme hostile :

- objet JSON sans propriété supplémentaire ;
- jours, dates, moments et caractères bornés ;
- aucun URL fournisseur dans le schéma ;
- liens Booking.com construits après validation ;
- image décodée, taille et format contrôlés avant R2 ;
- page rendue sans `innerHTML` alimenté par le modèle.

## Scénarios critiques avant ouverture

- création sans Turnstile, quota atteint et deux créations concurrentes ;
- même identifiant de voyage soumis deux fois au Workflow ;
- timeout OpenAI après débit possible, sans second appel automatique ;
- PNG et WebP tronqués, mauvais MIME et plus de quatre photos ;
- jeton faux, expiré, supprimé ou inclus dans un `Referer` externe ;
- R2 sans domaine public et objet inaccessible hors Worker ;
- voyage partiellement écrit puis repris ou purgé ;
- expiration source à 24 heures et résultat à 30 jours ;
- sortie contenant HTML, JavaScript, URL ou mauvaise date ;
- courriel en échec puis repris sans doublon de voyage ;
- retour Stripe sans webhook signé, quand cette phase existera ;
- changement de serveurs de noms avec MX et SPF identiques.

## Signaux d'arrêt

- contenu utilisateur, jeton ou secret dans un log ;
- objet R2 lisible publiquement ;
- appel OpenAI sans quota débité ni Turnstile validé ;
- même étape payante exécutée deux fois sans décision explicite ;
- photo source encore présente après son échéance ;
- voyage consultable sans jeton valide ;
- DNS mail différent du relevé approuvé ;
- hausse de coût sans requête autorisée.

L'aperçu actuel évite ces risques en maintenant toutes les générations fermées.
