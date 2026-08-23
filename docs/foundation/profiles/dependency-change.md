# Profil changement de dépendance

Activer ce profil pour l'ajout, la mise à jour, le remplacement ou le retrait d'un package, runtime, image, action CI, modèle, service externe ou autre composant tiers.

L'activation est enregistrée durablement dans `FOUNDATION.md`. Les gates de ce
profil ne s'appliquent qu'aux unités qui modifient une dépendance. Si le profil
n'était pas encore vendorisé, l'ajouter depuis le commit du socle épinglé avant
de réaliser le changement.

## Nature du document

- **Norme opt-in.** Ce profil opérationnalise `P01`, `P02`, `P03`, `P05`, `P06`, `P07`, `P08`, `P09`, `P10`, `P11`, `P13` et, pour une dépendance de production, `P14`.
- **Formulaire.** Le choix durable vit dans `PROJECT.md`, l'inventaire canonique ou une ADR selon son impact. Ce profil ne constitue pas un registre de dépendances.
- **Preuve.** Le lockfile, le digest, les scans datés, les tests, le build, les mesures et le plan de retrait observé sont consignés dans une preuve de livraison. Le nom d'une dépendance ou un build vert isolé ne suffit pas.

## Besoin et alternatives

- Décrire le besoin concret qui n'est pas couvert.
- Vérifier qu'une capacité existante, la plateforme standard ou une solution plus simple ne suffit pas.
- Nommer les consommateurs, le propriétaire et la criticité de la dépendance.
- Classer la dépendance : développement, build, test, CI, runtime, données ou service externe.
- Documenter le coût d'une implémentation locale et le coût d'exploitation du tiers.
- Créer une ADR si la dépendance structure plusieurs modules, modifie un contrat ou des données, augmente durablement le risque, ou rend le retrait coûteux.

## Origine et confiance

- Utiliser une source officielle ou explicitement approuvée.
- Vérifier l'identité du package, de l'image, de l'éditeur ou du fournisseur afin d'éviter une dépendance homonyme ou détournée.
- Examiner la maintenance, la fréquence des versions, les avis de sécurité et les changements de propriétaire pertinents.
- Identifier les dépendances transitives, scripts d'installation, binaires téléchargés et permissions demandées.
- Vérifier signature, checksum, digest ou provenance lorsque disponible et proportionné au risque.
- Enregistrer la dépendance dans l'inventaire ou le SBOM utilisé par le projet.

## Licence et droits

- Identifier la licence et sa compatibilité avec la distribution et l'usage prévus.
- Conserver les notices, attributions et obligations de redistribution nécessaires.
- Vérifier séparément les conditions applicables au code, aux données, aux modèles et au contenu fourni.
- Documenter toute restriction d'usage, de territoire, de volume ou de modification.
- Bloquer l'adoption tant qu'une licence ou un droit nécessaire reste inconnu pour une surface distribuée ou publique.

## Version et reproductibilité

- Epingler une version immuable ou un digest selon le type et le risque.
- Enregistrer séparément la version actuelle observée et la version cible sans présenter la cible comme installée.
- Mettre à jour et committer le lockfile ou l'inventaire canonique.
- Déclarer les plateformes, runtimes et versions compatibles.
- Lire les notes de version, migrations et changements incompatibles pour une mise à jour.
- Définir la politique de mise à jour, la cadence de réexamen et le propriétaire.
- Prévoir un rollback vers une version connue sans dépendre d'une reconstruction incertaine.

## Vulnérabilités et chaîne logicielle

- Exécuter les contrôles de vulnérabilités et de provenance retenus par le projet.
- Dater les résultats et conserver l'outil, sa version, la base consultée et les limites du scan.
- Traiter chaque vulnérabilité pertinente ou documenter son exposition réelle, la mesure compensatoire, le propriétaire et la date de réexamen.
- Limiter les permissions, secrets, accès réseau et actions de build au strict nécessaire.
- Tester les contributions non fiables sans leur donner accès aux secrets ou aux environnements protégés.
- Ne pas présenter l'absence de résultat d'un scanner comme une absence certaine de vulnérabilité.

## Données et confidentialité

Pour une dépendance qui reçoit, stocke ou produit des données, documenter :

- les catégories de données et la finalité ;
- la minimisation et les champs réellement transmis ;
- la rétention, la suppression, l'export et la portabilité ;
- les sous-traitants, régions ou transferts applicables ;
- l'usage éventuel des données pour entraînement, analyse ou publicité ;
- les scopes d'authentification et permissions ;
- le chiffrement, la journalisation et les procédures d'incident ;
- la méthode de test sans donnée réelle lorsque possible.

## Coût, fiabilité et exploitation

- Mesurer le coût fixe, variable et humain avec ses seuils d'alerte.
- Documenter quotas, limites, latence, disponibilité et politique de support.
- Définir timeouts, retries, idempotence et comportement en cas d'indisponibilité lorsque pertinent.
- Prévoir observabilité et diagnostic sans rendre le service tiers nécessaire à l'observabilité du projet.
- Identifier le verrouillage technique ou contractuel et le coût de migration des données.
- Tester un mode dégradé, un fallback ou un arrêt sûr selon la criticité.

## Retrait ou remplacement

- Définir comment désactiver la dépendance sans casser silencieusement ses consommateurs.
- Identifier les fichiers, configurations, secrets, données, contrats et artefacts à retirer.
- Prévoir l'export, la migration ou la suppression vérifiable des données.
- Nommer l'alternative ou le comportement sans dépendance.
- Tester le rollback d'une mise à jour et la procédure de retrait lorsqu'ils sont critiques.
- Révoquer les credentials et permissions devenus inutiles après retrait.

## Gate minimale

- besoin non couvert et alternatives consignés ;
- origine, propriétaire et consommateurs identifiés ;
- licence et obligations compatibles ;
- version ou digest épinglé et lockfile aligné ;
- vulnérabilités, provenance et permissions évaluées à une date nommée ;
- données transmises, rétention et droits documentés ;
- coût, limites, modes d'échec et observabilité évalués ;
- tests, build et surface finale vérifiés dans les environnements pertinents ;
- rollback et retrait concrets ;
- SHA, versions, résultats et limites conservés dans la preuve de livraison.
