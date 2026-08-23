# Defaults de nouveau projet

Ces choix accélèrent le démarrage. Ils ne sont pas universels. Un projet peut les remplacer dans `PROJECT.md` ou par ADR, avec une raison et les conséquences du changement.

## D01. Documentation et langage

- Documentation de travail en français.
- Code, identifiants, schémas, logs et commentaires de code en anglais.
- Ton sobre, précis et direct.
- Dates absolues au format `YYYY-MM-DD`. Éviter les dates relatives.
- Pas de tiret cadratin ou demi-cadratin dans la prose.
- Une commande canonique par opération. La documentation ne recopie pas son implémentation.
- `README.md` oriente. `PROJECT.md` décrit le contrat stable. `STATUS.md` décrit l'état vérifié. `ROADMAP.md` porte le séquencement. `CHANGELOG.md` trace les changements livrés. `AGENTS.md` décrit le mode d'intervention. Les ADR portent les décisions.

## D02. Git et livraison

`P18` impose le commit et le push de chaque tranche cohérente et vérifiée. Ce
default choisit seulement la destination et le mode de revue ; il ne permet pas
de conserver une tranche terminée uniquement en local.

Pour un dépôt personnel ou à propriétaire unique :

- branche canonique `main` ;
- push direct sur `main` lorsque la plateforme l'autorise ;
- branche dédiée lorsque `main` est protégée ou qu'une revue est exigée ;
- message impératif préfixé par le périmètre ;
- pas de pull request obligatoire.

Pour un dépôt d'équipe, public, réglementé ou à risque élevé, définir une politique de revue et de protection de branche. Le workflow Git est toujours local au projet.

Ces choix décrivent un workflow par défaut. Ils ne peuvent pas élargir
l'autorité de la tâche à un déploiement ou une autre mutation externe sans
rapport avec le dépôt.

## D03. Architecture et dépendances

- Commencer par le minimum exploitable, pas par l'architecture cible complète.
- Préférer une dépendance en moins tant qu'un besoin concret ne justifie pas son coût.
- Utiliser un gestionnaire de versions et des lockfiles.
- Utiliser le gestionnaire de versions pour les outils hôte et Docker Compose,
  imposé par `P19`, pour les services et dépendances exécutables.
- Épingler les images et artefacts de production par version immuable ou digest.
- Centraliser la configuration. Ne pas disperser de fallback de domaine, port, clé ou environnement dans le code.
- Séparer clairement développement, build, CI et production.

## D04. Commandes

Chaque projet expose autant que possible :

```text
install   installe exactement les dépendances attendues
dev       lance l'environnement de développement
verify    exécute tous les contrôles obligatoires
build     produit l'artefact livrable
stop      arrête proprement les services
reset     réinitialise uniquement l'état de développement documenté
```

Les noms peuvent varier. La capacité ne doit pas dépendre d'un outil d'agent particulier.

`dev`, `stop` et `reset` pilotent le `compose.yaml` canonique lorsqu'ils
s'appliquent. `reset` nomme précisément les volumes ou données supprimés et ne
devient jamais un alias implicite de `docker compose down --volumes`.

## D05. Qualité

- Automatiser les contrôles déterministes.
- Garder une vérification humaine ou visuelle lorsque le résultat est perceptif.
- Faire appeler la même commande `verify` par les hooks locaux et la CI.
- Tester la surface finale : navigateur, API, image, PDF, conteneur ou URL publique selon le changement.
- Corriger ou documenter un contrôle obsolète. Ne pas le présenter comme une garantie.

## D06. Interface

- Activer `profiles/web.md` pour toute interface web destinée à des utilisateurs.
- Définir l'intention visuelle dans `DESIGN.md` avant une refonte significative.
- Utiliser par défaut le niveau WCAG AA. Une cible différente est une dérogation explicite.
- L'identité, les budgets et la matrice de validation restent locaux au projet.

## D07. Décisions obligatoirement locales

Un nouveau projet doit trancher explicitement :

- expérimentation, prototype, produit ou système critique ;
- utilisateurs et données manipulées ;
- langues produit et documentation ;
- plateformes de développement et production ;
- architecture et stack ;
- contrat ou schéma canonique ;
- politique de branches, revue, version et release ;
- environnements et méthode de déploiement ;
- exigences de disponibilité, sauvegarde, restauration et observabilité ;
- matrice de tests ;
- design system et contraintes de marque ;
- licence, droits sur les données et usages de l'IA ;
- propriétaire et procédure d'escalade.

## D08. Documentation navigable

- Fournir `documentation.json` et un catalogue exhaustif dans tous les packs.
- Classer les Markdown publics, internes, de référence et archivés avant de les publier.
- Garder les Markdown comme sources éditoriales et les rendus comme dérivés.
- Utiliser Nimbus dans tous les projets conformément à `P16` et à `profiles/documentation-nimbus.md`.
- Épingler Nimbus, tester son adaptateur et intégrer son build à `verify`.
- Un autre moteur peut fournir une sortie complémentaire, sans remplacer le build Nimbus canonique.

## Révoquer un default

Un default peut être changé sans débat cérémoniel si l'impact reste local et évident. Une ADR est requise quand le changement :

- structure plusieurs modules ;
- introduit une dépendance durable ;
- modifie un contrat public ou des données ;
- change la sécurité, la disponibilité ou le déploiement ;
- rend un retour arrière coûteux ;
- devient une nouvelle règle pour les contributions futures.
