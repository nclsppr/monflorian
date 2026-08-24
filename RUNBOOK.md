# Runbook Cloudflare de Mon Florian

Ce runbook décrit le déploiement, les migrations, le domaine et le rollback de
la cible décidée par l'ADR-0007. Il ne donne pas à lui seul l'autorisation de
modifier un compte, un secret, un domaine ou une production.

## Portée

| Champ | Valeur |
| --- | --- |
| Runtime | Cloudflare Workers avec Static Assets |
| Métadonnées | D1 `monflorian-production` |
| Traitement durable | Workflow `monflorian-trip` |
| Images | bucket R2 privé `monflorian-media-production`, juridiction `eu` |
| Courriel | Cloudflare Email Service, expéditeur `voyage@monflorian.com` |
| Domaine cible | `monflorian.com` et `www.monflorian.com` |
| État sûr | générations texte et image fermées |

L'ancien environnement Atlas est hors portée. Ce runbook ne lit, ne modifie et
ne retire aucun de ses secrets, services ou routes.

## Autorité et arrêts

| Action | Précondition | Arrêt sûr |
| --- | --- | --- |
| Déployer le Worker | instruction couvrant le déploiement Cloudflare | garder la version active |
| Migrer D1 | migration relue, sauvegarde ou base vide, rollback compris | ne pas appliquer |
| Activer R2 | compte autorisé, coût et juridiction compris | laisser les photos fermées |
| Installer un secret | propriétaire présent ou canal local sûr | ne jamais demander la valeur dans le chat |
| Changer le DNS | inventaire relevé, services non web décidés et rollback préparé | conserver l'état courant |
| Ouvrir OpenAI | toutes les gates de données et coût prouvées | conserver les drapeaux à `false` |
| Activer Stripe | décision séparée, test et fiscalité | ne créer aucune ressource réelle |

Arrêter immédiatement si une valeur secrète apparaît dans Git ou les logs, si
R2 devient public, ou si une route coûteuse est ouverte sans tous ses contrôles.

La création ne devient prête que si les drapeaux voyage, texte, image et
courriel sont tous à `true`, avec Turnstile, le code privé et OpenAI configurés.
Une activation partielle doit donc rester publiquement fermée.

## Préparation locale

1. Vérifier la branche et préserver les changements sans rapport.
2. Installer avec `npm ci --ignore-scripts --no-audit --no-fund`.
3. Exécuter `./scripts/verify.sh` une seule fois près de la livraison.
4. Vérifier le diff, notamment `wrangler.jsonc`, les migrations et
   `worker-configuration.d.ts`.
5. Committer, pousser et attendre `verify` et `Validate Cloudflare release`.

Le contrôle ciblé du bundle est :

```bash
npm run check:worker
```

Il construit les assets, régénère les bindings, vérifie TypeScript et exécute un
dry-run Wrangler.

## Déploiement fermé

```bash
npx wrangler whoami
npm run deploy
```

Ne jamais afficher le jeton OAuth. Après déploiement, relever la version Worker
et sonder seulement :

- `/` ;
- `/api/health` ;
- `/api/config` ;
- `/.well-known/monflorian-release` ;
- un POST synthétique qui doit rester en `503` tant que la génération est
  fermée.

Le healthcheck doit annoncer la version active et `generationReady: false`.

## D1

### Vérifier

```bash
npx wrangler d1 info monflorian-production
npx wrangler d1 migrations list monflorian-production --remote
```

### Appliquer

```bash
npx wrangler d1 migrations apply monflorian-production --remote
```

Avant une migration avec données, exporter ou sauvegarder selon les capacités
D1 courantes, évaluer les verrous et prévoir une migration inverse ou de
réparation. Ne jamais afficher les colonnes chiffrées, courriels, jetons ou
briefs dans une preuve.

## R2

Le bucket `monflorian-media-production` existe en juridiction `eu`. Il reste
privé, sans domaine personnalisé ni URL `r2.dev`. Vérifier son état avec :

```bash
npx wrangler r2 bucket info monflorian-media-production --jurisdiction eu
npx wrangler r2 bucket domain list monflorian-media-production --jurisdiction eu
npx wrangler r2 bucket dev-url get monflorian-media-production --jurisdiction eu
npx wrangler r2 bucket lifecycle list monflorian-media-production --jurisdiction eu
```

Les règles cibles sont `source-photo-backstop` sur `source/` à un jour et
`generated-image-expiration` sur `generated/` à 30 jours. Les recréer seulement
si elles manquent, après avoir vérifié qu'une règle homonyme n'existe pas :

```bash
npx wrangler r2 bucket lifecycle add monflorian-media-production source-photo-backstop source/ --expire-days 1 --jurisdiction eu
npx wrangler r2 bucket lifecycle add monflorian-media-production generated-image-expiration generated/ --expire-days 30 --jurisdiction eu
```

Le binding `MEDIA` est versionné dans `wrangler.jsonc`. Vérifier :

- juridiction `eu` ;
- domaine `r2.dev` désactivé ;
- aucun domaine personnalisé ;
- aucune règle CORS tant que les uploads passent par le Worker ;
- règles de cycle de vie cohérentes avec 24 heures et 30 jours ;
- objet synthétique illisible sans le Worker.

Ne pas mettre une clé R2 S3 dans le navigateur. Le MVP envoie les photos au
Worker dans les limites prévues, puis le Worker les écrit en flux.

## Secrets

Les secrets cibles sont ajoutés seulement quand leur consommateur est prêt.
`TRIP_DATA_KEY` et `TRIP_QUOTA_HASH_KEY` sont installés. Restent à installer ou
à relier avant ouverture :

- `OPENAI_API_KEY` ;
- `MONFLORIAN_ACCESS_CODE` ;
- `TURNSTILE_SECRET_KEY` ;
- `STRIPE_RESTRICTED_KEY` et `STRIPE_WEBHOOK_SECRET`, plus tard.

Utiliser la saisie locale silencieuse de Wrangler ou le Dashboard. Ne jamais
copier une valeur dans le chat, une commande historisée, `.env`, une issue ou un
fichier Git. Vérifier seulement le nom du binding et le succès d'un appel
synthétique. Une rotation coupe d'abord la fonction, remplace le secret, sonde,
puis révoque l'ancienne valeur si le rollback n'en dépend plus.

## Workflow et OpenAI

Avant d'activer les drapeaux :

1. Créer le voyage et débiter le quota dans D1.
2. Écrire les photos validées dans R2.
3. Associer une instance Workflow unique au voyage.
4. Chiffrer les champs persistants avec AES-GCM et nonce unique.
5. Vérifier `store: false`, schéma strict et limites de sortie Responses.
6. Désactiver le retry automatique des étapes payantes au résultat incertain.
7. Stocker seulement identifiant fournisseur, usage, statut et durée dans la
   preuve technique.
8. Supprimer les photos sources après génération.
9. Envoyer le courriel après passage atomique à `ready`.

Le binding `EMAIL` ne doit autoriser que `voyage@monflorian.com`. Un échec de
notification marque `notification_status=failed` sans retirer le résultat. Un
succès marque `sent` et efface immédiatement l'adresse chiffrée.

Les limites par défaut sont `MONFLORIAN_DAILY_GLOBAL_LIMIT=10` et
`MONFLORIAN_DAILY_CLIENT_LIMIT=2`. Leur modification exige une vérification du
budget. La migration `0003_atomic_quotas.sql` fait échouer tout le batch si une
des deux limites est dépassée ; ne jamais remplacer ce débit par deux écritures
indépendantes.

Un seul voyage synthétique sans identité suffit pour la première preuve. Une
erreur ou un coût inattendu ferme la fonction concernée.

## Domaine

### Relevé préalable

Avant toute mutation, relever depuis les serveurs autoritaires :

- NS et SOA ;
- A, AAAA et CNAME de l'apex et `www` ;
- tous les MX ;
- tous les TXT, dont SPF et validations ;
- sous-domaines et services hors web ;
- TTL.

Le relevé du 2026-08-24 contient trois MX OVHcloud, un SPF qui inclut
`mx.ovh.com` et `_spf.tem.scaleway.com`, ainsi qu'un DMARC `p=none`. L'ADR-0008
confirme qu'ils n'étaient pas utilisés et ne doivent pas être recréés.

### Bascule

1. Vérifier que la délégation Cloudflare est active.
2. Vérifier l'absence de conflit A, AAAA ou CNAME sur l'apex et `www`.
3. Lier le Worker à l'apex et à `www` avec deux Custom Domains.
4. Sonder plusieurs résolveurs, TLS, apex, `www`, release et en-têtes.
5. Vérifier que les seuls MX présents servent `cf-bounce.monflorian.com` et que
   l'apex ne reçoit toujours aucun courriel humain.
6. Observer au moins un TTL.

## Livraison continue

Le workflow `Cloudflare release` vérifie le bundle. La publication automatique
reste bloquée tant que Workers Builds ou un jeton Cloudflare GitHub restreint
n'est pas installé.

Pour un jeton GitHub : limiter sa portée au compte, au Worker et aux ressources
requises ; utiliser un secret Actions ; séparer validation PR et déploiement de
`main` ; ne jamais rendre le jeton disponible aux PR de forks.

Workers Builds est préférable si la connexion GitHub peut être accordée sans
élargir les permissions. Dans les deux cas, le SHA Git et la version Worker
doivent être reliés dans la preuve.

## Rollback

### Worker

1. Couper les drapeaux de génération si la version répond.
2. Revenir à la version Worker précédente.
3. Sonder santé, configuration, page et release.

### D1 et R2

1. Fermer toute création.
2. Conserver les données et objets nécessaires à la récupération.
3. Corriger par migration additive. Éviter une suppression tant que les durées
   et droits ne sont pas satisfaits.
4. Purger seulement les objets identifiés, expirés et prouvés.

### DNS

1. Restaurer les serveurs de noms ou enregistrements web relevés avant action.
2. Ne pas modifier MX, SPF, TXT ou sous-domaines non concernés.
3. Sonder pendant au moins le TTL observé.

## Incidents

| Incident | Action immédiate | Preuve sans contenu |
| --- | --- | --- |
| Secret suspect | couper la fonction et révoquer | heure, nom du binding, identifiants fournisseur |
| Brief ou photo dans un log | arrêter les générations et restreindre le log | période, destination, accès |
| R2 public | désactiver le domaine et les lectures | configuration et fenêtres d'exposition |
| Purge en retard | fermer les uploads et lancer la purge bornée | compte d'objets et échéances |
| Coût anormal | couper OpenAI et Turnstile | compteurs, statuts et fenêtre |
| Courriel incorrect | couper les notifications | identifiant technique et statut |
| DNS ou mail cassé | appliquer le rollback limité | zone avant et après, TTL |

## Clôture

- Mettre à jour `DELIVERY-EVIDENCE.md`, `STATUS.md` et `ROADMAP.md` avec des
  résultats observés.
- Vérifier SHA poussé, CI, version Worker, migrations et sondes publiques.
- Nommer R2, domaine, secrets et fournisseur encore bloqués.
- Ne déclarer ni génération, ni page privée, ni courriel, ni paiement sans leur
  preuve propre.
