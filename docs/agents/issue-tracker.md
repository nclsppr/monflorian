# Suivi des tickets : GitHub

Les tickets et spécifications de ce dépôt vivent dans les issues GitHub. Utiliser la CLI `gh` pour chaque opération.

## Conventions

- **Créer un ticket** : `gh issue create --title "..." --body "..."`. Utiliser un heredoc pour un corps multiligne.
- **Lire un ticket** : `gh issue view <numéro> --comments`, en récupérant aussi les labels et en filtrant les commentaires avec `jq` si nécessaire.
- **Lister les tickets** : `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, avec les filtres `--label` et `--state` adaptés.
- **Commenter** : `gh issue comment <numéro> --body "..."`.
- **Ajouter ou retirer un label** : `gh issue edit <numéro> --add-label "..."` ou `gh issue edit <numéro> --remove-label "..."`.
- **Fermer** : `gh issue close <numéro> --comment "..."`.

Déduire le dépôt depuis `git remote -v`. `gh` le fait automatiquement quand la commande s'exécute dans ce clone.

## Pull requests dans la file de triage

**PRs as a request surface: no.** Régler cette valeur sur `yes` si le dépôt décide plus tard de traiter les pull requests externes comme des demandes de fonctionnalité. Le skill `/triage` lit ce choix.

Si ce choix passe à `yes`, appliquer aux pull requests les mêmes labels et états qu'aux tickets avec les commandes `gh pr` :

- **Lire une pull request** : `gh pr view <numéro> --comments`, puis `gh pr diff <numéro>` pour le diff.
- **Lister les pull requests externes** : `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, puis garder les associations `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` et `NONE`.
- **Commenter, labelliser ou fermer** : `gh pr comment`, `gh pr edit --add-label`, `gh pr edit --remove-label` et `gh pr close`.

GitHub partage la même numérotation entre tickets et pull requests. Pour résoudre une référence comme `#42`, essayer `gh pr view 42`, puis `gh issue view 42`.

## Quand un skill demande de publier dans le suivi

Créer une issue GitHub.

## Quand un skill demande le ticket concerné

Exécuter `gh issue view <numéro> --comments`.

## Opérations de wayfinding

Le skill `/wayfinder` utilise un ticket principal comme carte et des sous-tickets comme tâches.

- **Carte** : un ticket unique avec le label `wayfinder:map`. Son corps contient les notes, les décisions prises et les zones à éclaircir. Créer la carte avec `gh issue create --label wayfinder:map`.
- **Sous-ticket** : une sous-issue GitHub rattachée à la carte avec l'endpoint des sous-issues via `gh api`. Si les sous-issues ne sont pas disponibles, ajouter le ticket à une liste de tâches dans la carte et placer `Part of #<carte>` au début de son corps. Utiliser un label `wayfinder:<type>` parmi `research`, `prototype`, `grilling` et `task`. Une fois pris, assigner le ticket à la personne qui conduit le travail.
- **Blocage** : utiliser les dépendances natives de GitHub. Ajouter une dépendance avec `gh api --method POST repos/<propriétaire>/<dépôt>/issues/<ticket>/dependencies/blocked_by -F issue_id=<id-base-du-bloquant>`. Récupérer cet identifiant numérique avec `gh api repos/<propriétaire>/<dépôt>/issues/<numéro> --jq .id`. Ce n'est ni le numéro `#<numéro>`, ni le `node_id`. Si les dépendances ne sont pas disponibles, placer `Blocked by: #<numéro>, #<numéro>` au début du corps.
- **Frontière de travail** : lister les sous-tickets ouverts de la carte, retirer ceux qui ont un bloqueur ouvert ou une personne assignée, puis prendre le premier dans l'ordre de la carte.
- **Prise en charge** : `gh issue edit <numéro> --add-assignee @me`. C'est la première écriture de la session.
- **Résolution** : commenter avec `gh issue comment <numéro> --body "<réponse>"`, fermer le ticket, puis ajouter dans les décisions de la carte un pointeur de contexte avec son lien.
