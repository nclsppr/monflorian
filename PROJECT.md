# PROJECT.md

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | Mon Florian |
| Propriétaire | `nclsppr` |
| Classe | Produit |
| Environnement de production | Aucun au 2026-08-23 |
| Socle adopté | [`FOUNDATION.md`](FOUNDATION.md) |
| Licence | Aucune licence de réutilisation accordée |

## Problème

Les voyageurs doivent aujourd'hui assembler seuls des recherches dispersées ou accepter des parcours génériques pour transformer une envie en voyage cohérent, pratique et personnel.

## Utilisateurs

| Utilisateur | Situation | Besoin | Risque principal |
| --- | --- | --- | --- |
| Voyageur francophone | Prépare un voyage de loisir sans vouloir remplir un long questionnaire | Exprimer librement son envie et recevoir un parcours compréhensible | Confondre une projection attractive avec une réservation ou une information vérifiée |
| Florian | Compose, explique et ajuste le voyage | Recevoir un brief exploitable et garder la responsabilité des choix | Promettre un niveau de service impossible à tenir |
| Proche invité | Consulte le voyage avant, pendant ou après le séjour | Accéder à une version lisible et partageable | Accéder à des données ou photos sans autorisation |

## Résultat attendu

Une personne raconte son envie en une phrase, ajoute seulement les informations utiles et peut commander une proposition expliquée qui l'accompagne avant, pendant et après le voyage.

L'offre cible est un voyage prêt à 50 €, livré en mini-site privé et PDF personnalisé. Après la première livraison, l'option Voyage vivant à 50 € ajoute les ajustements, l'accompagnement pendant le séjour et le carnet de souvenirs. Ces prix sont une hypothèse produit, pas une capacité de paiement actuellement livrée.

### Preuves de succès

| Preuve | Baseline connue | Cible | Source | Échéance |
| --- | --- | --- | --- | --- |
| Compréhension de la promesse | Non mesurée | Un voyageur test explique correctement le service et ses limites après le parcours | Test utilisateur consigné | Avant promotion du prototype |
| Utilisabilité du brief | Prototype visuel existant | Le parcours principal fonctionne sur petit mobile et bureau, au clavier et en mouvement réduit | Vérification navigateur | Phase F01 |
| Valeur de l'offre | Hypothèse de prix uniquement | Une validation réelle sans témoignage ni chiffre inventé | Preuve commerciale autorisée | Avant activation du paiement |
| Qualité du voyage | Non mesurée | Chaque choix important est expliqué et les trajets sont vérifiés par Florian | Guide livré et revue humaine | Avant premier client réel |

## Périmètre

### Inclus

- Une entrée libre centrée sur l'envie, complétée seulement par dates, voyageurs, rythme et photos facultatives.
- Une proposition composée et expliquée par Florian.
- Un mini-site mobile et un PDF pour la livraison cible.
- Des projections personnalisées limitées à la couverture, aux chapitres et à quelques moments forts.
- Le prolongement Voyage vivant après la première livraison.

### Non-objectifs

- Une application native au lancement.
- Une interface de chatbot ou un site institutionnel d'agence.
- L'achat automatique de billets, hôtels ou activités.
- L'insertion photoréaliste des voyageurs devant chaque monument.
- Un paiement, un compte ou un stockage distant dans le prototype actuel.

### Conditions d'arrêt ou de réévaluation

- Les voyageurs test ne comprennent pas la valeur ou la responsabilité de Florian.
- Les droits sur les visuels ou le traitement des photos ne peuvent pas être établis.
- La qualité et l'actualité des informations de voyage ne peuvent pas être assurées.
- Le prix cible n'est pas validé par un signal réel.

## Sources de vérité

| Concept | Source canonique | Type | Notes |
| --- | --- | --- | --- |
| Produit | Ce document | normative | Promesse, utilisateurs, offre et limites |
| État courant | `STATUS.md` | snapshot opérationnel | Daté et vérifié |
| Roadmap | `ROADMAP.md` | normative | Autorité de séquencement |
| Historique des changements | `CHANGELOG.md` | historique | Impact observable de chaque livraison |
| Architecture | `PROJECT.md#architecture` | normative | L'état cible non décidé reste explicitement ouvert |
| Contrat API | Aucun | non applicable actuellement | À décider avant tout backend |
| Schéma de données | Aucun | non applicable actuellement | Aucune donnée persistée |
| Design system | `DESIGN.md` | normative | Extrait des concepts retenus |
| Configuration | `compose.yaml` et `.env.example` | opérationnelle | Aperçu local uniquement |
| Code livré | `prototype/index.html` | expérimentale | Source exécutable du prototype actuel |
| Opérations | Ce document | normative | Aucune production active |
| Décisions | `docs/decisions/` | normative | Décisions structurantes |
| Documentation | `DOCUMENTATION.md`, `documentation.json` et `docs-nimbus/` | normative et dérivée | Catalogue généré |
| Visuels | `ASSETS.md` | normative et historique | Source, rôle, provenance et retrait |
| Archives | `references/concepts/` | historique | Captures non exécutables et non normatives |
| Expériences | `prototype/` | expérimentale | Isolées de toute production |

## Architecture

### Composants

| Composant | Rôle | Statut | Exécution | Version | Source | Preuve et date | Propriétaire |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prototype statique | Tester la promesse, la composition et les interactions locales | expérience | navigateur | HTML, CSS et JavaScript natifs | `prototype/index.html` | Audit source 2026-08-23 | `nclsppr` |
| Serveur d'aperçu | Servir le prototype de façon reproductible | actuel en développement | Docker Compose | NGINX 1.30.0 par digest | `compose.yaml` | Sonde locale consignée dans `STATUS.md` | `nclsppr` |
| Documentation Nimbus | Construire la documentation classée | actuel | local et CI | lockfile `docs-nimbus/package-lock.json` | `docs-nimbus/` | `./scripts/verify.sh` | `nclsppr` |
| Service de voyage | Composer, stocker et livrer un voyage réel | cible non décidée | aucune | non choisie | future ADR | aucune preuve | `nclsppr` |

### Flux principal actuel

Le navigateur charge un fichier autonome. Le texte et les puces modifient uniquement le DOM. Les photos choisies deviennent des URL temporaires en mémoire dans le navigateur et ne quittent pas l'appareil. Le bouton final affiche un retour local. Aucun réseau, paiement, compte, stockage, génération de voyage ou PDF n'est appelé.

### Dépendances externes

| Dépendance | Usage | Données transmises | Mode d'échec | Alternative |
| --- | --- | --- | --- | --- |
| NGINX officiel par digest | Aperçu local reproductible | Aucune donnée utilisateur | Prototype local indisponible par Compose | Ouvrir `prototype/index.html` directement |
| Dépendances Nimbus verrouillées | Vérifier et rendre la documentation | Markdown du dépôt pendant le build local ou CI | Gate documentaire rouge | Aucune dans le socle adopté |
| API Fichier du navigateur | Prévisualiser des photos localement | Aucune transmission réseau | Personnalisation visuelle indisponible | Continuer sans photo |

## Contrat de l'expérience actuelle

| Champ | Valeur |
| --- | --- |
| Hypothèse | Une entrée libre et une présence ponctuelle de Florian rendent l'offre plus simple et personnelle qu'un questionnaire ou un chatbot |
| Propriétaire | `nclsppr` |
| Réévaluation | Avant toute publication ou au plus tard le 2026-09-23 |
| Budget | Aucun service payant, aucune infrastructure persistante, une page statique |
| Données | Exemples synthétiques et photos facultatives conservées en mémoire locale |
| Accès | `http://127.0.0.1:8080` uniquement |
| Succès | Parcours compris et utilisable sur mobile et bureau sans promesse fictive |
| Arrêt | Retirer le service Compose et `prototype/`, puis conserver seulement les apprentissages documentés |

Une promotion en produit exige une ADR, un contrat de données, une revue des droits, les profils Foundation adaptés et une preuve dans l'environnement final.

## Environnements

| Environnement | Plateforme | Configuration canonique | URL ou accès | Vérification |
| --- | --- | --- | --- | --- |
| Développement | Docker Compose sur macOS ou Linux | `compose.yaml` et `.env.example` | `http://127.0.0.1:8080` par défaut | `./scripts/verify.sh` |
| CI | GitHub Actions | `.github/workflows/verify.yml` | Runs GitHub | `./scripts/verify.sh` |
| Production | Inactive | Aucune | Aucune | Non applicable |

## Commandes canoniques

| Action | Commande | Résultat attendu |
| --- | --- | --- |
| Installer | `npm ci --prefix docs-nimbus --ignore-scripts --no-audit --no-fund` | Dépendances documentaires conformes au lockfile |
| Développer | `docker compose up --build --wait` | Prototype sain sur le port configuré |
| Vérifier | `./scripts/verify.sh` | Prototype, Compose, documentation et aperçu local valides |
| Construire la documentation | `npm run build --prefix docs-nimbus` | Site Nimbus statique généré depuis les Markdown classés |
| Arrêter | `docker compose down` | Service arrêté sans suppression de donnée |
| Contrôler la santé | `python3 -m urllib.request http://127.0.0.1:8080` | La page d'accueil répond |

Le projet ne possède actuellement ni commande de déploiement, ni état persistant à réinitialiser, sauvegarder ou restaurer.

## Données, sécurité et confidentialité

- Le prototype ne persiste rien et ne transmet aucune photo.
- Les photos restent des URL temporaires du navigateur et disparaissent au rechargement.
- Aucun secret, compte, rôle, paiement ou journal applicatif n'existe.
- Les exemples de voyage sont synthétiques et ne prouvent aucune capacité de réservation.
- Avant un paiement réel, une authentification ou un stockage de photos, le projet doit être reclassifié et activer les profils Foundation adaptés.
- Aucune photo personnelle réelle ne doit être ajoutée au dépôt.

## Qualité

| Risque | Contrôle automatisé | Contrôle manuel | Environnement |
| --- | --- | --- | --- |
| Dérive du contrat Foundation | `./scripts/verify.sh` | Diff du snapshot et des contrats | local et CI |
| Prototype cassé ou trompeur | `python3 scripts/check_prototype.py` | Parcours complet et console | navigateur mobile et bureau |
| Aperçu non reproductible | `python3 scripts/check_compose.py` et sonde HTTP | Chargement de la page | Docker Compose |
| Interface inaccessible | Contrôles statiques minimaux | Clavier, focus, zoom et mouvement réduit | navigateurs ciblés dans `DESIGN.md` |
| Visuel sans provenance | Inventaire `ASSETS.md` | Revue des droits et du rendu | dépôt et navigateur |

## Livraison

- Branche canonique : `main`.
- Push direct : autorisé tant que la branche reste personnelle et non protégée ; utiliser une branche avec revue si cette politique change.
- Convention de commit : impératif préfixé par le périmètre.
- Artefact actuel : SHA Git contenant le prototype statique et les contrats.
- Déploiement : aucun au 2026-08-23.
- Rollback : revenir au SHA précédent par un commit inverse, sans réécrire l'historique.
- Vérification finale : CI distante puis contrôle navigateur lorsqu'une interface est publiée.
- Observabilité : santé Compose uniquement tant qu'aucune production n'existe.
- Escalade : propriétaire `nclsppr`.

## Responsabilités

| Zone | Propriétaire | Suppléant | Runbook |
| --- | --- | --- | --- |
| Produit, marque, code et livraison | `nclsppr` | Aucun désigné | Aucun tant que la production est inactive |

Les risques courants et prochaines preuves vivent dans `STATUS.md`. Les décisions structurantes vivent dans les ADR.
