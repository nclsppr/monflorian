# État vérifié

Ce fichier décrit le candidat applicatif `a7c5d1c32a41c2e43c92f02bff4d584910727eb1`. Le commit documentaire qui contient ce relevé ne remplace pas ce candidat.

## Référence

| Champ | Valeur |
| --- | --- |
| Vérifié le | 2026-08-23 |
| Branche produit | `main` |
| Candidat produit | `a7c5d1c32a41c2e43c92f02bff4d584910727eb1` |
| Contrôle Atlas | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Environnements prouvés | macOS arm64, GitHub Actions Ubuntu 24.04, Docker local et VPS Atlas |
| État public | DNS sur Atlas, application encore inactive |

## Ce qui est livré

F01 est un candidat déployable. Le backend Node.js utilise l'API Responses pour les itinéraires et l'API Images pour les projections dessinées. Il ne conserve ni photos ni résultats. Les hébergements restent dans un flux séparé qui n'invente ni prix, ni disponibilité, ni statut d'affilié.

Les 25 tests applicatifs, les 13 tests du contrat Atlas, le parcours Compose et la vérification documentaire passent localement. Les trois workflows distants du même SHA sont verts. Ils ont publié des images par digest, scannées sans vulnérabilité haute ou critique et accompagnées d'attestations SLSA.

Le frontend est responsive en 1440 x 900 et 390 x 844. Les essais navigateur n'ont montré ni débordement ni erreur console. Le choix Astryx est tranché dans `DESIGN.md`: reprendre ses principes de tokens, d'états et d'accessibilité, sans imposer React et StyleX à cette page grand public.

## Ce qui n'est pas encore en ligne

Atlas connaît maintenant Mon Florian, mais le profil reste désactivé. Le VPS a le réseau `app_monflorian`, les répertoires d'application et la route Caddy suffixée `.disabled`. Il n'a ni conteneur Mon Florian, ni secret OpenAI, ni certificat pour le domaine.

La clé OpenAI envoyée dans la conversation est considérée exposée. Elle n'a pas été copiée dans Git, sur le VPS ou dans un fichier de travail. Il faut la révoquer, créer une nouvelle clé et l'installer hors conversation avant le premier appel réel.

## Phases

| Phase | État | Preuve suivante |
| --- | --- | --- |
| F01, candidat applicatif | terminée | Candidat, CI, digests et attestations consignés |
| F02, appels OpenAI réels | bloquée | Nouvelle clé privée, puis deux smoke tests synthétiques à budget borné |
| F03, admission Atlas | préparée | Profil encore désactivé, aucun conteneur lancé |
| F04, domaine et accès privé | bloquée | Installer les secrets, activer la route privée, vérifier TLS et les chemins coûteux |
| F05, affiliation Booking.com | bloquée | Partenariat accepté et liens approuvés |

## Artefacts du candidat

| Artefact | Référence immuable |
| --- | --- |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:a5c3b1d1f1164697039afe62ccb4bfcb1258c941a5667a220cb3a80a7e3ae114` |
| Intégration Atlas | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:cb485c36bc32311f9066bb9e7af6089377090fde2f5d493e7f5d48a9205e052b` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:9f7e279892bb3d2e4fbddf8a3bbb36238485d4c3279ff4ddef15927ec4b460e1` |

## CI produit

| Workflow | Run | Résultat |
| --- | --- | --- |
| Verify | [32643543755](https://github.com/nclsppr/monflorian/actions/runs/32643543755) | succès |
| Container images | [32643543727](https://github.com/nclsppr/monflorian/actions/runs/32643543727) | succès |
| VPS integration release | [32643543726](https://github.com/nclsppr/monflorian/actions/runs/32643543726) | succès |

## État Atlas

L'admission dormante a été relue puis fusionnée dans [vps-infra PR 96](https://github.com/nclsppr/vps-infra/pull/96). La convergence réelle a terminé avec `ok=379`, `changed=13`, `failed=0`. Le second passage en mode prédictif a terminé avec `ok=221`, `changed=0`, `failed=0`.

| Contrôle | Observation |
| --- | --- |
| Révision du contrôleur | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Réseau | `app_monflorian`, bridge `172.30.40.0/24`, géré par Atlas, aucun conteneur |
| Répertoires | `/srv/applications/monflorian` et `releases`, propriétaire `root:root`, mode `0755` |
| Dossier de secrets | `/etc/vps/secrets/monflorian`, propriétaire `root:root`, mode `0700` |
| Secret OpenAI | absent |
| Application active | aucune |
| Route | `platform/caddy/routes/monflorian.caddy.disabled` |
| Services existants | Caddy, PostgreSQL et supervision toujours sains |

## DNS

Le 2026-08-23, seuls les deux enregistrements A web ont changé chez OVHcloud.

| Nom | Avant | Après |
| --- | --- | --- |
| `monflorian.com` | `213.186.33.5` | `137.74.174.163` |
| `www.monflorian.com` | `213.186.33.5` | `137.74.174.163` |

Les serveurs autoritaires OVH, Cloudflare `1.1.1.1` et Google `8.8.8.8` renvoient tous `137.74.174.163`. Aucun AAAA n'est publié. Les NS, MX, SPF, TXT, `ftp` et les autres noms sont restés hors du changement.

Ce changement ne prouve pas le déploiement. Une requête forcée vers l'IP Atlas renvoie encore `404` en HTTP et l'échange TLS échoue, car la route est désactivée. Un cache DNS local peut aussi afficher le parking OVH pendant la propagation.

## Blocages

| Blocage | Action attendue |
| --- | --- |
| Clé OpenAI exposée | Révoquer la clé partagée, créer une nouvelle clé et la stocker hors Git et hors conversation |
| Accès privé | Créer un identifiant privé, protéger tous les chemins coûteux et tester les réponses `401` |
| Appels fournisseurs | Exécuter un itinéraire et une image avec des données synthétiques, puis vérifier coût, logs et résultat |
| Booking.com | Rester en mode `external` tant qu'aucun partenariat et aucun identifiant approuvé ne sont disponibles |
| Droits du logo et des photos | Confirmer les droits avant l'ouverture commerciale |

## Rollback DNS

Si Atlas ne peut pas être activé, remettre uniquement les deux A web sur `213.186.33.5`. Ne pas toucher aux enregistrements de messagerie.
