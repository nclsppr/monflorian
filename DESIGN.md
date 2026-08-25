---
version: alpha
name: Mon Florian
description: Système visuel du produit de voyage Mon Florian, extrait du prototype et du logo fournis.
omitted:
  - section: spacing
    reason: Le prototype ne définit aucune échelle d'espacement nommée.
  - section: components
    reason: Les composants existent en CSS mais ne possèdent pas encore de tokens partagés.
colors:
  ink: "#061a3b"
  ink-2: "#17345f"
  blue: "#1772ff"
  blue-deep: "#0b4fd8"
  sky: "#9edcff"
  cyan: "#48dcff"
  lime: "#dfff55"
  cream: "#fff8eb"
  paper: "#fffefb"
  surface: "#f4f7ff"
  line: "rgba(6, 26, 59, 0.12)"
  muted: "#66738b"
typography:
  body:
    fontFamily: '"Avenir Next", "Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  h1:
    fontFamily: '"Avenir Next", "Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    fontWeight: 800
    lineHeight: 0.99
    letterSpacing: -0.064em
rounded:
  xl: 34px
  lg: 26px
  md: 18px
---

# Design de Mon Florian

## Overview

Mon Florian est un produit de voyage grand public. Il ne doit ressembler ni au site d'une agence, ni à un chatbot. Le logo porte l'illustration et la personnalité. L'interface reste plus plate, plus calme et centrée sur une seule action : raconter son envie.

Ce contrat s'appuie sur `prototype/index.html`, le master `assets/brand/monflorian-logo.png` et la capture principale. La capture alternative reste une archive. Elle ne justifie aucun composant, avis ou argument commercial.

## Logo modulable

Le lockup fourni reste le master de référence. L'application sépare désormais
son personnage et son mot-symbole. Le mot "Mon Florian" et l'avion ne changent
jamais. Le navigateur choisit un seul portrait de Florian au chargement et
l'utilise partout pendant cette visite. Si le script ou le portrait choisi
échoue, il conserve le personnage original.

Les variantes gardent le même visage, les lunettes rondes dorées, les yeux
bruns, la barbe, le sourire et le rendu 3D doux du master. Seuls les cheveux,
le couvre-chef et un petit accessoire de voyage peuvent changer. Chaque portrait
utilise le même canevas carré et un vrai canal alpha. Tout ce qui entoure le
personnage reste transparent. Aucun fichier ni composant ne peint de fond, de
médaillon, de halo ou d'ombre derrière lui. Le portrait ne reçoit ni texte, ni
décor, ni second personnage.

La rotation comprend le Florian original, les cheveux au vent, le bonnet, le
bob bleu et le chapeau de paille fleuri. Une nouvelle variante doit respecter
le contrat de transparence automatisé avant d'entrer dans cette liste.

Le changement se produit au chargement. Il ne tourne pas en boucle et ne doit
pas détourner l'attention du composeur. Florian reste un repère de marque dans
l'en-tête et un conseiller ponctuel dans le contenu.

Sur l'accueil, un grand lockup modulable occupe d'abord le centre du premier
écran à sa taille de rendu réelle. Il défile avec la page, puis le logo compact
apparaît dans l'en-tête quand l'introduction est passée. Ce basculement repose
sur un seuil d'intersection, sans lecture continue du défilement, changement
d'échelle ni boucle d'animation. L'aperçu du téléphone reste fixe sur les
appareils tactiles. Sur un pointeur précis, les navigateurs compatibles peuvent
ajouter une profondeur courte avec leur timeline de vue native. La préférence
de réduction des mouvements supprime cette profondeur et les transitions.

## Colors

L'encre structure les titres, le texte et le cadre du téléphone. Le bleu profond porte l'action principale quand du texte blanc doit atteindre le contraste AA. Le bleu électrique sert aux traits, liens et accents, pas aux longs textes.

Le ciel et le cyan appartiennent aux aperçus de destination. Le citron signale une action courte ou une étape active. Il ne doit jamais être le seul signe d'un état. Les surfaces papier, crème et gris bleuté séparent les niveaux sans ajouter une ombre à chaque bloc.

## Typography

Le produit utilise la pile système du prototype. Les grands titres sont lourds, courts et serrés. Ils portent une idée par bloc. Le corps de texte garde une largeur de lecture modérée et un rythme plus ouvert.

Les capitales espacées sont réservées aux petits repères, jours et métadonnées. Les libellés d'action restent en casse naturelle. Une future police de marque exige une décision et une preuve de chargement, de performance et de droits.

## Layout

Le composeur arrive avant toute explication secondaire. Sur bureau, il partage le premier écran avec un seul aperçu du voyage. Sur mobile, le composeur précède l'aperçu et conserve ses gouttières. Aucun élément décoratif ne doit rogner le texte ou masquer un contrôle.

La navigation de lancement se limite aux ancres utiles et à l'action principale. Le mini-site de voyage suit une autre hiérarchie : Aujourd'hui, Itinéraire, Carte et Pratique. Souvenirs n'apparaît qu'après l'achat de Voyage vivant.

## Elevation & Depth

Les ombres sont réservées au composeur, à l'aperçu du téléphone et aux notes de Florian. Les autres groupes utilisent le contraste des fonds et une ligne fine. Ne pas empiler des cartes dans des cartes.

Les dégradés servent aux fonds d'ambiance et aux illustrations de destination. Les boutons et les champs restent plats. Pas de verre brillant ni de volume qui suggère une "IA magique".

## Shapes

Les grands panneaux utilisent les rayons les plus larges. Les champs et cartes secondaires utilisent les rayons intermédiaires. Les puces, portraits et badges restent circulaires ou en pilule. Un écran ne mélange pas ces formes avec des angles durs sans fonction.

Le téléphone, l'avion en papier et les montagnes sont des repères propres à Mon Florian. Ils ne doivent pas devenir une bibliothèque d'illustrations génériques.

## Components

Le composeur réunit dans un seul envoi la phrase libre, les dates, le rythme,
l'adresse de courriel et l'ajout facultatif de photos. Il garde un nom
accessible, un focus visible et une erreur lisible. Une information manquante
déclenche au plus une ou deux questions de Florian, pas une nouvelle suite
d'écrans. Après acceptation, le navigateur ouvre la page privée : elle annonce
clairement l'attente, le résultat, l'échec, l'expiration ou la suppression.

L'action principale reste unique. Dans le prototype, elle doit annoncer qu'aucun paiement n'a lieu. Dans le produit actif, elle peut porter le prix seulement quand le parcours de paiement existe et a été vérifié.

Une note de Florian explique un choix concret du parcours. Elle n'est ni une bulle de discussion, ni une mascotte décorative. Le retour dynamique utilise un statut annoncé aux technologies d'assistance et ne dépend pas du mouvement.

Les photos des voyageurs peuvent alimenter une couverture ou un moment fort. Le rendu reste un dessin éditorial, jamais une fausse photographie de voyage. Chaque image créée avant le départ porte la mention "Projection personnalisée · image générée". L'interface explique l'envoi à OpenAI avant le consentement. Elle ne présente pas cette projection comme une preuve du lieu, du trajet ou de la présence des personnes.

## Evaluation Astryx

L'évaluation du 2026-08-23 n'adopte pas Astryx pour l'interface publique. Le système officiel est en bêta, repose sur React et StyleX et vise d'abord les outils internes riches en composants. Mon Florian possède une page grand public courte, une composition de marque spécifique et aucun framework côté navigateur. Une migration réécrirait le rendu sans ajouter de capacité au voyageur.

Le projet retient trois disciplines d'Astryx sans ajouter sa dépendance :

- nommer une échelle d'espacement avant le prochain écran partagé ;
- documenter ensemble les états repos, focus, chargement, erreur et désactivation des champs, boutons et statuts ;
- reprendre une checklist d'accessibilité couvrant nom, rôle, état, clavier, focus, annonces, mouvement réduit, couleurs forcées, traduction et taille de cible.

Une nouvelle évaluation devient utile pour un futur back-office avec navigation, tableaux, réglages et composants répétés. Elle doit alors mesurer le bundle réel et isoler le thème Mon Florian. Sources de la décision : [dépôt officiel Astryx](https://github.com/facebook/astryx) et [checklist d'accessibilité officielle](https://github.com/facebook/astryx/wiki/Accessibility-Checklist).

## Do's and Don'ts

- Utiliser le logo master comme référence de marque jusqu'à la validation d'une version vectorielle.
- Garder le mot-symbole fixe et limiter les variantes au portrait de Florian.
- Garder tous les portraits sur fond transparent, dans les fichiers comme dans leurs composants d'accueil.
- Garder une seule action commerciale sur la page d'entrée. Voyage vivant arrive après la première livraison.
- Respecter le clavier, le focus visible, les cibles tactiles, le contraste AA et le mouvement réduit.
- Signaler les exemples synthétiques et les projections personnalisées.
- Ne pas ajouter d'étoiles, de halo ou de copie qui présente le service comme une IA magique.
- Ne pas utiliser d'avis, de note Trustpilot, de garantie, de paiement sécurisé ou d'annulation sans preuve.
- Ne pas insérer les voyageurs devant chaque monument. Quelques moments forts suffisent.
- Ne pas transformer la page d'entrée en questionnaire, catalogue de cartes ou navigation d'agence.
