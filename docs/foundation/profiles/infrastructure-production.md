# Profil infrastructure et production

Activer ce profil pour une modification de serveur, réseau, DNS, CI/CD, secrets, sauvegardes ou service de production.

Ce profil opérationnalise `P05`, `P08`, `P09`, `P10`, `P11`, `P14` et `P15`. Il décrit des contrôles, jamais une autorisation. L'autorité explicite de la tâche et la politique locale restent nécessaires avant toute mutation externe ou de production.

## Avant toute action

- Lire le runbook et les décisions d'architecture.
- Vérifier l'état réel, les versions, les services et la configuration chargée.
- Résoudre la cible exacte de toute commande destructive.
- Lister le contenu avant suppression ou synchronisation avec effacement.
- Prendre une sauvegarde adaptée au changement.
- Définir le rollback avant le déploiement.
- Arrêter au checkpoint humain pour secret, achat, accès, DNS sensible ou opération irréversible.

## Secrets et accès

- Ne jamais committer, imprimer ou coller une clé privée ou un token.
- Préférer un gestionnaire de secrets et des credentials courts ou fédérés. Un fichier ignoré avec permissions restrictives reste une exception locale documentée.
- Donner les permissions minimales à la CI.
- Éviter les comptes partagés.
- Protéger les comptes d'administration par MFA et séparer autant que possible admin, déploiement et runtime.
- Vérifier l'empreinte d'un hôte au lieu de faire confiance silencieusement à une découverte réseau.
- Traiter un groupe ou socket donnant un accès root comme un privilège root.
- En cas de fuite, révoquer ou faire tourner le secret, nettoyer les sorties et historiques exposés, mesurer l'accès possible et notifier selon la politique d'incident.

## Déploiement

Séquence canonique :

```text
build immuable
-> vérification
-> déploiement
-> healthcheck
-> parcours critique
-> observation
-> clôture ou rollback
```

- Déployer un digest, une version ou un SHA, pas un tag mutable seul.
- Séparer build et déploiement.
- Épingler les actions CI tierces et limiter les secrets pour les contributions non fiables.
- Ajouter provenance, inventaire de composants et scans selon le risque de la chaîne logicielle.
- Éviter la modification directe d'une surface sérieuse en production.
- Utiliser des releases atomiques ou une stratégie équivalente lorsque l'effacement de fichiers est possible.
- Valider une configuration avant reload.
- Vérifier les ports et routes réellement exposés.

## Données et sauvegardes

- Combiner selon le risque snapshot, configuration versionnée et sauvegarde hors site.
- Chiffrer les sauvegardes sensibles, séparer leurs accès de la production et vérifier leur intégrité.
- Utiliser une rétention immuable lorsque le modèle de menace le justifie.
- Sauvegarder les bases avant migration.
- Définir une politique de rétention explicite. La suppression par rétention est une opération autorisée et auditée, pas une exception cachée.
- Restaurer régulièrement un fichier et une base dans une cible isolée.
- Mesurer RPO et RTO lorsque la continuité compte.

## Observabilité

- Healthchecks locaux.
- Supervision externe pour détecter la perte du serveur ou du réseau.
- Logs avec rotation.
- Métriques et alertes actionnables.
- Procédure d'incident et contact d'escalade.
- Vérification après reboot si le redémarrage automatique fait partie de la promesse.
- Modèle de menace et scénarios d'abus pour un système critique.

## Gate minimale

- config validée ;
- dry-run ou diff lorsque disponible ;
- sauvegarde et rollback prêts ;
- artefact immuable ;
- permissions et secrets contrôlés ;
- déploiement ;
- santé, ports, routes, logs et parcours critique ;
- observation pendant une fenêtre adaptée ;
- restauration périodique prouvée ;
- configuration et runbook commités.
