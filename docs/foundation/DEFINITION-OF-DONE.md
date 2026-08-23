# Définition de done

Cette liste est un cadre. Activer les sections qui correspondent au changement et documenter explicitement toute section non applicable.

Ces contrôles sont dérivés des principes et profils. Ils ne constituent pas une seconde source normative. `FOUNDATION.md` active durablement les profils que le projet doit savoir appliquer. Pour chaque unité de travail, la preuve de livraison sélectionne uniquement les profils et sections dont le déclencheur est rencontré.

## Noyau commun

Contrôles dérivés de `P02`, `P03`, `P04`, `P05`, `P07`, `P08`, `P09`, `P10`, `P17`, `P18` et `P19`.

- [ ] Le résultat répond au problème demandé, pas à une extension implicite.
- [ ] L'état actuel, la cible et les limites sont correctement nommés.
- [ ] Aucun fait, chiffre, utilisateur, validation ou état de production n'est inventé.
- [ ] Le worktree initial a été inspecté et les changements sans rapport sont préservés.
- [ ] Le diff est ciblé, relu et sans secret.
- [ ] Les décisions structurantes, notamment produit, et leurs compromis sont documentés dans une ADR.
- [ ] `CHANGELOG.md` décrit le changement livré et son impact observable.
- [ ] La source canonique et les artefacts dérivés sont alignés.
- [ ] La commande `verify` passe dans l'environnement pertinent.
- [ ] `compose.yaml` existe à la racine et `scripts/check_compose.py` passe.
- [ ] La documentation d'installation, exécution et vérification reste rejouable.
- [ ] Les limites de validation sont indiquées.

## Documentation et contenu

Contrôles dérivés de `P02`, `P03`, `P04`, `P10` et `P16`.

- [ ] Une idée normative n'est écrite qu'à un endroit.
- [ ] Chaque Markdown maintenu est classé exactement une fois dans `documentation.json`.
- [ ] Le catalogue documentaire est à jour et le fichier reste navigable.
- [ ] Sa visibilité publique, interne, de référence ou d'archive est correcte.
- [ ] Les liens, ancres, navigation et index sont cohérents.
- [ ] Les faits et attributions ont été vérifiés.
- [ ] Les traductions gardent une parité structurelle et sémantique si elles existent.
- [ ] Les dates sont absolues.
- [ ] Les archives, changelogs et audits datés ne sont pas présentés comme état actuel.
- [ ] Le rendu final a été contrôlé, pas seulement la source Markdown.
- [ ] Les tests de l'adaptateur, le typecheck, le build et le lint Nimbus passent.
- [ ] La collection générée par Nimbus n'a pas été modifiée à la main.
- [ ] Une publication Nimbus expose uniquement les audiences explicitement autorisées.

## Interface web ou produit

Contrôles dérivés de `P10`, `P13`, `P14` et de `profiles/web.md`.

- [ ] Le parcours principal fonctionne sur mobile et desktop.
- [ ] Les thèmes ou modes supportés ont été testés.
- [ ] La navigation clavier est complète et le focus reste visible.
- [ ] Les états ARIA suivent l'état réel.
- [ ] Les contrastes atteignent le niveau défini.
- [ ] Aucune information n'est portée uniquement par la couleur.
- [ ] Les cibles tactiles sont adaptées.
- [ ] `prefers-reduced-motion` est respecté.
- [ ] Les états chargement, vide, erreur, succès et indisponibilité sont traités.
- [ ] Aucun débordement horizontal ou erreur console inattendue n'est présent.
- [ ] Les routes, métadonnées, canonical, indexation et partage sont corrects si publics.
- [ ] Les budgets de performance sont respectés sur une cible représentative.
- [ ] La surface publiée a été vérifiée visuellement.

## API, backend et données

Contrôles dérivés de `P10`, `P11`, `P13`, `P14` et de `profiles/backend-data.md`.

- [ ] Le contrat canonique est mis à jour avant ou avec l'implémentation.
- [ ] Les changements incompatibles sont détectés et explicités.
- [ ] Les migrations sont versionnées et testées.
- [ ] Une sauvegarde existe avant toute migration risquée.
- [ ] La restauration ou le rollback a été testé dans une cible isolée.
- [ ] Les opérations sensibles sont idempotentes ou protégées contre les reprises.
- [ ] Autorisation, isolation des tenants et refus d'accès sont testés.
- [ ] Les erreurs externes, timeouts, retries et doublons sont traités.
- [ ] Les logs et métriques utiles ne contiennent pas de secret ou donnée personnelle inutile.
- [ ] Les sondes de santé vérifient ce qui est réellement nécessaire au service.

## Artefacts générés

Contrôles dérivés de `P03`, `P04`, `P09` et `P10`.

- [ ] La source éditoriale ou technique est identifiée.
- [ ] La génération est déterministe et scriptée.
- [ ] Le dérivé n'a pas été modifié à la main.
- [ ] Source, dérivé et consommateurs sont livrés ensemble.
- [ ] Les caches ou versions de ressources ont été invalidés si nécessaire.
- [ ] Le format, le poids, les dimensions, la transparence et la provenance ont été contrôlés.

## Infrastructure et production

Contrôles dérivés de `P08`, `P10`, `P11`, `P14`, `P15` et de `profiles/infrastructure-production.md`.

- [ ] La cible exacte de toute action destructive a été listée.
- [ ] Un checkpoint humain existe pour l'accès, les secrets, les achats et les opérations irréversibles.
- [ ] La configuration a été validée avant reload ou restart.
- [ ] Le déploiement utilise un artefact immuable.
- [ ] Le rollback est concret et ne dépend pas d'une reconstruction incertaine.
- [ ] Les permissions sont minimales et les secrets ne sont ni affichés ni versionnés.
- [ ] La santé, les ports, les routes et les dépendances ont été vérifiés après déploiement.
- [ ] Les sauvegardes sont hors site lorsque le risque l'exige.
- [ ] Une restauration représentative a été prouvée.
- [ ] La supervision externe complète la supervision hébergée avec le service.

## Docker Compose et environnement local

Contrôles dérivés de `P09`, `P10`, `P13` et `P19`.

- [ ] `compose.yaml` contient tous les services et dépendances du parcours local intégré.
- [ ] Un raccourci hôte éventuel ne constitue pas l'unique chemin documenté.
- [ ] Chaque image externe est épinglée par digest ; un service construit localement possède une source et un contexte explicites.
- [ ] Chaque service long possède un healthcheck représentatif.
- [ ] Chaque commande finie sans healthcheck porte `foundation.lifecycle=job`.
- [ ] `python3 scripts/check_compose.py` et `docker compose config` passent.
- [ ] `docker compose up --build --wait` atteint un état sain pour tout projet qui possède des services.
- [ ] Les URLs, ports ou parcours utiles sont sondés depuis l'environnement lancé.
- [ ] `docker compose down` arrête proprement sans effacer les volumes par défaut.
- [ ] Toute commande de reset cible explicitement les données supprimées.
- [ ] La CI exécute la même commande `verify` et ne contourne pas le contrôle Compose.

## Expérience

Contrôles dérivés de `P02`, `P08`, `P12` et de `profiles/experiment.md`.

- [ ] L'expérience est nommée et étiquetée comme telle.
- [ ] Elle ne remplace pas silencieusement la surface canonique.
- [ ] Elle est isolée des données et secrets de production.
- [ ] Les données de démonstration sont signalées.
- [ ] L'indexation publique est désactivée si nécessaire.
- [ ] Le coût et la date de réévaluation sont définis.
- [ ] Une procédure de stop et de suppression existe.
- [ ] Les critères de promotion en produit sont écrits.

## Livraison et clôture

Contrôles dérivés de `P05`, `P08`, `P10`, `P14`, `P17` et `P18`.

- [ ] Le commit ne contient que l'unité de travail.
- [ ] Le SHA ou artefact final a ses contrôles verts.
- [ ] Chaque tranche terminée a été commitée après ses validations applicables.
- [ ] Le SHA final existe sur la branche distante attendue : branche canonique si l'écriture directe est autorisée, branche dédiée sinon.
- [ ] Les contrôles distants disponibles ont été observés ; tout blocage de push est exact, attribué et laisse un SHA local reprenable.
- [ ] Le déploiement requis a réussi lorsqu'il fait partie du périmètre autorisé.
- [ ] L'URL, le service ou le fichier final a été contrôlé.
- [ ] Les preuves utiles sont résumées.
- [ ] Les risques restants et actions externes sont séparés du travail terminé.
- [ ] La roadmap ou le backlog canonique reflète la suite réelle.
