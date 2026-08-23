# Preuve de livraison F01

Ce relevé sépare le candidat publié, la préparation du VPS et l'activation publique. Ces trois étapes n'ont pas le même niveau de preuve.

## Référence

| Champ | Valeur |
| --- | --- |
| Unité de travail | F01, backend OpenAI, interface, dessins et contrat Atlas |
| Date | 2026-08-23 |
| Dépôt | `nclsppr/monflorian` |
| Branche | `main` |
| Candidat vérifié | `a7c5d1c32a41c2e43c92f02bff4d584910727eb1` |
| Admission Atlas | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Statut | candidat publié, VPS préparé, service non activé |

## Résultat demandé

Produire une application qui génère un trajet avec OpenAI, ouvre des recherches d'hébergement Booking.com sans inventer d'affiliation, puis crée une projection dessinée à partir de photos consenties. Préparer son déploiement sur Atlas et le domaine OVHcloud.

## Résultat prouvé

- Le backend et le frontend sont commités et poussés sur `main`.
- Les tests locaux, Compose, l'interface mobile et l'interface bureau passent.
- Trois workflows GitHub du même SHA sont verts.
- Les trois artefacts OCI ont des digests et des attestations de provenance.
- L'admission Atlas dormante a été relue, fusionnée et convergée sur le vrai VPS.
- Les enregistrements A de l'apex et de `www` pointent vers Atlas sur les serveurs autoritaires et les résolveurs publics.
- Mon Florian ne tourne pas encore. Le secret, le conteneur, la route active et le certificat sont absents.

## Frontières produit

| Sujet | Contrat retenu |
| --- | --- |
| Itinéraire | Réponse JSON structurée, `store: false`, délai borné et annulation si le client part |
| Photos | 1 à 4 images consenties, validation réelle, réencodage et aucune persistance applicative |
| Illustration | Dessin de projection, jamais présenté comme une photo future réelle |
| Booking.com | Modes `off`, `external` et `cj-static`; aucun hôtel, prix ou stock inventé |
| Affiliation | `rel="sponsored"`; mode `cj-static` interdit sans lien approuvé |
| Runtime | Node.js 24, bibliothèque standard, aucun paquet npm en production |
| Exposition | Aucun port hôte, Caddy doit rejoindre le réseau applicatif et protéger les routes coûteuses |

## Contrôles du candidat

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| `npm test` | 25 tests réussis | Validation, fournisseur simulé, erreurs, annulation et serveur |
| Contrat de release Atlas | 13 tests réussis | Compose, OCI, workflows et règles d'intégration |
| `./scripts/verify.sh` | succès | Tests, documentation, image, santé Compose et arrêt propre |
| Navigateur 1440 x 900 | succès | Mise en page, états et console |
| Navigateur 390 x 844 | succès | Responsive, cibles tactiles et absence de débordement |
| Trivy distant | 0 HIGH, 0 CRITICAL | Image backend publiée |
| Détection de fausse image | rejetée | Le serveur ne fait pas confiance au seul en-tête de fichier |
| Requête HTTP mal formée | `400`, serveur toujours sain | Robustesse du parseur |
| Photo quand la fonction est coupée | bloquée avant envoi | Le drapeau de fonction ne laisse pas fuiter les photos |

## Publication immuable

| Élément | Preuve |
| --- | --- |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:a5c3b1d1f1164697039afe62ccb4bfcb1258c941a5667a220cb3a80a7e3ae114` |
| Intégration | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:cb485c36bc32311f9066bb9e7af6089377090fde2f5d493e7f5d48a9205e052b` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:9f7e279892bb3d2e4fbddf8a3bbb36238485d4c3279ff4ddef15927ec4b460e1` |
| Archive de preuve | [artifact 9494271140](https://github.com/nclsppr/monflorian/actions/runs/32643543726/artifacts/9494271140) |
| SHA-256 de l'archive | `793181a9f1043de7d982e810329843ca1a39b91c0634940cbad62c8d38128aa3` |
| Attestation backend | [42424171](https://github.com/nclsppr/monflorian/attestations/42424171) |
| Attestation intégration | [42424201](https://github.com/nclsppr/monflorian/attestations/42424201) |
| Attestation release | [42424207](https://github.com/nclsppr/monflorian/attestations/42424207) |

## CI distante

| Workflow | Run | État |
| --- | --- | --- |
| Verify | [32643543755](https://github.com/nclsppr/monflorian/actions/runs/32643543755) | succès |
| Container images | [32643543727](https://github.com/nclsppr/monflorian/actions/runs/32643543727) | succès |
| VPS integration release | [32643543726](https://github.com/nclsppr/monflorian/actions/runs/32643543726) | succès |

## Admission Atlas

La PR [vps-infra 96](https://github.com/nclsppr/vps-infra/pull/96) a ajouté un profil désactivé, sans base ni migrateur. Les contrôles de branche et les trois workflows de `main` sont verts.

| Élément | Preuve |
| --- | --- |
| Révision fusionnée | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Validate | [32644204671](https://github.com/nclsppr/vps-infra/actions/runs/32644204671) |
| Platform integration artifact | [32644204694](https://github.com/nclsppr/vps-infra/actions/runs/32644204694) |
| Caddy platform image | [32644204794](https://github.com/nclsppr/vps-infra/actions/runs/32644204794) |
| Convergence réelle | `ok=379`, `changed=13`, `failed=0` |
| Contrôle prédictif | `ok=221`, `changed=0`, `failed=0` |

L'inspection distante confirme la révision installée, le réseau vide `172.30.40.0/24`, les répertoires root et l'absence du secret, du conteneur et du lien d'activation. Caddy, PostgreSQL et les services de supervision déjà présents restent sains.

## Changement DNS

| Contrôle | Résultat |
| --- | --- |
| A autoritaire, apex | `137.74.174.163` |
| A autoritaire, `www` | `137.74.174.163` |
| Cloudflare `1.1.1.1` | les deux noms sur `137.74.174.163` |
| Google `8.8.8.8` | les deux noms sur `137.74.174.163` |
| AAAA | aucun |
| MX | `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, `mx3.mail.ovh.net` préservés |
| TXT | présents, hors du changement |

Une requête avec résolution forcée vers Atlas renvoie `404` en HTTP. TLS renvoie une erreur interne avant émission du certificat. C'est le résultat attendu d'une route encore désactivée, pas une preuve de mise en ligne.

## Gates

| Gate | État | Ce qui manque |
| --- | --- | --- |
| Publication Git et CI | validée | rien pour le candidat `a7c5d1c` |
| Artefacts et provenance | validée | rien pour le candidat `a7c5d1c` |
| Admission Atlas dormante | validée | rien pour la préparation |
| Secret OpenAI | bloquée | nouvelle clé créée hors conversation |
| Smoke test Responses | bloqué | clé sûre et budget borné |
| Smoke test Images | bloqué | clé sûre et fixture synthétique |
| Accès privé | bloqué | identifiant privé et vérification de tous les chemins coûteux |
| Activation Atlas | bloquée | PR d'activation, secret, route, profil et sondes |
| TLS public | bloqué | route active et application saine |
| Booking affilié | bloqué | partenariat et lien approuvé |

## Secrets

La clé OpenAI partagée dans la conversation n'est pas une entrée de production. Elle doit être révoquée. Aucun secret n'a été inscrit dans le dépôt, les sorties de CI ou Atlas. Le contrat de production attend un fichier root lisible par le groupe applicatif, mode `0440`, sous `/etc/vps/secrets/monflorian/`.

## Rollback

| Cible | Procédure |
| --- | --- |
| DNS | Remettre seulement apex et `www` sur `213.186.33.5` |
| Admission dormante | Revenir sur la PR Atlas sans toucher aux autres applications |
| Activation future | Retirer la route, désactiver le profil et revenir au digest précédent |
| Booking.com | Garder ou remettre le mode `external` |
| Données utilisateur | Aucun volume applicatif à restaurer, car l'application ne persiste rien |

## Conclusion

Le candidat est publié et l'hôte est prêt à le recevoir. Le domaine pointe déjà vers Atlas, un peu en avance sur l'application. Le service reste volontairement fermé tant qu'une nouvelle clé OpenAI, un accès privé et les deux smoke tests réels ne sont pas disponibles.
