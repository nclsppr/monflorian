# ADR-0011, versionner le guide de voyage et compiler les consignes d’image

## Statut

Acceptée le 2026-08-30, mise à jour le 2026-08-31. La fixture canonique alimente
le rendu statique de `/v2` ; le contrat dynamique reste non branché au Workflow.

Cette décision complète l’ADR-0007 sans activer OpenAI, la création de voyage,
le courriel ou un nouveau stockage. Elle remplace les données locales du carnet
Japon de l’ADR-0010 par une fixture canonique au moment du build. Elle amende
aussi la séquence cible « Parcours d’un voyage » de l’ADR-0007 : la proposition
textuelle précède désormais le consentement et l’envoi facultatif de portraits.

## Contexte

Le contrat d’itinéraire courant décrit des journées, quelques moments et des
hébergements. Il ne possède ni version, ni grande étape éditoriale, ni guide
pratique stable, ni plan d’images. Le Workflow compose ensuite une seule image
à partir du résumé libre du premier jour.

Cette forme ne suffit pas pour produire des carnets comparables, placer une
image par grande étape ou empêcher un texte issu du brief de devenir
indirectement une consigne pour Image Edits.

Le carnet fixe « Le Japon à deux » fournit une référence éditoriale de dix
jours. Il alimente désormais statiquement `/v2` sans être confondu avec une
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
- les transferts placés dans la chronologie, les hébergements et les priorités
  de réservation ;
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

### Séquence cible en deux phases

Le parcours dynamique ne collecte plus les portraits avec le brief initial.
Il sépare explicitement la proposition utile de sa personnalisation :

1. le Worker valide le brief, les limites et le jeton Turnstile, crée un
   identifiant opaque puis démarre uniquement la production du guide textuel ;
2. le Workflow valide et persiste `TravelGuideV1`, puis expose une première
   proposition en état `proposal_ready`, sans photo personnelle ;
3. la personne accepte cette proposition ou demande une modification avant
   toute illustration personnalisée ;
4. après acceptation seulement, elle peut continuer sans portrait ou donner un
   consentement explicite et envoyer une à quatre photos ;
5. le Worker valide les éventuelles photos et les écrit dans R2, puis une étape
   distincte produit les illustrations et passe le voyage à l’état `ready` ;
6. le courriel final n’est envoyé qu’après `ready`. Les photos d’entrée sont
   supprimées selon les délais de l’ADR-0007.

Les noms d’état, la reprise d’une modification et la migration D1 restent à
implémenter avant l’ouverture. Le Workflow actuellement déployé conserve son
ancien enchaînement fermé : cette décision décrit la cible, pas une capacité
active.

### Réservations et faits

OpenAI ne produit aucun lien. Les recherches Booking restent construites par le
Worker depuis une destination contrôlée, les dates et les voyageurs.

Les informations volatiles pointent vers un élément de vérification. Une future
étape `FactPack` pourra apporter des faits sourcés et datés sans changer la
forme principale du guide. Le schéma strict ne garantit ni l’exactitude d’un
lieu, ni un horaire, ni une disponibilité.

### Frontière de cette tranche

La fixture Japon est consommée au build du carnet statique sous `/v2`. Le
contrat, le validateur et le compilateur restent candidats pour la génération
dynamique. Ils ne remplacent pas encore `itineraryJsonSchema`, ne sont pas
importés par le Workflow déployé et ne provoquent aucun appel fournisseur. Aucun
secret, drapeau, binding ou migration ne change.

Les tests propres à `TravelGuideV1` sont reportés à la demande du propriétaire
et consignés dans `RESTE-A-FAIRE.md`.

## Conséquences

La forme des futurs carnets devient versionnable et comparable. Une fois ce
contrat intégré, une page pourra être corrigée sans régénérer le contenu, et une
seule scène pourra être reprise sans réexécuter tout le voyage.

Le contrat est plus volumineux que l’itinéraire courant. L’adaptateur limite le
JSON itinéraire extrait à 131 072 octets, dans une enveloppe fournisseur limitée
à 512 000 octets, et porte `max_output_tokens` à 32 000. La fixture Japon
minifiée, d’environ 58 Ko, tient sous le plafond métier mais dépasse 10 000
tokens selon les encodages de référence. Le plafond de sortie laisse donc une
marge aux tokens visibles et non visibles comptés par Responses. Cette marge ne
remplace pas les mesures sur 3, 7, 10 et 14 jours ni le dimensionnement du
stockage. Cinq éditions d’image augmenteront aussi le coût et exigent un quota
pondéré par scène.

La réutilisation des mêmes références et du même profil améliore la cohérence
visuelle sans garantir une identité parfaite entre plusieurs générations.

## Étapes suivantes

1. Ajouter les tests de forme, relations, contenu hostile et compilation.
2. Mesurer la taille et le budget de sortie sur 3, 7, 10 et 14 jours.
3. Remplacer le contrat courant dans Responses et l’OpenAPI.
4. Introduire les états de proposition, d’acceptation et d’illustration, puis
   séparer les deux phases dans le Worker, D1 et le Workflow.
5. Produire une étape Workflow durable par image avec quota et état propres.
6. Adapter le rendu privé avant un parcours fournisseur synthétique.

## Rollback

Rétablir les anciennes données locales de `/v2` pour retirer la fixture du rendu
statique. Retirer séparément les artefacts candidats dynamiques, puis conserver
cette ADR comme historique ou la supplanter par une nouvelle décision. Le
contrat courant et le Workflow restent inchangés pendant cette tranche.

## Références

- [OpenAI, Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI, génération et édition d’images](https://developers.openai.com/api/docs/guides/image-generation)
- [ADR-0007](adr-0007-runtime-et-production-cloudflare.md)
- [ADR-0010](adr-0010-parcours-v2-astryx.md)
- [`DATA-PROCESSING.md`](../../DATA-PROCESSING.md)
- [`THREAT-MODEL.md`](../../THREAT-MODEL.md)
- [`RESTE-A-FAIRE.md`](../../RESTE-A-FAIRE.md)
