# ADR-0012, promouvoir la V2 comme site principal

## Statut

Acceptée le 7 septembre 2026 sur demande explicite du propriétaire de comparer
les deux versions, améliorer la V2 et en faire la version principale.

L'implémentation est publiée le 7 septembre 2026 après fusion de la
[PR #54](https://github.com/nclsppr/monflorian/pull/54), au commit
`f0d8411530f0d6002c70f206f1c716169b22a184`. La version Worker
`f3ffeb1e-0e3d-44ce-8eb3-82ab39c6f4d2` reçoit 100 % du trafic. Les preuves de
CI et les sondes publiques sont consignées dans `STATUS.md` et
`DELIVERY-EVIDENCE.md`.

Cette ADR remplace les choix d'isolation sous `/v2`, de maintien de l'accueil
historique, de mise hors index de la V2 et de partage simulé de l'ADR-0010. Elle
conserve les contrats de contenu et d'images de l'ADR-0011 ainsi que les limites
du runtime de l'ADR-0007.

## Contexte

La V1 décrit le futur service mais montre un formulaire fermé. La V2 expose un
carnet complet avec nuits, trajets et vérifications. Son questionnaire mène
toutefois au même résultat, et son mot de passe ne protège aucune ressource
serveur. Promouvoir ces simulations conserverait des commandes dont le résultat
ne correspond pas à leur promesse.

Le carnet a assez de contenu pour être lu et utilisé comme exemple public.
L'accueil doit montrer ce résultat avant de demander un effort, proposer une
préparation locale utile et distinguer ce qui reste fermé. La lecture doit
fonctionner sans attendre l'exécution de React.

## Décision

### Un site principal pré-rendu

Les sources du site principal restent dans `app/v2/src/`. Le répertoire porte
son nom historique ; il ne désigne plus une version publique concurrente.

Le build produit cinq pages HTML depuis les mêmes composants React :

- `/` pour l'accueil ;
- `/carnets/japon-10-jours` pour le carnet éditorial complet ;
- `/guides` pour l'index des guides ;
- `/guides/preparer-itineraire-voyage` pour la méthode de préparation ;
- `/guides/japon-10-jours-preparer-voyage` pour l'adaptation du carnet Japon.

React hydrate ensuite les pages pour les actions locales. Le HTML contient déjà
les textes, les liens, les journées et les sources. Navigation et inspirations
utilisent des liens et des éléments `details` natifs. Les outils dépendants de
JavaScript sont annoncés comme tels dans le parcours sans script.

Le nouveau build remplace l'accueil de `dist/`. L'ancien
`app/public/index.html`, ses scripts et ses styles restent conservés pour
l'historique et leurs autres consommateurs ; cet index n'est plus l'accueil
servi depuis le 7 septembre 2026. `dist/` et les rendus intermédiaires sont
dérivés.

### URLs et référencement

L'entrée `/v2` et ses formes historiques redirigent en `308` vers le site
principal. Les anciens paramètres de carnet et d'inspiration doivent conserver
une destination utile. Les paramètres du faux accès privé sont retirés. Les
ressources d'images historiques sous `/v2/media/` restent utilisables.

Les cinq pages possèdent chacune titre, description, URL canonique et
métadonnées sociales. Le sitemap ne contient que les pages publiques retenues.
Les guides relient le carnet, le pense-bête et les sources pertinentes. Le
contenu doit être utile à une personne qui prépare son voyage ; la multiplication
de pages par ville ou par durée n'est pas un objectif.

Cette architecture facilite la lecture et l'exploration du contenu. Elle ne
garantit ni indexation, ni position, ni trafic. Les voyages privés, leurs médias,
les API et la surface `workers.dev` restent hors index selon leurs contrats.

### Des outils locaux qui produisent un résultat

Le questionnaire déterministe devient un pense-bête en trois étapes : envie,
rythme et confort. Il produit une fiche copiable ou téléchargeable en texte,
avec les choix saisis et les éléments à préciser. Il ne personnalise pas le
carnet Japon et ne provoque aucune génération.

La saisie reste en mémoire. « Garder sur cet appareil » conserve volontairement
une copie sous `monflorian:trip-planner:v1` dans `localStorage`. Les modifications
suivantes exigent un nouveau clic pour remplacer la copie. La restauration
valide la version, les nombres, les valeurs énumérées et la taille. L'effacement
retire uniquement cette clé.

La checklist conserve les identifiants des vérifications cochées sous
`monflorian:japan-checklist:v1`. Chaque coche ou décoche actualise la copie,
avec une explication près des commandes. « Tout décocher » efface cette clé.
Cocher signifie que la personne a vérifié un point, sans confirmer ni effectuer
une réservation.

Ces deux copies restent dans le même navigateur jusqu'à leur effacement, sans
échéance programmée. Elles ne sont pas synchronisées et ne sont jamais envoyées
au service. Copier ou partager le lien public du carnet ne les transmet pas.
Une erreur de stockage, de copie ou d'export doit annoncer ce qui a échoué et
laisser une autre manière de conserver le texte quand elle est disponible.

Le partage n'offre plus de mot de passe simulé. Il copie ou ouvre le partage du
lien public. L'impression utilise le navigateur ; elle ne constitue pas une
capacité de génération de PDF par le service. L'attente artificielle avant
l'ouverture du carnet disparaît.

### Conserver la marque, faciliter la lecture

Le master du logo, les cinq portraits V2, la palette, la pile système, Kalam et
Outfit restent les références. À la demande complémentaire du propriétaire le
7 septembre, l'entrée conserve un seul logo dans l'en-tête permanent. La grande
introduction et son basculement au défilement sont supprimés. La couverture
illustrée du carnet remplace la coque de téléphone ; elle suit les actions et
l'explication sur mobile. Le footer passe sur fond crème avec une navigation
en colonnes. La navigation reste visible sans JavaScript.

Le carnet ajoute des accès directs aux journées et aux vérifications, du texte
lisible sur mobile et une impression utilisable. Les personnages fictifs et les
illustrations synthétiques restent explicitement distincts de photos de
voyageurs et d'une preuve de visite.

### Backend inchangé

Cette décision n'ajoute aucune API, aucun secret, aucun stockage serveur et aucun
fournisseur. Les drapeaux de création de voyage, de génération, d'illustration
et de courriel restent fermés. `POST /api/trips` doit toujours refuser une
demande avec `503 TRIP_CREATION_UNAVAILABLE` avant traitement.

Le carnet public et les guides éditoriaux ne sont pas des voyages privés rendus
indexables. Le futur parcours personnel conserve ses règles de consentement,
chiffrement, accès par jeton, rétention et suppression. L'affiliation et le
paiement restent soumis à leurs décisions propres.

## Vérification et livraison

- Construire le site et ses cinq pages, puis exécuter `./scripts/verify.sh`.
- Vérifier mobile et bureau, clavier, mouvement réduit et lecture sans
  JavaScript.
- Vérifier les liens historiques, les ancres de journée et les sources.
- Tester le pense-bête, les bornes, la reprise, la copie, l'export et
  l'effacement local ; tester la checklist et les erreurs de stockage.
- Vérifier la notice, les métadonnées et l'absence de données personnelles dans
  les pages publiques.
- Livrer par PR, contrôles requis, fusion, déploiement et sondes publiques du
  SHA livré. Consigner les limites et les drapeaux fermés.

## Retour arrière

Revenir à une version Worker connue et rétablir ensemble le build, les routes,
les métadonnées et les contrats correspondants. Les fichiers historiques ne
doivent pas être présentés comme une sauvegarde déployée à eux seuls.

Le retour arrière ne doit ni lire ni supprimer les autres données du navigateur.
Les éventuelles copies locales de préparation restent sous leurs clés propres.

## Références

- [ADR-0010, parcours V2 Astryx](adr-0010-parcours-v2-astryx.md)
- [ADR-0011, contrat du guide](adr-0011-contrat-guide-voyage-et-plan-images.md)
- [ADR-0007, runtime Cloudflare](adr-0007-runtime-et-production-cloudflare.md)
- [`PROJECT.md`](../../PROJECT.md)
- [`DESIGN.md`](../../DESIGN.md)
- [`DATA-PROCESSING.md`](../../DATA-PROCESSING.md)
- [`ROADMAP.md`](../../ROADMAP.md)
