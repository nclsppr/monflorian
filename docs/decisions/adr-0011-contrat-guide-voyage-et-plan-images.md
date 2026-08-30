# ADR-0011, versionner le guide de voyage et compiler les consignes d’image

## Statut

Acceptée le 2026-08-30. Contrat candidat non branché au Workflow.

Cette décision complète l’ADR-0007 sans activer OpenAI, la création de voyage,
le courriel ou un nouveau stockage. Elle ne modifie pas le parcours public V2
décrit par l’ADR-0010.

## Contexte

Le contrat d’itinéraire courant décrit des journées, quelques moments et des
hébergements. Il ne possède ni version, ni grande étape éditoriale, ni guide
pratique stable, ni plan d’images. Le Workflow compose ensuite une seule image
à partir du résumé libre du premier jour.

Cette forme ne suffit pas pour produire des carnets comparables, placer une
image par grande étape ou empêcher un texte issu du brief de devenir
indirectement une consigne pour Image Edits.

Le carnet fixe « Le Japon à deux » fournit une référence éditoriale de dix
jours. Il doit devenir un exemple détaillé sans être confondu avec une
information vérifiée, une réservation ou une génération active.

## Options considérées

### Rendre directement le JSON produit par OpenAI

Cette option demande un seul appel, mais couple le fournisseur au HTML, aux
liens et aux images. Une variation du modèle devient une variation du produit.
Elle est refusée.

### Produire un guide strict puis le compiler côté serveur

OpenAI produit un brouillon `TravelGuideV1`. Mon Florian le revalide, construit
les liens, compile les consignes d’image et rend la page avec un template
commun. Cette option est retenue.

### Ajouter immédiatement recherche, relecture et plusieurs appels fournisseur

Cette cible améliorera l’actualité des propositions, mais elle ajoute coût,
latence et nouveaux états avant que la forme du carnet soit stabilisée. Elle
reste une évolution ultérieure du même contrat.

## Décision

### Contrat du guide

`contracts/travel-guide-v1.schema.json` devient le contrat candidat de la
réponse textuelle. Il respecte la forme attendue par Structured Outputs : tous
les champs sont requis et chaque objet refuse les propriétés supplémentaires.
Les options absentes utilisent `null` ou une liste vide.

Le guide contient :

- l’identité, les dates, la durée, le rythme et la logique du voyage ;
- un budget sans prix ni disponibilité inventés ;
- des chapitres continus ;
- exactement les journées demandées, avec deux ou trois moments détaillés ;
- les transferts, hébergements et priorités de réservation ;
- neuf rubriques pratiques de longueur bornée ;
- un plan de vérification ;
- un plan d’images typé.

Le schéma verrouille la forme. `app/travel-guide.mjs` vérifie ensuite les
contraintes éditoriales non portées par le schéma fournisseur et les relations
inter-champs : dates, ordre des jours, couverture des chapitres, nuits,
références, transferts, charge quotidienne et bijection entre chapitres et
images. Les bases, lieux, destinations Booking et hébergements se relient par
des identifiants validés. Une sortie hors contrat est rejetée ; elle n’est
jamais tronquée silencieusement.

Le même module fournit les instructions développeur destinées à Responses. Il
sépare le brief comme donnée, précise les budgets éditoriaux, interdit le double
comptage des transferts et rappelle que les éléments de vérification ne sont pas
des faits déjà contrôlés.

### Images

Pour une durée de `N` jours, le nombre cible d’images vaut
`min(7, max(1, ceil(N / 2)))`. Chaque chapitre possède exactement une image et
la couverture réutilise l’une de ces images. Le Japon de dix jours comporte
donc cinq chapitres et cinq scènes.

Le plan d’images ne contient aucun prompt, profil de rendu ou style libre,
artiste, modèle, URL ou identifiant de fichier fournisseur. Il sélectionne
seulement :

- un lieu par référence vers un catalogue contrôlé ;
- un type de scène et une activité énumérés ;
- un moment, un cadrage, une lumière et une humeur ;
- une finalité éditoriale et un texte alternatif qui ne sont pas transmis au
  modèle d’image.

Le serveur compile ces valeurs avec le profil privé
`fuji-editorial-v1`, fondé sur une seule recette Classic Chrome. Le brief brut,
les résumés libres, la finalité éditoriale et le texte alternatif ne sont jamais
inclus dans la consigne d’image. Un manifeste serveur décide seul des personnes
et animaux approuvés à transmettre comme références du même voyage ; le modèle
texte ne peut ni ajouter un sujet, ni exclure le couple demandé.

Le titre du lieu reste du HTML rendu avec Outfit. Il n’est pas dessiné dans le
bitmap.

### Réservations et faits

OpenAI ne produit aucun lien. Les recherches Booking restent construites par le
Worker depuis une destination contrôlée, les dates et les voyageurs.

Les informations volatiles pointent vers un élément de vérification. Une future
étape `FactPack` pourra apporter des faits sourcés et datés sans changer la
forme principale du guide. Le schéma strict ne garantit ni l’exactitude d’un
lieu, ni un horaire, ni une disponibilité.

### Frontière de cette tranche

Le contrat, le validateur, le compilateur et la fixture Japon restent des
artefacts candidats. Ils ne remplacent pas encore `itineraryJsonSchema`, ne
sont pas importés par le Workflow déployé et ne provoquent aucun appel
fournisseur. Aucun secret, drapeau, binding, migration ou déploiement ne change.

Les tests propres à `TravelGuideV1` sont reportés à la demande du propriétaire
et consignés dans `RESTE-A-FAIRE.md`.

## Conséquences

La forme des futurs carnets devient versionnable et comparable. Une fois ce
contrat intégré, une page pourra être corrigée sans régénérer le contenu, et une
seule scène pourra être reprise sans réexécuter tout le voyage.

Le contrat est plus volumineux que l’itinéraire courant. La fixture Japon
minifiée mesure environ 58 Ko : elle dépasse la limite courante de 32 768 octets
et ne doit pas être branchée sans nouveau plafond de réponse et de stockage.
Cinq éditions d’image augmenteront aussi le coût et exigent un quota pondéré
par scène.

La réutilisation des mêmes références et du même profil améliore la cohérence
visuelle sans garantir une identité parfaite entre plusieurs générations.

## Étapes suivantes

1. Relire le Japon enrichi comme référence éditoriale.
2. Ajouter les tests de forme, relations, contenu hostile et compilation.
3. Mesurer la taille et le budget de sortie sur 3, 7, 10 et 14 jours.
4. Remplacer le contrat courant dans Responses et l’OpenAPI.
5. Produire une étape Workflow durable par image avec quota et état propres.
6. Adapter le rendu privé avant un parcours fournisseur synthétique.

## Rollback

Retirer les artefacts candidats, puis conserver cette ADR comme historique ou
la supplanter par une nouvelle décision. Le contrat courant, le Workflow et la
V2 publique restent inchangés pendant cette tranche.

## Références

- [OpenAI, Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI, génération et édition d’images](https://developers.openai.com/api/docs/guides/image-generation)
- [ADR-0007](adr-0007-runtime-et-production-cloudflare.md)
- [ADR-0010](adr-0010-parcours-v2-astryx.md)
- [`DATA-PROCESSING.md`](../../DATA-PROCESSING.md)
- [`THREAT-MODEL.md`](../../THREAT-MODEL.md)
- [`RESTE-A-FAIRE.md`](../../RESTE-A-FAIRE.md)
