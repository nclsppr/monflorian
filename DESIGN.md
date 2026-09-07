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
  pencilSage: "#85897a"
  line: "rgba(6, 26, 59, 0.12)"
  muted: "#66738b"
typography:
  body:
    fontFamily: '"Avenir Next", "Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  h1:
    fontFamily: '"Avenir Next", "Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    fontWeight: 800
    lineHeight: 0.99
    letterSpacing: -0.04em
  note:
    fontFamily: '"Kalam", "Bradley Hand", "Segoe Print", cursive'
    fontWeight: 400
rounded:
  xl: 34px
  lg: 26px
  md: 18px
---

# Design de Mon Florian

## Statut et sources

Ce contrat décrit la V2 principale candidate du 7 septembre 2026, décidée dans
[l'ADR-0012](docs/decisions/adr-0012-v2-site-principal.md). Sa publication et son
contrôle public doivent être prouvés séparément dans `STATUS.md` et
`DELIVERY-EVIDENCE.md`.

Les sources canoniques sont `app/v2/src/main.jsx`, `Planner.jsx`, `Guides.jsx`,
leurs styles et leurs données. Le carnet consomme la fixture canonique
`contracts/examples/japan-10-days.v1.json` par `app/v2/src/data.js`. Le build
pré-rend les pages ; les fichiers de `dist/` ne sont jamais édités à la main.
L'ancien `app/public/index.html` reste historique. Sa conservation ne lui donne
pas autorité sur le nouvel accueil. Les styles historiques restent disponibles
pour la notice et les autres consommateurs qui en dépendent.

Le master `assets/brand/monflorian-logo.png` et les assets documentés dans
`ASSETS.md` gardent leur autorité de marque. Les captures sous
`references/concepts/` sont des références historiques, jamais une source de
promesses ou un substitut à une interface testée.

## Direction

Mon Florian aide à préparer un voyage. Il ne ressemble ni à une agence ni à un
chatbot. Le logo porte la personnalité ; les outils servent une action précise.
Florian intervient pour expliquer un choix d'itinéraire, pas pour décorer chaque
bloc.

L'accueil montre le carnet Japon et permet de préparer un pense-bête personnel.
Il annonce que la génération sur mesure reste fermée. Les cinq pages publiques
sont l'accueil, le carnet Japon, l'index des guides et deux articles. Le carnet
et les guides se lisent sans JavaScript. Le pense-bête, la checklist et les
commandes de partage sont des améliorations interactives du contenu déjà rendu.

## Logo et portraits

Le mot-symbole et son avion restent fixes. Les cinq portraits V2 conservent les
variantes `original`, `wind`, `beanie`, `summer` et `flower`. Le navigateur
choisit une variante par visite ou respecte un paramètre `?avatar=` reconnu.
Tous les emplacements utilisent la même variante. Le portrait original sert de
repli dans le HTML et si la variante ne peut pas être chargée.

Les portraits gardent le même visage, les lunettes, la barbe, le sourire et le
rendu du master. Leur canevas reste carré et transparent. Les composants ne leur
ajoutent ni fond ni médaillon. La première famille reste une archive de retour,
jamais un second système visuel actif.

Sur desktop, le grand logo ouvre l'accueil dans une introduction plus courte
que celle de la V1. L'en-tête compact reste visible dès l'arrivée et accompagne
le défilement. La navigation demeure utilisable sans JavaScript.

La note manuscrite utilise Kalam en crayon sauge `#85897a`, sur les trois traits
blancs irréguliers issus du système existant. Elle reste statique. Sur mobile,
l'introduction est masquée : le titre, l'explication et l'action précèdent le
téléphone. L'aperçu du résultat reste présent avant le pense-bête.

## Couleurs et typographie

L'encre structure le texte et le téléphone. Le bleu profond porte les actions
principales avec un texte blanc lisible. Ciel et cyan appartiennent aux aperçus ;
le citron distingue les actions courtes et les étapes actives, avec un libellé
ou une forme qui rend l'état compréhensible sans la couleur.

Les surfaces papier, crème et gris bleuté séparent les niveaux. Les boutons et
les champs restent plats. Les ombres sont réservées au téléphone et aux quelques
éléments qui ont besoin de se détacher ; les groupes de lecture utilisent
l'espacement et les lignes fines.

La pile système du produit reste la police de l'interface et des guides. Les
titres restent courts, lourds et lisibles. Kalam appartient uniquement à la note
d'introduction. Outfit auto-hébergée sert aux titres blancs sur les scènes de
voyage. Les informations utiles du carnet, dont durées, trajets et alternatives,
restent lisibles sur mobile sans dépendre d'un agrandissement.

## Parcours et navigation

L'action principale de l'accueil ouvre le carnet Japon. Une action secondaire
mène au pense-bête. La navigation relie carnet, pense-bête et guides avec de
vrais liens ; le menu mobile et les trois inspirations emploient des éléments
`details` natifs. L'utilisateur peut ouvrir une destination dans un nouvel
onglet et comprendre où mène le lien.

Le carnet propose un sommaire, des liens directs aux dix journées, les hôtels,
le budget, la checklist, les conseils pratiques et les sources. Une référence à
une vérification conduit au point concerné. Le contenu long reste organisé par
chapitre et par journée, avec les transferts placés dans leur chronologie.
Les champs de contrôle réservés au futur modèle d'image restent absents du
bundle public.

Les guides possèdent une hiérarchie de titres, un sommaire, une date, leurs
sources et des liens vers les pages utiles. Leur présentation favorise la
lecture. Les métadonnées et le sitemap doivent décrire le contenu réel sans
promettre son classement dans les moteurs.

## Pense-bête et checklist

Le pense-bête conserve trois étapes : envie, rythme et confort. Il réunit les
choix dans une fiche, permet de la copier et de la télécharger en texte. Il ne
modifie pas le carnet Japon. Il ne demande ni adresse de courriel, ni photo, ni
code d'accès. Le texte saisi peut rester vide ; les nombres sont bornés et les
erreurs donnent une correction précise.

L'enregistrement est volontaire, avec un bouton « Garder sur cet appareil ».
Après modification, la copie ne change qu'au clic suivant. La restauration et
l'effacement portent uniquement sur cette copie locale. L'interface explique ce
qui reste dans la page et ce qui est enregistré dans le navigateur. Une erreur
de copie propose un texte sélectionnable. Une erreur de stockage laisse le
pense-bête utilisable sans annoncer une sauvegarde réussie.

La checklist enregistre chaque coche et décoche dans le navigateur. Le texte
près des cases l'annonce avant usage. Une case représente une vérification,
jamais une réservation. L'action « Tout décocher » remet la liste à zéro et
retire sa copie locale. Le lien partagé ne transmet ni cette liste ni le
pense-bête.

## Images et partage

Les scènes Japon et les couvertures d'inspiration restent synthétiques. Le
couple est fictif et ne constitue ni un témoignage ni une preuve de visite.
Le traitement Fuji, la colorimétrie contenue et le grain fin restent communs.
Les titres blancs centrés sont rendus en HTML avec Outfit ; ils ne sont jamais
incrustés dans les images.

Les scènes Japon possèdent les formats `720 x 480` et `1440 x 960` pour leur
`srcset`. Les dimensions sont réservées dans le rendu et les images hors du
premier écran peuvent être chargées à la demande.

Le partage ouvre ou copie le lien du carnet public. Il ne présente plus de
contrôle d'accès privé simulé ni de mot de passe. L'impression utilise le
navigateur et une présentation de lecture. Elle ne doit pas devenir une
promesse de PDF généré par le service.

Les futures photos réelles restent soumises au contrat distinct de consentement,
de stockage R2 privé et de suppression. Elles ne sont demandées qu'après une
première proposition utile et acceptée dans le futur parcours personnalisé.

## Composants et accessibilité

React 19 et Astryx `0.5.0` restent la base existante. Le thème Matcha reprend les
tokens Mon Florian. Les boutons, badges et dialogues peuvent utiliser Astryx ;
les formulaires et les éléments de lecture utilisent les composants natifs
lorsqu'ils remplissent le besoin. Le choix d'un composant ne doit pas imposer
une nouvelle étape ni une animation artificielle.

Les commandes possèdent un nom, un rôle et un focus visible. Les erreurs et
résultats sont annoncés aux technologies d'assistance. Les étapes du
pense-bête déplacent le focus vers leur titre. Les ancres restent visibles sous
l'en-tête. Les cibles tactiles, le contraste et l'ordre de lecture sont vérifiés
avec la copie réelle.

Sans JavaScript, aucune commande inactive ne doit donner l'impression d'avoir
copié, enregistré ou réservé quelque chose. Les alternatives de lecture sont
accessibles immédiatement. La préférence de réduction des mouvements supprime
les transitions dispensables et le défilement animé. Aucune fausse attente de
génération ne précède l'ouverture du carnet.

## Limites

Ne pas ajouter d'avis, de note, de disponibilité, d'affiliation, de garantie ou
de paiement sans preuve. Aucun bouton ne doit suggérer une réservation confirmée.
La génération personnalisée, le courriel et les photos restent fermés. Le
prototype sous `prototype/` reste une expérience locale séparée.
