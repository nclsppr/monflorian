# Profil obligatoire documentation Nimbus

Ce profil est activé automatiquement dans tous les projets. Il transforme les
Markdown classés en documentation navigable, recherchable et consommable par
des humains ou des agents.

## Nature du profil

- **Norme obligatoire.** Ce profil opérationnalise `P03`, `P04`, `P09`, `P10`, `P13`, `P14`, `P16` et `P17`.
- **Moteur canonique.** Nimbus est un invariant du socle. Une dérogation locale ne peut pas le retirer.
- **Source unique.** Les Markdown classés par `documentation.json` restent éditoriaux. La collection Nimbus est générée et ignorée par Git.

## Installation versionnée

- Conserver le scaffold sous `docs-nimbus/` et le suivre avec `nimbus.json`.
- Utiliser Node `22.12.0` ou plus récent.
- Épingler `@cloudflare/nimbus-docs` à `0.8.2` et committer le lockfile npm.
- Enregistrer la version, le dossier de configuration et la commande canonique dans `PROJECT.md`.
- Créer une ADR si Nimbus devient une surface publiée.
- Ne pas copier sans examen l'adaptateur d'un autre projet : front matter, callouts, liens et index sont des contrats locaux.

## Collections et audiences

- Consommer `documentation.json` ou un adaptateur déterministe issu de ce manifeste.
- Le build local peut réunir toutes les collections pour la navigation et la vérification.
- Publier uniquement les collections explicitement autorisées, publiques par défaut.
- Garder les collections `internal`, secrets, runbooks sensibles et preuves privées hors du build public.
- Intégrer les collections `reference` seulement si leur audience et leur stabilité le permettent.
- Conserver les archives identifiables comme historiques et non courantes.

## Source et dérivés

- Ne jamais modifier la collection générée par Nimbus.
- Tester toute conversion de front matter, lien, ancre, callout ou index.
- Régénérer depuis les sources avant typecheck, build et lint.
- Ignorer dans Git la collection et le site générés, sauf décision contraire motivée.
- Livrer ensemble source, adaptateur, configuration et changement de navigation.

## Vérification

La commande documentaire canonique doit au minimum exécuter :

1. la vérification du catalogue exhaustif ;
2. les tests de l'adaptateur ;
3. le typecheck du site ;
4. le build statique ;
5. l'indexation ou la recherche ;
6. le lint Nimbus ;
7. une revue navigateur des audiences et routes concernées.

Une sortie locale ne prouve pas la publication. Vérifier séparément l'URL, le
chemin de base, l'indexation et les variantes Markdown ou `llms.txt` réellement
livrées.

## Mise à jour ou retrait

- Lire les changements amont et vérifier `nimbus-docs outdated` depuis le package Nimbus.
- Mettre à jour version et lockfile dans une unité isolée.
- Rejouer l'adaptateur, le build complet et la revue des routes.
- Conserver un rollback vers le dernier artefact ou commit vérifié.
- Le retrait de Nimbus exige une nouvelle version de Project Foundation et une ADR qui remplace l'ADR-0003.

## Gate minimale

- chaque Markdown maintenu est classé exactement une fois ;
- aucune collection interne n'entre dans la sortie publique ;
- version et lockfile Nimbus sont épinglés ;
- collection générée absente de Git ;
- adaptateur testé ;
- build, recherche et lint verts ;
- navigation et routes finales vérifiées ;
- limites de publication explicitement consignées.
