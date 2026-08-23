# Runbook de livraison Mon Florian sur Atlas

Ce document décrit la préparation, le déploiement privé, l'ouverture DNS et le rollback. Il ne crée aucune autorisation. Une image publiée, une configuration prête ou une instruction passée ne remplace pas les checkpoints ci-dessous.

## Identité

| Champ | Valeur |
| --- | --- |
| Opération | Livrer puis exploiter Mon Florian sur Atlas |
| Propriétaire | `nclsppr` |
| Suppléant | Aucun désigné |
| Statut documentaire | Préparation exécutée, activation non exécutée |
| Dernière vérification | 2026-08-23 |
| Environnement concerné | Atlas, Caddy, registre GitHub et DNS OVHcloud |
| Décision liée | `docs/decisions/adr-0002-runtime-openai-photos-booking-atlas.md` |
| Preuve de la dernière exécution | `STATUS.md` et `DELIVERY-EVIDENCE.md` |

## État actuel et cible

### État actuel vérifié

| Élément | Valeur observée | Preuve | Vérifié le |
| --- | --- | --- | --- |
| Dépôt produit | Candidat `a7c5d1c32a41c2e43c92f02bff4d584910727eb1` publié par digest | Git, CI et attestations consignés | 2026-08-23 |
| Application F01 | 25 tests, 13 tests Atlas, Compose et navigateur validés | `DELIVERY-EVIDENCE.md` | 2026-08-23 |
| Atlas | Admission dormante et secret convergés, réseau vide et conteneur absent | Contrôleur `1d177efe019dda57f831c227f1ab03c1bef8a177` | 2026-08-23 |
| OpenAI | Clé authentifiée depuis Atlas, modèles texte et image configurés visibles, aucune génération | `STATUS.md` et `DELIVERY-EVIDENCE.md` | 2026-08-23 |
| Domaine | Apex et `www` sur Atlas `137.74.174.163`, aucun AAAA, route inactive | Zone autoritaire et résolveurs publics | 2026-08-23 |
| Booking.com | Aucun partenariat accepté observé | Audit des credentials et contrats disponibles | 2026-08-23 |

### Cible privée

- Une image `ghcr.io/nclsppr/monflorian/backend` admise par digest.
- Un service mono-instance non privilégié, sans port hôte, sans volume utilisateur et avec système de fichiers en lecture seule.
- Un réseau applicatif `app_monflorian` rejoint seulement par le backend et Caddy.
- La clé OpenAI montée depuis `/etc/vps/secrets/monflorian/monflorian-openai-api-key` vers `/run/secrets/monflorian_openai_api_key`.
- `MONFLORIAN_ACCESS_MODE=public` uniquement dans le réseau interne sans port hôte. Caddy charge `/etc/caddy/monflorian-private-access.caddy` avant de relayer toute page qui peut déclencher un coût.
- Une sonde publique de release reste accessible sans génération, la page répond 401 sans credential Caddy et `www` redirige vers l'apex.
- `BOOKING_MODE=external` ou `off` tant qu'aucun partenariat n'est prouvé.

### Cible publique ultérieure

`https://monflorian.com` et `https://www.monflorian.com` répondent depuis Caddy avec TLS. Cette cible reste fermée tant que la route, les secrets Atlas, le canal de contact pour les données et les preuves privées ne sont pas terminés.

## Autorité et checkpoints

| Action sensible | Autorité requise | Checkpoint | Condition d'arrêt |
| --- | --- | --- | --- |
| Lire ou monter une clé OpenAI | Propriétaire du projet OpenAI et accès Atlas limité | Vérifier le chemin, le propriétaire et les permissions sans afficher la valeur | Secret absent, permissions trop larges ou valeur exposée |
| Publier une image OCI | Autorité GitHub du dépôt | SHA vert, provenance et digest observés | CI rouge, tag mutable seul ou digest absent |
| Modifier `vps-infra` | Politique de revue et protections du dépôt | Branche à jour, diff limité, checks requis | Conflit, check absent ou autre service touché |
| Déployer sur Atlas | Instruction de déploiement dans le périmètre | Backup de configuration Git et rollback par digest | Cible ou contrôleur différents du runbook |
| Modifier la zone OVHcloud | Autorité DNS limitée à la zone | Export ou liste des enregistrements et diff exact | Session absente, accès non observé ou enregistrements hors périmètre |
| Activer `cj-static` | Partenariat accepté et liens approuvés | Conditions, domaines, mention et liens vérifiés | Contrat, identifiant ou attribution non prouvés |
| Ouvrir au public | Autorité produit après preuve privée | Santé, coût, données, sécurité et rollback verts | Une preuve ou un canal de contact manque |

## Préconditions de release

- Le worktree produit ne contient pas de secret ni de photo personnelle.
- `./scripts/verify.sh` passe sur le SHA exact.
- La CI distante du même SHA est verte.
- L'image OCI vient de ce SHA et possède un digest.
- Le contrat de release nomme ce digest, les sondes et `migrations: none`.
- Le profil Atlas a été relu depuis le `main` courant de `vps-infra`.
- La clé OpenAI existe dans le gestionnaire ou fichier cible avec le propriétaire `root`, le groupe `10001` et le mode `0440` afin que le processus `10001:10001` puisse la lire.
- Le fragment Caddy d'accès privé existe, passe la validation et ne figure pas dans l'artefact produit.
- Aucun port du backend n'est publié sur l'hôte.
- Le rollback nomme le digest précédent. Pour une première installation, le rollback retire le profil et la route.

Si l'une de ces lignes manque, la procédure s'arrête avant le déploiement.

## Sauvegarde et restauration

Mon Florian ne possède aucune donnée utilisateur persistante. Il n'y a donc aucune base ou volume à sauvegarder. Les éléments à protéger sont Git, les contrats de release et la configuration chargée.

| Élément | Sauvegarde | Vérification | Restauration isolée |
| --- | --- | --- | --- |
| Source produit | SHA sur GitHub | Commit et signature ou provenance observés | Rebuild du SHA dans CI |
| Image OCI | Digest dans le registre | Inspection du manifeste et lien au SHA | Démarrage local ou sur un environnement non public |
| Contrôle Atlas | Commit et PR `vps-infra` | Diff et checks requis | Validation Compose et Caddy sans activation publique |
| DNS | Export ou liste datée des enregistrements | Comparaison avant et après | Recréation des valeurs précédentes selon le TTL |
| Secrets | Gestionnaire ou fichier protégé | Présence, propriétaire et mode seulement | Nouvelle valeur injectée, jamais copie en clair dans une preuve |

RPO et RTO ne sont pas définis pour le candidat privé. Aucun engagement de disponibilité n'est publié.

## Livraison du produit

1. Vérifier l'état Git et séparer tout changement sans rapport.
2. Exécuter `./scripts/verify.sh`.
3. Contrôler l'interface sur petit mobile et bureau, au clavier, avec zoom et mouvement réduit.
4. Committer et pousser la tranche selon P18.
5. Attendre la CI distante du SHA poussé.
6. Publier l'image OCI depuis ce SHA avec le workflow versionné.
7. Relever le digest, le SHA, le run, la provenance et le résultat du scan dans `DELIVERY-EVIDENCE.md`.
8. Refuser toute suite si l'artefact n'est identifié que par un tag.

## Admission Atlas

Le dépôt produit prépare un bundle de release. Le dépôt `vps-infra` garde l'autorité d'admission et de déploiement.

Le contrat attendu décrit :

- un service `backend` utilisant le digest immuable ;
- le réseau `app_monflorian` ;
- aucun port hôte ;
- `read_only: true`, un `tmpfs` pour `/tmp`, capacités retirées et `no-new-privileges` ;
- l'utilisateur non privilégié de l'image ;
- les limites de mémoire, CPU et processus ;
- un healthcheck sur `/api/health` ;
- la clé OpenAI montée sous `/run/secrets/monflorian_openai_api_key` ;
- `migrations: none` ;
- une route Caddy privée distincte de toute route publique future.

Procédure :

1. Mettre à jour la branche de travail depuis le `main` réel de `vps-infra`.
2. Inspecter les profils, services, réseaux et routes déjà chargés sur Atlas.
3. Ajouter le profil Mon Florian et le digest sans modifier un autre produit.
4. Valider les schémas, Compose et Caddy avec les commandes canoniques de `vps-infra`.
5. Ouvrir une revue et attendre les checks requis.
6. Fusionner seulement si la branche est fusionnable, les checks sont frais et le diff reste limité.
7. Laisser le contrôleur central réconcilier la release.
8. Vérifier le digest réellement lancé, l'utilisateur, les montages, le réseau et l'absence de port hôte.

Ne pas lancer une commande Compose improvisée sur Atlas. Une mutation directe contournerait la source de vérité.

## Vérification privée

| Contrôle | Résultat attendu | Preuve à conserver |
| --- | --- | --- |
| Conteneur | En cours avec le digest admis et utilisateur non privilégié | Inspection du runtime sans environnement sensible |
| Secret OpenAI | Fichier `root:10001` en `0440`, lisible par l'UID `10001` | Métadonnées et test de lecture depuis le conteneur sans afficher la valeur |
| Santé interne | `/api/health` répond `status: ok` | Statut, release et horodatage |
| Configuration publique | `/api/config` ne révèle aucun secret | Corps JSON et en-têtes |
| Exposition | Aucun port backend sur l'hôte | Liste des sockets et inspect Compose |
| Protection | Caddy renvoie 401 pour la page sans credential et le backend n'a aucun port hôte | Statuts HTTP et inspection des sockets, sans credential dans la preuve |
| Itinéraire synthétique | Une sortie structurée revient avec projection et code de support | Modèle, durée, statut et identifiant, sans brief complet |
| Illustration synthétique | Un WebP dessiné revient depuis une fixture sans personne réelle | Dimensions, format et inspection visuelle |
| Logs | Aucun brief, photo, clé, code ou image | Recherche ciblée avec résultat négatif |
| Quotas | La limite et la concurrence produisent 429 | Tests contrôlés sans épuiser le compte |
| Mode Booking | `external` ou `off`, aucune mention de commission | `/api/config` et résultat synthétique |
| Redémarrage | Le service revient sain, sans donnée attendue | Santé après redémarrage contrôlé |

Observer au moins quinze minutes après le premier parcours privé. Arrêter si les erreurs serveur se répètent, si le budget monte sans requête autorisée ou si un contenu utilisateur apparaît dans les logs.

## DNS et ouverture HTTPS

Les serveurs autoritaires sont `dns200.anycast.me` et `ns200.anycast.me`. L'apex et `www` pointent déjà sur Atlas `137.74.174.163`. Aucun AAAA n'est présent. Le changement DNS a précédé l'activation applicative à la demande du propriétaire. Les valeurs précédentes étaient `213.186.33.5`.

1. Confirmer que la nouvelle clé OpenAI et l'accès privé existent sans afficher leur valeur.
2. Activer le profil et la route Caddy par le contrôle central.
3. Valider Caddy avant son rechargement.
4. Vérifier que le certificat couvre l'apex et `www`.
5. Sonder depuis l'extérieur la résolution, HTTP, HTTPS, les en-têtes et le parcours critique.
6. Vérifier que NS, SOA, les MX de priorités 1, 5 et 100, le SPF, les autres TXT et les sous-domaines hors `www` n'ont pas changé.
7. Revenir aux deux A précédents si l'activation échoue et ne peut pas être réparée dans la fenêtre prévue.

Le DNS seul n'est pas une preuve de déploiement. Un HTTP 200 sur la page seule ne prouve pas la génération.

## Activation Booking.com

1. Vérifier la relation acceptée, le titulaire du compte et les conditions courantes.
2. Générer ou relever les liens approuvés sans stocker le jeton CJ dans l'application.
3. Définir `BOOKING_ALLOWED_AFFILIATE_HOSTS` avec les hôtes exacts.
4. Définir `BOOKING_STATIC_LINKS_JSON` hors Git avec destination, libellé et URL approuvée.
5. Passer à `BOOKING_MODE=cj-static` dans la configuration contrôlée.
6. Vérifier la mention de commission, `rel="sponsored noopener noreferrer"`, la destination et l'attribution.
7. Revenir à `external` ou `off` si un lien ou une condition n'est plus valide.

Ne pas envoyer de jeton CJ, de lien affilié ou de contenu Booking.com à OpenAI.

## Rollback

### Déclencheurs

- digest, route, secret ou mode Booking différent du contrat ;
- santé rouge après deux tentatives espacées ;
- erreur serveur répétée sur le parcours synthétique ;
- exposition publique sans protection ;
- contenu utilisateur ou secret dans un log ;
- coût fournisseur sans requête autorisée ;
- certificat invalide ou DNS qui affecte un autre service.

### Procédure applicative

1. Couper les générations avec les drapeaux de configuration si le service répond encore.
2. Faire réconcilier par Atlas le digest précédent et sa configuration correspondante.
3. Pour une première installation, retirer la route puis le profil Mon Florian par le contrôle central.
4. Vérifier les sockets, la santé du reste d'Atlas et l'absence du conteneur retiré.
5. Révoquer une clé seulement si elle peut avoir été exposée. Injecter la nouvelle valeur hors logs.

### Procédure DNS

1. Restaurer uniquement les valeurs apex et `www` consignées avant l'action.
2. Conserver les autres enregistrements.
3. Retirer la route Caddy Mon Florian si aucun nom ne doit plus pointer vers Atlas.
4. Sonder les valeurs restaurées pendant au moins le TTL observé.

## Incident et escalade

| Condition | Action sûre | Contact | Preuve à conserver |
| --- | --- | --- | --- |
| Clé OpenAI suspecte | Couper la génération et révoquer la clé | `nclsppr` | Heure, portée et identifiants techniques |
| Photo ou brief dans un log | Arrêter les appels, restreindre le log et analyser les destinataires | `nclsppr` | Chemin, période et accès, sans recopier le contenu |
| Abus de coût | Fermer la route privée et les drapeaux | `nclsppr` | Compteurs, statuts et fenêtre temporelle |
| Erreur fournisseur | Désactiver la fonction concernée | `nclsppr` | Codes, durée et identifiants de requête |
| Atlas ou Caddy instable | Rollback du profil Mon Florian | Propriétaire Atlas | Diff, digest et santé des autres services |
| DNS incorrect | Restaurer le diff limité | Propriétaire OVHcloud | Zone avant et après, TTL et sondes |

## Clôture

- Mettre à jour `DELIVERY-EVIDENCE.md` avec les résultats, pas les intentions.
- Mettre à jour `STATUS.md` et la phase correspondante dans `ROADMAP.md`.
- Vérifier le worktree, le SHA poussé, la CI et le digest exécuté.
- Nommer les actions externes restantes et leur propriétaire.
- Réexaminer ce runbook avant chaque ouverture publique, changement de fournisseur, persistance ou second replica.
