# Plan de reprise vers une V1 privée

Dernière mise à jour : 2026-08-23. Ce document est la checklist de reprise. L'état observé vit dans [`STATUS.md`](STATUS.md) et les procédures stables dans [`RUNBOOK.md`](RUNBOOK.md).

## Verrou actuel

- [ ] Attendre une autorisation explicite de l'opérateur avant tout accès à Atlas, toute convergence, tout déploiement ou toute sonde publique dirigée vers Atlas.
- [x] Geler `codex/monflorian-edge-adoption`. Cette branche interrompue sert seulement de référence et ne doit être ni reprise, ni fusionnée, ni déployée.
- [ ] Ne jamais placer une clé, un identifiant privé ou un condensat du fragment d'accès dans Git, un état public, une commande ou un journal.

## V1 privée attendue

La première livraison est terminée seulement si :

- `https://monflorian.com` possède un certificat valide et `www` redirige vers l'apex ;
- la page et toutes les routes payantes répondent `401` sans identifiants ;
- le backend utilise le digest figé, l'UID `10001` et aucun port hôte ;
- un itinéraire et une illustration de 256 px, tous deux synthétiques, réussissent avec OpenAI ;
- aucun brief, image, identifiant privé ou secret n'apparaît dans les journaux ;
- Booking reste en mode `external`, sans prix, stock ou affiliation inventés ;
- les services et sites déjà présents sur Atlas restent inchangés pendant quinze minutes.

## Candidat figé

Un changement purement documentaire ne remplace pas ce candidat.

| Élément | Référence immuable |
| --- | --- |
| Source | `fc9212f876b32ea5821b235200802e5b51e50a59` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:ca1a9b3b2dbf33c999e5cee445cf51cd6974781a24d2dda70286c8e50142f471` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:9e8944e4cff11b3cbc17f6227b517717d48b8a1b3c47be0490c71afb36b2f87a` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:1fb74335d7a2bb8ad5b36a6ff28718cd766bafcac26d807ccbd716a13fa3b446` |
| Base centrale | `vps-infra` à `086d9d8894704a6755799bcb47ad3989f6b695ea` |

## A. Préparer hors Atlas

Cette phase doit finir avant d'ouvrir une fenêtre de déploiement.

- Faire un point factuel toutes les 45 minutes : fichier ou commit produit, contrôle passé et blocage restant.
- Arrêter après deux créneaux sans réduction mesurable des blocages.
- Limiter la préparation locale à trois heures. Si `READY_TO_DEPLOY` n'est pas atteint, rendre l'écart précis au lieu d'ouvrir Atlas ou d'élargir le code.
- Ne traiter aucun sujet reporté pendant cette phase.

- [ ] Créer une branche `vps-infra` propre depuis `086d9d8`, sans reprendre le contrôleur de la branche gelée.
- [ ] Réutiliser le rôle `public_static_edge`, sa bascule atomique et son rollback existants.
- [ ] Ajouter un état `monflorian-private` qui assemble un seul release avec les trois sites statiques existants, Surplasse statique et Mon Florian.
- [ ] Ajouter seulement le Compose privé, la route Mon Florian et les contrôles des deux marqueurs de génération.
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
| 25 à 35 min | Adoption de la clé existante et installation de l'accès privé | Deux marqueurs génération 1, permissions exactes, aucune valeur lue ou journalisée. |
| 35 à 50 min | Préparation du release edge complet | Caddy valide et sites existants identiques. |
| 50 à 65 min | Activation du backend figé | Digest exact, service sain, UID `10001`, aucun port hôte. |
| 65 à 85 min | TLS, accès privé, deux générations synthétiques et observation | Tous les critères de la V1 privée sont prouvés. |
| 85 à 90 min | Preuve finale ou rollback | Résultat consigné, ou route et profil retirés. |

Une seule tentative est permise par étape. Si une étape dépasse sa limite de cinq minutes, le diagnostic en direct s'arrête. Si une mutation a déjà eu lieu, appliquer le rollback préparé. Aucun développement, rebase ou correctif improvisé n'entre dans cette fenêtre.

## Reporté après la V1

- Affiliation Booking.com et liens sponsorisés approuvés.
- Migration visuelle Astryx ou nouveau back-office.
- Photos réelles, comptes, paiement, PDF et persistance.
- Généralisation du contrôleur edge, tests de charge et ouverture sans protection privée.
