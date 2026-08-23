# Profil backend et données

Activer ce profil pour une API, un service, une base de données, un paiement ou une intégration externe.

Ce profil opérationnalise `P03`, `P04`, `P09`, `P10`, `P11`, `P13` et `P14`.

## Contrat

- Désigner un contrat canonique : OpenAPI, schéma, événements ou interface versionnée.
- Modifier le contrat avant ou avec l'implémentation.
- Générer les clients et artefacts depuis cette source.
- Détecter les incompatibilités avant livraison.
- Documenter les codes d'erreur et règles d'autorisation.

## Données

- Migrations versionnées, jamais de DDL manuel non tracé.
- Sauvegarde avant migration risquée.
- Test de migration sur un état représentatif.
- Rollback ou stratégie de correction explicite.
- Test de restauration dans une cible isolée, jamais sur la production servant des utilisateurs.
- Rétention et suppression documentées.
- Identifiants et contraintes cohérents avec les invariants métier.

## Concurrence et reprise

- Identifier les doubles soumissions, retries, webhooks dupliqués et races.
- Utiliser idempotence, verrou ou contrainte transactionnelle selon le risque.
- Ne jamais déduire un état financier du seul retour navigateur.
- Séparer intention, confirmation externe et état métier.
- Tester les transitions interdites et les reprises après échec.

## Sécurité

- Authentification et autorisation séparées.
- Autorisation appliquée côté backend, jamais confiée à la seule vue.
- Isolation des utilisateurs, organisations ou tenants testée.
- Secrets injectés et rotatifs.
- Données minimales transmises aux tiers et à l'IA.
- Logs sans secret ni donnée personnelle inutile.
- Timeouts et limites sur les appels externes.

## Opérations

- Healthchecks utiles et non trompeurs.
- Logs structurés et corrélables.
- Métriques techniques et métier sans PII.
- Observabilité non nécessaire au fonctionnement du service.
- Procédure de démarrage, arrêt, redémarrage et diagnostic.
- Limites de ressources explicites.

## Gate minimale

- format, analyse statique et tests unitaires ;
- tests d'intégration avec les vraies frontières importantes ;
- validation du contrat et détection de diff ;
- migration aller, restauration ou stratégie de correction ;
- autorisation et isolation ;
- idempotence et erreurs externes ;
- build de l'artefact de production ;
- démarrage dans l'environnement cible ;
- healthcheck et parcours critique.
