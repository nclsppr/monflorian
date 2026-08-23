# Profil expérience

Activer ce profil pour une exploration visuelle, une stack alternative, une démo, un prototype ou une fonctionnalité dont l'adoption n'est pas décidée.

Ce profil opérationnalise `P02`, `P03`, `P06`, `P07`, `P08` et `P12`.

## Contrat d'expérience

Documenter avant de commencer :

| Champ | Question |
| --- | --- |
| Hypothèse | Qu'apprend-on ? |
| Propriétaire | Qui conclut ? |
| Durée | Quand réévalue-t-on ? |
| Budget | Quel temps, coût et infrastructure maximum ? |
| Données | Synthétiques, anonymisées ou réelles ? |
| Surface | Où l'expérience est-elle visible ? |
| Succès | Quelle preuve justifie une promotion ? |
| Arrêt | Quelle preuve ou échéance provoque le retrait ? |

## Isolation

- Répertoire, route, environnement ou branche clairement séparé.
- Aucun remplacement silencieux du canon.
- Aucune migration irréversible pour une simple comparaison.
- Pas de secret ou donnée de production par défaut.
- Données synthétiques annoncées dans l'interface.
- `noindex` pour une surface publique non destinée aux moteurs.
- Dépendances expérimentales absentes du chemin de build canonique lorsque possible.

## Réversibilité

- Une commande ou procédure de stop.
- Une liste exacte des fichiers, routes, services et données à supprimer.
- Aucun contrat partagé modifié sans décision distincte.
- Un retour vers la surface canonique vérifié.
- Les artefacts utiles à l'apprentissage sont conservés, pas l'infrastructure inutile.

## Conclusion

À la date prévue, choisir explicitement :

- **promouvoir** : écrire une ADR, intégrer au canon et appliquer les profils produit ;
- **prolonger** : justifier un nouveau budget et une nouvelle date ;
- **arrêter** : retirer l'expérience et consigner la conclusion.

Une expérience sans conclusion devient une dépendance non assumée.
