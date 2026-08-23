# Principes invariants

Ces principes s'appliquent à tout projet, quelle que soit sa stack. Chaque principe associe une règle, sa raison et une preuve minimale. Une exception doit être explicite, limitée et documentée.

## P01. Comprendre le vrai problème avant de choisir la solution

**Règle.** Commencer par les utilisateurs, le contexte, les contraintes, les risques, les non-objectifs et le résultat attendu. La technologie vient ensuite.

**Pourquoi.** Une solution élégante qui résout le mauvais problème ajoute une dette sans créer de valeur.

**Preuve minimale.** Un brief léger pour une exploration, ou `PROJECT.md` pour un projet durable, décrit le problème, les utilisateurs, le périmètre et les critères de succès avant la première décision de stack.

## P02. Dire la vérité, y compris quand elle est incomplète

**Règle.** Ne jamais inventer un fait, une métrique, un client, une capacité, une validation, une responsabilité ou un état de production. Distinguer clairement `actuel`, `cible`, `expérience`, `exemple` et `hypothèse`.

**Pourquoi.** Une information plausible mais fausse devient rapidement une décision, une promesse ou un risque.

**Preuve minimale.** Les affirmations importantes ont une source. Les inconnues et validations non réalisables sont nommées. Les données synthétiques sont signalées comme telles.

## P03. Cartographier les sources de vérité

**Règle.** Chaque concept important possède une source canonique identifiée : produit, roadmap, architecture, contrat, schéma, design, configuration, opérations et décisions.

**Pourquoi.** Le mot « canonique » est inutile s'il désigne plusieurs fichiers concurrents.

**Preuve minimale.** `PROJECT.md` contient une table des sources. Les artefacts dérivés, archives et snapshots sont étiquetés comme tels.

## P04. Une idée normative, une seule place

**Règle.** Ne pas recopier une règle, une commande ou une donnée à synchroniser manuellement. Référencer la source ou automatiser la génération.

**Pourquoi.** La duplication documentaire finit par produire des instructions incompatibles.

**Preuve minimale.** Une recherche du concept mène à une source normative et à des références, pas à plusieurs copies éditables. Les fichiers générés déclarent leur source et ne sont pas modifiés à la main.

## P05. Distinguer l'intention de la réalité

**Règle.** Les ADR et documents canoniques expriment l'intention. Le code, la configuration et l'environnement réellement exécuté expriment l'état opérationnel. Un écart est une dérive à rendre visible.

**Pourquoi.** Ni une documentation souhaitée ni un test local isolé ne prouvent à eux seuls ce qui tourne réellement.

**Preuve minimale.** Avant une décision ou une livraison, inspecter le dépôt, le worktree, les versions, la configuration et, si pertinent, le processus ou service lancé.

## P06. Choisir la complexité proportionnée

**Règle.** Utiliser l'architecture et les dépendances les plus simples qui satisfont les contraintes démontrées. Ne pas introduire un outil pour sa nouveauté ou pour dupliquer une capacité existante.

**Pourquoi.** Toute dépendance crée un coût de compréhension, de mise à jour, de sécurité et d'exploitation.

**Preuve minimale.** Une décision structurante décrit le besoin non couvert, les alternatives et le coût d'exploitation. Le projet sait expliquer pourquoi chaque couche importante existe.

## P07. Documenter les décisions, pas seulement le résultat

**Règle.** Toute décision structurante, y compris une décision produit importante, est versionnée avec son contexte, ses alternatives, ses conséquences, son plan de vérification et ses conditions de réexamen.

**Pourquoi.** Sans compromis explicites, une équipe relance les mêmes débats ou conserve une décision devenue invalide.

**Preuve minimale.** Une ADR acceptée existe avant ou avec l'implémentation. Une décision remplacée pointe vers sa remplaçante.

## P08. Respecter l'autorité et livrer une unité cohérente

**Règle.** Une modification couvre un résultat précis, ses tests, sa documentation et ses artefacts dérivés. Elle préserve les changements sans rapport et évite les nettoyages opportunistes. Un runbook décrit une procédure, il n'autorise pas à l'exécuter. Une cible explicite ne vaut pas permission. Toute mutation externe, publication ou action de production doit rester dans l'autorité explicite de la tâche et la politique locale.

**Pourquoi.** Un diff ciblé est plus facile à comprendre, valider, annuler et attribuer.

**Preuve minimale.** Le diff final correspond au périmètre annoncé. Les fichiers ajoutés au commit ont tous un lien direct avec le résultat. Les mutations externes réalisées étaient autorisées et leurs cibles sont nommées.

## P09. Rendre l'exécution reproductible

**Règle.** Versions, dépendances, variables, commandes de lancement, arrêt, vérification et réinitialisation doivent être explicites. Les contrôles critiques vivent dans une commande neutre, utilisable par un humain, un agent et la CI.

**Pourquoi.** Un hook propre à un outil ou une commande connue d'une seule personne ne constitue pas une protection.

**Preuve minimale.** Un nouveau clone peut installer, lancer et vérifier le projet avec les commandes documentées. Les lockfiles et images sont épinglés selon le niveau de risque.

## P10. Vérifier proportionnellement au risque

**Règle.** La validation couvre la couche réellement modifiée et la surface finale concernée. Elle combine automatisation, inspection et test manuel lorsque chacun apporte une preuve différente.

**Pourquoi.** Un build vert ne prouve pas une interface correcte, un contrat compatible, un déploiement sain ou une restauration possible.

**Preuve minimale.** La définition de done active les gates pertinentes. Le compte rendu cite les commandes, environnements et résultats observés, sans généraliser au-delà.

## P11. Sécuriser les changements et tester le retour arrière

**Règle.** Les secrets ne vivent ni dans Git, ni dans les logs, ni dans les conversations. Toute action destructive résout d'abord sa cible. Les données importantes sont sauvegardées avant migration et la restauration est testée.

**Pourquoi.** Une sauvegarde non restaurée, un secret imprimé ou une cible implicite ne sont pas des protections.

**Preuve minimale.** Les secrets sont injectés par un mécanisme dédié. Les changements risqués ont un checkpoint, un rollback et, pour les données, une preuve de restauration.

## P12. Isoler les expériences

**Règle.** Une expérience est clairement étiquetée, séparée de la surface canonique, sans données réelles par défaut, et possède une commande ou procédure de retrait.

**Pourquoi.** Un prototype qui partage silencieusement les routes, données ou contrats de production devient une migration accidentelle.

**Preuve minimale.** Le profil expérience documente son but, son propriétaire, sa durée, ses limites, son accès, ses données et son chemin de suppression.

## P13. Concevoir pour l'accès, la résilience et le coût réel

**Règle.** L'accessibilité, la performance, les états d'erreur, les fallbacks et l'exploitation ne sont pas des finitions. Ils sont dimensionnés avec le produit.

**Pourquoi.** Une fonctionnalité inaccessible, trop lente, non observable ou impossible à récupérer n'est pas terminée.

**Preuve minimale.** Les budgets et scénarios pertinents sont définis puis testés : clavier, focus, contraste, mouvement réduit, mobile, charge, erreurs, dégradation, santé et restauration selon le projet.

## P14. Rester proche de la production

**Règle.** La livraison ne s'arrête pas au code local. Le projet documente comment il est déployé, observé, sauvegardé, restauré et diagnostiqué dans son environnement réel.

**Pourquoi.** La production est l'endroit où les hypothèses d'architecture rencontrent les dépendances, les données et les utilisateurs.

**Preuve minimale.** Le dernier artefact ou SHA livré est vérifié sur sa surface cible. Les limites externes non vérifiées sont explicitement laissées ouvertes.

## P15. Construire un système, pas un héros

**Règle.** Le contexte, la responsabilité, les runbooks et les commandes utiles sont partagés. Une opération critique ne dépend pas d'une mémoire individuelle ou d'une commande magique.

**Pourquoi.** La connaissance cachée augmente le temps de reprise et le risque d'incident.

**Preuve minimale.** Chaque zone critique a un propriétaire, une documentation de reprise et un chemin de vérification exécutable par une autre personne ou un autre agent.

## P16. Donner une place et une audience à chaque Markdown

**Règle.** Tout fichier Markdown maintenu appartient à la documentation du
projet. Il est classé comme public, interne, référence ou archive et reste
navigable depuis le catalogue et Nimbus. Nimbus est le moteur documentaire
obligatoire de tous les projets ; un autre moteur peut le compléter, pas le
remplacer. Un rendu généré ne devient jamais une seconde source éditoriale.

**Pourquoi.** Un fichier orphelin disparaît de la mémoire collective. Publier
indistinctement tous les Markdown expose à l'inverse des runbooks, preuves ou
informations internes qui n'ont pas la bonne audience.

**Preuve minimale.** `documentation.json` classe chaque `.md` exactement une
fois, `DOCUMENTATION-CATALOG.md` fournit une navigation exhaustive et la
commande `verify` contrôle le catalogue, l'adaptateur et le build Nimbus. La
collection générée n'est pas éditée et une publication respecte les audiences.

## P17. Tracer chaque changement livré

**Règle.** Chaque changement livré rejoint `CHANGELOG.md`. L'entrée décrit
l'impact observable, la date ou la version concernée et, si nécessaire, la
migration. Git conserve le diff technique exhaustif ; le changelog en donne une
lecture durable et orientée projet.

**Pourquoi.** Une suite de commits ne permet pas à elle seule de comprendre ce
qui a changé pour les utilisateurs, les opérateurs ou les prochains
contributeurs.

**Preuve minimale.** Le changement figure sous une section non publiée ou dans
la version livrée. Le commit permet de retrouver exactement les fichiers
modifiés et une décision importante pointe aussi vers son ADR.

## P18. Committer et pousser chaque tranche validée

**Règle.** Dès qu'une tâche autorise la modification d'un dépôt Git doté d'un
remote, chaque tranche cohérente et vérifiée est commitée puis poussée sans
attendre d'autres travaux. Le push vise la branche canonique lorsque l'écriture
directe y est autorisée ; si elle est protégée ou soumise à revue, il vise une
branche dédiée au périmètre. Une tranche terminée ne reste pas uniquement dans
le worktree ou l'historique local. Le commit ne mélange pas de changements sans
rapport et ne fige pas volontairement un état connu comme invalide.

Ce principe ne peut pas être désactivé par un default ou une dérogation de
convenance. Les seules exceptions sont une tâche explicitement en lecture seule
ou limitée au local, une interdiction d'autorité supérieure, l'absence de remote
ou un blocage externe de réseau, d'authentification ou de plateforme. Le SHA
local et le blocage exact sont alors signalés, et le push reprend dès que le
blocage disparaît.

**Pourquoi.** Un travail terminé mais seulement local reste invisible,
fragile, difficile à relire et impossible à reprendre de façon fiable par une
autre personne ou la CI. Des unités petites et publiées réduisent la perte de
travail, raccourcissent les revues et rendent le rollback précis.

**Preuve minimale.** Le commit contient une seule tranche validée, son SHA est
présent sur la branche distante attendue et l'état final du worktree est connu.
La branche canonique est utilisée directement si sa politique le permet ; sinon
la branche distante et le chemin de revue sont nommés. Les contrôles distants
disponibles sont observés avant de déclarer la livraison terminée.

## P19. Orchestrer l'environnement local avec Docker Compose

**Règle.** Tout projet versionne un `compose.yaml` à sa racine et utilise Docker
Compose comme chemin canonique d'exécution intégrée en local. Les applications,
bases de données, files, intercepteurs de courriel, stockages, proxies et autres
dépendances nécessaires au parcours local y sont déclarés. Une commande lancée
directement sur l'hôte peut accélérer une boucle interne, mais ne remplace pas
ce parcours commun. Un pack Minimal sans aucun processus local peut conserver
`services: {}` ; un pack Standard, Full ou Critical déclare au moins un service.

Les images externes sont épinglées par digest. Un service long possède un
healthcheck ; une commande finie sans healthcheck porte explicitement le label
`foundation.lifecycle=job`. Ce principe ne peut pas être désactivé par un
default ou une dérogation locale. Une contrainte supérieure ou une plateforme
sans Docker peut empêcher l'exécution, jamais supprimer le contrat versionné ni
sa gate de CI ; le blocage exact est alors documenté.

**Pourquoi.** Un ensemble de commandes hôte et de versions implicites produit
des environnements différents selon la machine et laisse les dépendances
réelles hors de la vérification. Compose fournit un contrat portable pour
lancer, attendre, diagnostiquer et arrêter le même graphe de services.

**Preuve minimale.** `scripts/check_compose.py` est appelé par `verify` et la CI,
valide la configuration, les digests, les healthchecks et le pack. Pour tout
projet qui possède un service, `docker compose up --build --wait` atteint un
état sain, les sondes du parcours principal passent, puis `docker compose down`
arrête l'environnement sans effacer les données par défaut.
