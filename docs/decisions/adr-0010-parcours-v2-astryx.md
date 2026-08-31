# ADR-0010, isoler le parcours V2 avec Astryx

## Statut

- Accepté le 2026-08-26.
- Mise à jour candidate le 2026-08-31, soumise à une preuve publique séparée.
- Aucun changement de secret, de fournisseur ou de drapeau Cloudflare.

## Contexte

L'accueil historique sert une présentation courte en HTML, CSS et JavaScript
natifs. Le nouveau parcours doit montrer l'expérience complète : saisie guidée,
génération, itinéraire, hôtels, photos cohérentes et partage. Il doit rester
consultable sous `/v2` sans prétendre activer le backend de génération fermé.
Avant de demander une saisie, il doit donner une preuve concrète du résultat
attendu avec l'aperçu d'un carnet dans un téléphone.

Les deux personnes fournies pour les scènes Japon sont des personnages fictifs
issus d'une génération d'image. Elles peuvent donc servir de distribution
éditoriale versionnée et ne représentent pas des données personnelles de
voyageurs.

## Décision

- Conserver `/` et son JavaScript natif sans migration.
- Construire `/v2` comme une île React 19 produite par Vite.
- Utiliser les composants Astryx `0.5.0` avec le thème Matcha adapté aux tokens
  Mon Florian. Conserver la pile système de la racine pour l'interface et
  réserver Outfit auto-hébergée aux titres superposés aux photos.
- Présenter le hero et l'aperçu du carnet dans un téléphone avant le formulaire
  en trois étapes, sur mobile comme sur grand écran.
- Réutiliser sur grand écran le lockup d'introduction de la racine, sa note
  manuscrite et son basculement ponctuel vers le logo compact de l'en-tête,
  dans une introduction plus courte. Masquer cette introduction sur mobile
  pour afficher directement le hero et son aperçu.
- Retirer du formulaire de démonstration tout ajout ou téléversement de
  portraits. Il annonce que toute saisie ouvre le même carnet « Le Japon à
  deux », sans appeler `/api/trips`.
- Consommer statiquement la fixture canonique
  `contracts/examples/japan-10-days.v1.json`. Le rendu conserve ses dix jours,
  ses cinq chapitres qui couvrent les dix jours et le détail utile à la
  décision : rythme,
  moments, transferts, critères d'hébergement, réservations, variables de
  budget, alternatives en cas de pluie ou de fatigue et conseils des dernières
  72 heures. Le build valide la fixture avec son contexte canonique et injecte
  dans le client une projection qui retire les champs de contrôle des images.
  Les consignes réservées aux fournisseurs ne sont pas publiées dans le bundle.
- Versionner cinq scènes du couple fictif et trois couvertures d'exemples en
  WebP 1440 × 960. Le traitement commun reprend une esthétique Fuji, un grain
  fin et un titre blanc centré rendu en HTML avec Outfit.
- Ouvrir Booking.com uniquement après un clic explicite, par recherche de ville,
  sans prix, disponibilité ni affiliation annoncés.
- Simuler le partage public ou privé dans le dialogue de démonstration. Le lien
  composé ne publie pas le carnet, ne persiste aucune règle d'accès et ne
  protège aucune ressource côté serveur. Une preuve SHA-256 et une comparaison
  locale du mot de passe ne doivent pas être présentées comme un contrôle
  d'accès livré.
- Laisser Workers Static Assets servir les routes HTML avec
  `drop-trailing-slash`, afin que `/v2` soit la forme canonique sans réécriture
  interne vers `index.html`.
- Garder `/v2` hors index et hors sitemap.

## Conséquences

La V2 peut être parcourue de bout en bout sans activer OpenAI, D1, R2, Email
Service ou le Workflow. Elle ajoute React, Vite, Astryx, StyleX et Outfit au
seul bundle `/v2`. La saisie ne personnalise pas le résultat : elle ouvre une
fixture déterministe et versionnée. Le dialogue de partage illustre les choix
d'interface, mais ne remplace pas la page privée à jeton prévue par F06.

L'isolation technique ne crée pas une seconde identité visuelle. La V2 reprend
la typographie, les couleurs, les halos, les formes et les prises de parole de
Florian déjà présents à la racine. Les composants Astryx s'insèrent dans ce
système au lieu d'imposer les choix éditoriaux de Matcha.

Les futures photos de voyageurs réels restent destinées au bucket R2 privé et
au cycle de rétention existant. Cette règle ne requalifie pas les huit fixtures
synthétiques de la V2.

## Vérification

- `npm run build:v2`
- `npm test`
- `./scripts/verify.sh`
- contrôle navigateur de `/v2`, du parcours généré, des dialogues et des
  largeurs mobile et bureau

## Rollback

Rétablir l'alias `/v2` vers `/`, retirer l'étape Vite de `build:assets`, puis
supprimer `app/v2`, `app/public/v2/media` et les dépendances dédiées. L'accueil
historique reste indépendant.
