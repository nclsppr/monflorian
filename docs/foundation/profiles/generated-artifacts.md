# Profil artefacts générés

Activer ce profil lorsqu'une source produit un fichier, un document, un client, une image, un rapport, un bundle ou un autre artefact dérivé consommé par le projet.

## Nature du document

- **Norme opt-in.** Ce profil opérationnalise `P02`, `P03`, `P04`, `P05`, `P08`, `P09`, `P10` et, pour une sortie perceptive ou publique, `P13` et `P14`.
- **Formulaire.** L'inventaire local des sources, commandes, dérivés et consommateurs vit dans la source canonique désignée par `PROJECT.md`.
- **Preuve.** Les commandes, versions, hashes, diffs, rendus et contrôles de consommateurs sont consignés dans une preuve de livraison. La présence d'un dérivé n'est pas une preuve de génération correcte.

## Source et frontière éditable

- Désigner une source canonique pour chaque famille d'artefacts.
- Désigner la commande ou le script canonique qui réalise la génération.
- Identifier explicitement les chemins dérivés et les consommateurs.
- Distinguer le dérivé actuellement committé, le résultat cible et le résultat finalement observé.
- Modifier la source ou le générateur, jamais le dérivé à la main.
- Marquer le dérivé comme généré lorsque son format le permet.
- Retirer toute ancienne source concurrente ou l'étiqueter comme archive non normative.

## Reproductibilité

- Epingler le générateur, ses dépendances et les ressources d'entrée selon le risque.
- Documenter les paramètres, variables et prérequis sans secret.
- Générer depuis un état propre et mesurer le diff produit.
- Conserver un seed, un modèle, une version, un prompt ou une référence d'entrée lorsqu'ils participent au résultat.
- Déclarer la part non déterministe au lieu de promettre une reproduction bit à bit impossible.
- Vérifier qu'une nouvelle génération sans changement de source ne crée pas de dérive inexpliquée lorsque la génération est annoncée comme déterministe.

## Livraison atomique

- Livrer dans une même unité la source, le générateur, le dérivé et les adaptations de ses consommateurs.
- Vérifier tous les consommateurs connus après génération.
- Invalider les caches, manifests ou versions de ressources lorsque le chemin public ne change pas.
- Supprimer les dérivés orphelins et leurs références lors d'un retrait.
- Ne pas mélanger une régénération globale sans rapport avec une modification ciblée.

## Provenance et droits

Le registre canonique doit permettre de retrouver, selon le type d'artefact :

- l'auteur ou la source d'origine ;
- la licence, les droits et les attributions nécessaires ;
- la date d'acquisition ou de génération ;
- le générateur, sa version et ses paramètres significatifs ;
- les entrées, références, prompts ou transformations ;
- le hash ou l'identifiant de l'artefact retenu ;
- l'usage prévu et les consommateurs autorisés ;
- les limites connues de reproduction ou de réutilisation.

Ne pas intégrer de donnée personnelle, secret, métadonnée sensible ou contenu sans droit établi dans une source ou un dérivé.

## Qualité du dérivé

- Valider le format, les dimensions, le poids, l'encodage et la transparence attendus.
- Contrôler le rendu final lorsqu'une sortie est visuelle, sonore, imprimée ou interactive.
- Conserver le texte fonctionnel et l'information essentielle dans une source accessible, pas uniquement dans une image ou un média.
- Vérifier compatibilité, performance et fallback sur les consommateurs représentatifs.
- Comparer le résultat à la source et aux critères produit, pas seulement à la réussite de la commande.

## Inventaire minimal local

| Champ requis | Finalité |
| --- | --- |
| Source canonique | Identifier ce qui est éditable |
| Générateur canonique | Rejouer la production |
| Version et environnement | Borner la reproductibilité |
| Dérivés | Détecter les sorties manquantes ou orphelines |
| Consommateurs | Valider les impacts |
| Provenance et droits | Autoriser l'usage et l'attribution |
| Déterminisme et limites | Ne pas surinterpréter la preuve |
| Procédure de retrait | Supprimer sans laisser de références |

## Gate minimale

- source canonique, dérivés et consommateurs identifiés ;
- commande rejouée dans un environnement nommé ;
- versions, paramètres significatifs et limites consignés ;
- diff de génération inspecté ;
- absence de modification manuelle du dérivé ;
- provenance, droits et données sensibles contrôlés ;
- format et rendu final vérifiés selon l'usage ;
- consommateurs et invalidation de cache vérifiés ;
- SHA, hashes, résultats et limites conservés dans la preuve de livraison.
