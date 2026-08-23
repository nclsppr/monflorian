# AGENTS.md

Adaptateur local pour toute intervention automatisée ou assistée sur ce dépôt.

## Ordre de lecture

1. `PROJECT.md` pour le contrat, les sources et les commandes.
2. `FOUNDATION.md` pour la version, les profils et les dérogations.
3. `STATUS.md` et `ROADMAP.md` pour l'état et le séquencement.
4. Les ADR acceptées sous `docs/decisions/`.
5. `DESIGN.md` et `ASSETS.md` pour toute interface ou image.
6. `CHANGELOG.md` pour l'historique livré.

## Autorité

Les contraintes de sécurité et l'autorité explicite de la tâche précèdent les politiques locales. Un document ne donne pas l'autorisation d'activer un paiement, un fournisseur, un stockage, une production ou un domaine.

## Règles d'intervention

- Inspecter Git et préserver les changements sans rapport.
- Modifier les sources canoniques, jamais les captures ou rendus dérivés.
- Ne jamais modifier `docs/foundation/` localement.
- Maintenir le prototype sous `prototype/` comme expérience locale tant qu'une ADR ne le promeut pas.
- Ne jamais présenter le bouton à 50 €, le mini-site, le PDF, la carte ou les photos comme des capacités livrées sans preuve correspondante.
- Ne pas introduire backend, IA, paiement, authentification ou stockage de photos avant la décision et les profils Foundation requis.
- Conserver le logo de `assets/brand/monflorian-logo.png` comme master provisoire. Les captures sous `references/concepts/` ne sont pas normatives.
- Ajouter chaque changement livré à `CHANGELOG.md` et chaque décision structurante à une ADR.
- Exécuter `./scripts/verify.sh`, puis contrôler l'interface visible modifiée.
- Committer et pousser chaque tranche validée selon P18.

## Politique Git

- Branche canonique : `main`.
- Push direct autorisé tant que le dépôt reste personnel et la branche non protégée.
- Branche dédiée et revue dès qu'une protection ou une politique d'équipe l'exige.
- Aucun force-push ni réécriture de l'historique partagé.

## Langue et copie

- Appliquer le skill `unslop` à toute prose : documentation, interface, changelog et messages de commit. S'il n'est pas disponible, relire avec les mêmes critères avant livraison.
- Écrire avec une voix directe et précise. Retirer les formules toutes faites, le remplissage, les grands mots vagues, les promesses sans preuve et les tirets cadratins.
- Documentation technique en français ; code, identifiants et logs structurés en anglais.
- Tutoiement cohérent dans le produit.
- Florian est un conseiller ponctuel, pas une décoration omniprésente ni un chatbot.
- Les projections personnalisées sont signalées et ne remplacent pas les vraies photos de lieux.
- Aucune preuve sociale, garantie, disponibilité ou promesse commerciale sans source.
