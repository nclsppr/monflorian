# État courant

Dernière mise à jour locale : 2026-08-23. Atlas n'a pas été contrôlé depuis l'arrêt demandé pendant une convergence. Les observations Atlas ci-dessous sont donc le dernier état connu, pas une confirmation actuelle.

## Résultat

Mon Florian n'est pas déployé et rien ne permet de déclarer `monflorian.com` disponible. Le produit est publié et attesté, mais la chaîne centrale, la route, le certificat et le backend n'ont pas été activés ensemble.

La reprise suit [`RESTE-A-FAIRE.md`](RESTE-A-FAIRE.md). Aucun accès Atlas ne doit avoir lieu avant le jalon `READY_TO_DEPLOY` et une nouvelle autorisation explicite.

## Candidat produit

| Champ | Valeur |
| --- | --- |
| Branche | `main` |
| Source figée | `fc9212f876b32ea5821b235200802e5b51e50a59` |
| Vérification produit | Suite locale complète et trois workflows GitHub verts |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:ca1a9b3b2dbf33c999e5cee445cf51cd6974781a24d2dda70286c8e50142f471` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:9e8944e4cff11b3cbc17f6227b517717d48b8a1b3c47be0490c71afb36b2f87a` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:1fb74335d7a2bb8ad5b36a6ff28718cd766bafcac26d807ccbd716a13fa3b446` |
| Booking | Mode `external`, aucune affiliation prouvée |

Un commit documentaire ne remplace pas ce candidat. Toute modification du runtime ou du contrat de release impose un nouveau tuple attesté.

## Dernier état externe connu

- Les enregistrements A de l'apex et de `www` avaient été placés sur Atlas, sans modification des enregistrements mail et TXT.
- La clé OpenAI présente sur Atlas avait réussi une validation minimale. Sa valeur ne se trouve ni dans Git ni dans ce relevé.
- La PR centrale `vps-infra` 107 avait été fusionnée au commit `086d9d8894704a6755799bcb47ad3989f6b695ea`.
- La convergence de ce commit a été interrompue avant le rôle de déploiement. Il ne faut pas supposer qu'elle a convergé ensuite.
- Au dernier audit stable, Mon Florian n'avait ni conteneur, ni route active, ni certificat. Les sites existants étaient sains et aucun état edge n'était actif.

Le premier accès autorisé devra donc être un audit en lecture seule. Tout écart arrête la fenêtre avant mutation.

## Décision de simplification

La branche `codex/monflorian-edge-adoption` est gelée comme référence. Elle ajoute plus de 5 000 lignes entre le commit et les changements locaux et laisse 42 erreurs dans les tests ciblés. Elle ne constitue pas une base de livraison.

La voie retenue repart de `vps-infra` à `086d9d8`, réutilise le rôle edge et son rollback existants, et se limite à 14 fichiers et 450 lignes nettes. Aucun nouveau schéma générique d'adoption n'est autorisé pour cette V1.

## Prochaine preuve attendue

Le prochain changement d'état permis est `READY_TO_DEPLOY`. Il exige une PR centrale courte fusionnée, tous les contrôles verts, le tuple figé, les commandes d'activation et de rollback prêtes, puis l'accord explicite de l'opérateur pour contacter Atlas.
