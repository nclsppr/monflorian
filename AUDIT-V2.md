# Comparaison et promotion de la V2

Revue du 7 septembre 2026, depuis les sources et les deux interfaces publiques.
La décision de promotion figure dans l'ADR-0012. Ce document décrit les choix du
candidat ; `DELIVERY-EVIDENCE.md` porte les preuves de livraison.

## Comparaison

| Critère | Accueil historique | V2 avant cette tranche | Choix |
| --- | --- | --- | --- |
| Résultat visible | Aperçu court Portugal | Carnet complet Japon | Conserver les dix jours et leurs détails |
| Marque | Logo modulable et portraits V2 | Même famille, portrait figé | Garder la marque et rétablir les variantes |
| Préparation | Formulaire fermé | Trois étapes sans effet sur le résultat | Produire un pense-bête personnel utile |
| Partage | Futur lien privé annoncé | Contrôle local de mot de passe simulé | Partager le vrai lien du carnet public |
| SEO | HTML lisible, une URL | HTML vide et noindex | Pré-rendre cinq pages avec liens natifs |
| Mobile | Introduction longue | Téléphone avant la copie et l'action | Promesse et action avant l'aperçu |
| Sources | Limites expliquées | Mentions génériques à rechercher | Ancres précises et liens officiels ciblés |

La V1 apporte surtout sa franchise sur les limites et sa lecture HTML native.
Son formulaire fermé avec courriel et photos n'est pas repris. Le carnet de la
V2 reste la meilleure preuve concrète du format et de la logique de voyage.

## Première critique, effort et résultat

Une personne qui saisit Portugal ne doit pas recevoir Japon en croyant voir une
réponse personnalisée. Le nouveau pense-bête restitue les choix, indique ce qui
reste à préciser, propose une copie et un export texte. La sauvegarde sur
l'appareil est volontaire et les modifications non enregistrées sont signalées.
Le carnet reste immédiatement accessible sans formulaire.

Le faux verrou de partage est retiré. Le lien public ouvre réellement la même
page chez un proche ; il n'emporte ni le pense-bête ni les cases cochées.

## Deuxième critique, découverte et lecture

La V2 initiale ne servait aucun contenu utile avant JavaScript. Le build rend
maintenant les mêmes composants en HTML puis React ajoute les interactions.
Les URL du carnet et des guides portent chacune un titre, une description, une
canonical et une image sociale. Le sitemap les relie sans exposer les API ni
les vrais voyages privés.

Les deux guides traitent des décisions concrètes : nuits, transferts, priorités,
budget à construire et adaptation de dix jours au Japon. Les sources officielles
sont datées. Aucun prix, essai personnel, avis ou résultat de recherche n'est
inventé. Le contenu du carnet reste une proposition éditoriale à vérifier.

## Troisième critique, usage mobile et reprise

Le premier contrôle intégré a montré un chevauchement du logo avec la
navigation, des espacements mobiles trop grands et des liens primaires dont la
couleur héritée manquait de contraste. La correction réserve la place de
l'en-tête, raccourcit l'introduction et donne aux actions bleues un texte blanc.

Les dix ancres de journée évitent de reparcourir le carnet entier. La checklist
conserve les vérifications cochées dans le navigateur, propose un effacement et
rappelle qu'une coche ne réserve rien. Les sources sont accessibles depuis le
point concerné. Les détails s'ouvrent pour l'impression puis retrouvent leur
état de lecture.

Une relecture indépendante a aussi détecté que les anciennes inspirations
perdaient leur destination dans les redirections. Elles disposent maintenant
de sections natives et d'ancres partageables, présentes dans le HTML initial.
La revue finale corrige aussi la fermeture du menu mobile et la taille des
métadonnées du carnet. Un essai au toucher révèle ensuite que les liens de
sources juxtaposés sont difficiles à activer sur 320 pixels. Chaque référence
dispose maintenant de sa propre ligne avec son échéance et une cible de 44 pixels
au minimum, sans répéter le même texte avant les liens. L’aperçu social de l’accueil emploie une scène du Japon
à la place de l’ancienne carte qui annonçait encore un voyage privé sur mesure.

## Limites retenues

La génération sur mesure, les courriels et les photos restent fermés. Ce sont
d'autres parcours avec coûts, données et preuves propres. Le site ne présente
pas leur activation comme acquise.

Les contrôles locaux et les métadonnées ne prouvent aucun classement Google.
L'indexation, les requêtes et les résultats demandent un suivi réel après
publication. Aucun suivi publicitaire ou nouveau service analytique n'est ajouté.

## Références de méthode

- [Google, JavaScript et recherche](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google, liens explorables](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google, migration d'URL](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Cloudflare, pages statiques et erreurs 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [React, rendu HTML](https://react.dev/reference/react-dom/server/renderToString)
