# ADR-0003 : registre canonique des secrets Atlas

- Statut : accepté
- Statut d'implémentation : règle adoptée ; registre central proposé dans `vps-infra` PR #99
- Date : 2026-08-23
- Dernière vérification : 2026-08-23
- Propriétaire : `nclsppr`
- Domaine : sécurité et production
- Remplace : aucune
- Remplacé par : aucune

## Contexte

Mon Florian définit les consommateurs de ses secrets. Le dépôt `vps-infra`
contrôle leur chemin, leur matérialisation et leur chargement sur Atlas. Une
liste conservée seulement dans ce dépôt produit ne suffirait pas à reconstruire
un hôte vierge et pourrait diverger du plan de contrôle.

La préparation, la rotation et la révocation d'un secret peuvent commencer dans
l'un ou l'autre dépôt. Leur état contractuel doit donc suivre une règle commune
et révisable sans publier le secret.

## Problème à décider

Comment coordonner un secret Mon Florian avec Atlas sans placer sa valeur ou une
empreinte dérivée dans un dépôt public ?

## Décision

Adopter `nclsppr/vps-infra/secrets/registry.json` comme registre canonique des
contrats et métadonnées de tous les secrets Mon Florian déployés sur Atlas.

- Une tâche qui prévoit ou exige un déploiement, une rotation ou une révocation
  met à jour le registre central avant sa clôture.
- La tâche committe la génération cible avant l'opération autorisée. Une
  vérification en lecture seule met ensuite à jour la génération observée et
  l'état de l'hôte.
- Le dépôt produit conserve le contrat du consommateur. `vps-infra` conserve le
  contrat de matérialisation et l'état public observé sur Atlas.
- Git contient seulement le contrat et les métadonnées. Il ne contient jamais
  une valeur, une clé privée, un jeton, un fichier déchiffré, un condensat
  calculé à partir de la valeur ni un chemin source privé.
- Si la tâche ne peut pas modifier `vps-infra`, elle signale le blocage et ne se
  déclare pas terminée.

Cette décision ne crée aucun secret et n'autorise ni fournisseur, ni mutation
d'Atlas, ni activation de Mon Florian. Le registre décrit la reconstruction des
fichiers requis. Il ne constitue pas une sauvegarde des valeurs.

## Conséquences

La revue d'un changement Mon Florian peut vérifier le contrat produit et sa
contrepartie Atlas. L'historique Git du registre conserve les générations et
les états publics sans exposer le contenu.

Cette coordination ajoute une dépendance inter-dépôts. Une tâche reste bloquée
si elle ne peut pas mettre à jour les deux sources nécessaires. La restauration
des valeurs dépend toujours du mécanisme externe déclaré par `vps-infra`.

## Alternatives refusées

- Conserver une liste propre à Mon Florian. Deux registres pourraient diverger
  et le plan de contrôle Atlas resterait incomplet.
- Versionner les valeurs ou leurs empreintes. Cette option exposerait un secret
  ou un identifiant corrélable sans fournir une restauration sûre.
- Noter seulement l'opération dans le changelog. Cette trace ne décrit ni le
  chemin attendu, ni le consommateur, ni la génération observée.

## Vérification

`AGENTS.md` impose la coordination avant clôture et renvoie vers cette ADR. Le
catalogue documentaire classe cette décision. Les contrôles du dépôt vérifient
les liens et la documentation. La PR coordonnée de `vps-infra` vérifie le
schéma du registre et ses contrats exécutables.

## Rollback et réexamen

Remplacer cette ADR seulement si Atlas change de plan de contrôle ou de registre
canonique. Le retrait d'un secret exige d'abord la preuve qu'aucun consommateur
ne le charge, puis la mise à jour coordonnée du registre central.

## Références

- [`vps-infra` ADR-0017](https://github.com/nclsppr/vps-infra/blob/203b5ff675b82e17c3107ca6ae75a05fc533fd15/docs/decisions/0017-versioned-atlas-secret-registry.md)
- [`vps-infra` PR #99](https://github.com/nclsppr/vps-infra/pull/99)
