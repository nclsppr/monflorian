# Plan de reprise vers un aperçu public

Dernière mise à jour : 2026-08-24. L'aperçu public est livré. L'état observé vit dans [`STATUS.md`](STATUS.md) et les procédures stables dans [`RUNBOOK.md`](RUNBOOK.md).

## Fenêtre terminée

- [x] Autorisation explicite reçue pour reprendre Atlas, déployer l'aperçu et le rendre visible.
- [x] Geler `codex/monflorian-edge-adoption`. Cette branche interrompue sert seulement de référence et ne doit être ni reprise, ni fusionnée, ni déployée.
- [x] Aucun secret, identifiant privé ou condensat de secret ajouté à Git, aux commandes ou aux preuves publiques.

## Aperçu public attendu

La première livraison est terminée seulement si :

- [x] `https://monflorian.com` possède un certificat valide et `www` redirige vers l'apex.
- [x] La page répond `200` sans identifiant.
- [x] Le backend utilise le digest figé, l'UID `10001` et aucun port hôte.
- [x] `/api/config` annonce `serviceReady: false`.
- [x] Les deux marqueurs de génération valent `false` dans le runtime.
- [x] Les journaux Atlas ont été inspectés : le backend ne journalise que les
  champs techniques prévus, sans brief, photo, clé, secret, corps de requête ni
  corps de réponse. La seule mention `authorization` de Caddy est l'événement
  ACME `authorization finalized`.
- [x] Booking reste en mode `external`, sans prix, stock ou affiliation inventés.
- [x] Les sites existants sont restés en `200` pendant quinze minutes d'observation.

## Candidat figé

Un changement purement documentaire ne remplace pas ce candidat.

| Élément | Référence immuable |
| --- | --- |
| Source | `4ac2c42339941e34c128f779399688032c8ef304` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:f5340476e924a15618a95f215b7172b50c98f5deff7a47a4cc07c698cad46e7d` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:f5785b6b37d482c279b62386231810ced750c6189c1595aafa71f95851f1b102` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:af8d18a3df82f8be18f2fd48aebb0a7ff5d62159baf552f1d9fe00ef92d418ba` |
| Base centrale | `vps-infra` à `d98db4e339224faebacbc0bc415388749abac91e` |

## A. Préparer hors Atlas

Cette phase doit finir avant d'ouvrir une fenêtre de déploiement.

- Faire un point factuel toutes les 45 minutes : fichier ou commit produit, contrôle passé et blocage restant.
- Arrêter après deux créneaux sans réduction mesurable des blocages.
- Limiter la préparation locale à trois heures. Si `READY_TO_DEPLOY` n'est pas atteint, rendre l'écart précis au lieu d'ouvrir Atlas ou d'élargir le code.
- Ne traiter aucun sujet reporté pendant cette phase.

- [ ] Créer une branche `vps-infra` propre depuis `086d9d8`, sans reprendre le contrôleur de la branche gelée.
- [ ] Réutiliser le rôle `public_static_edge`, sa bascule atomique et son rollback existants.
- [ ] Ajouter un état `monflorian-preview` qui assemble un seul release avec les sites existants et Mon Florian.
- [ ] Ajouter seulement le Compose d'aperçu, la route Mon Florian et les contrôles des deux marqueurs de génération.
- [ ] Conserver de l'ancienne branche uniquement les constantes de route, le manifeste Surplasse observé et le tuple produit ci-dessus.
- [ ] Refuser toute extension générique de schéma ou tout nouveau mécanisme d'adoption.
- [ ] Garder la tranche sous 14 fichiers et 450 lignes nettes. Au-delà, arrêter et réduire le périmètre.
- [ ] Passer les quatre groupes de tests ciblés, `make check`, la revue indépendante, la PR et la CI centrale.
- [ ] Préparer les commandes exactes d'activation et de rollback sans aucune valeur secrète.
- [ ] Corriger les relevés historiques après chaque nouvelle preuve, sans transformer une intention en état courant.

Le statut `READY_TO_DEPLOY` est autorisé uniquement lorsque la branche centrale est fusionnée, `main` est vert, le tuple est inchangé, le rollback est prêt, aucun travail Git ou CI ne reste et l'opérateur a donné son accord pour reprendre Atlas.

## B. Fenêtre Atlas, 90 minutes maximum

| Temps | Action | Sortie attendue |
| --- | --- | --- |
| 0 à 10 min | Audit en lecture seule | Aucun verrou, transaction, service en échec ou état edge actif inattendu. Sinon, arrêt. |
| 10 à 25 min | Convergence de la base centrale | Révision attendue, sans secret Mon Florian et sans changement des sites. |
| 25 à 35 min | Audit du secret existant | Métadonnées exactes, aucune valeur lue ou journalisée. |
| 35 à 50 min | Préparation du release edge complet | Caddy valide et sites existants identiques. |
| 50 à 65 min | Activation du backend figé | Digest exact, service sain, UID `10001`, aucun port hôte. |
| 65 à 85 min | TLS, page publique, génération coupée et observation | Tous les critères de l'aperçu public sont prouvés. |
| 85 à 90 min | Preuve finale ou rollback | Résultat consigné, ou route et profil retirés. |

Une seule tentative est permise par étape. Si une étape dépasse sa limite de cinq minutes, le diagnostic en direct s'arrête. Si une mutation a déjà eu lieu, appliquer le rollback préparé. Aucun développement, rebase ou correctif improvisé n'entre dans cette fenêtre.

## Reporté après la V1

- Accès privé et deux générations synthétiques prouvées.
- Affiliation Booking.com et liens sponsorisés approuvés.
- Migration visuelle Astryx ou nouveau back-office.
- Photos réelles, comptes, paiement, PDF et persistance.
- Généralisation du contrôleur edge, tests de charge et ouverture sans protection privée.
