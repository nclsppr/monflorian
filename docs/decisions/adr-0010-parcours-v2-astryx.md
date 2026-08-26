# ADR-0010, isoler le parcours V2 avec Astryx

## Statut

- Accepté le 2026-08-26.
- Implémentation candidate dans `codex/v2-japan-demo`.
- Aucun changement de secret, de fournisseur ou de drapeau Cloudflare.

## Contexte

L'accueil historique sert une présentation courte en HTML, CSS et JavaScript
natifs. Le nouveau parcours doit montrer l'expérience complète : saisie guidée,
génération, itinéraire, hôtels, photos cohérentes et partage. Il doit rester
consultable sous `/v2` sans prétendre activer le backend de génération fermé.

Les deux personnes fournies pour les scènes Japon sont des personnages fictifs
issus d'une génération d'image. Elles peuvent donc servir de distribution
éditoriale versionnée et ne représentent pas des données personnelles de
voyageurs.

## Décision

- Conserver `/` et son JavaScript natif sans migration.
- Construire `/v2` comme une île React 19 produite par Vite.
- Utiliser les composants Astryx `0.5.0` avec le thème Matcha adapté aux tokens
  Mon Florian et Outfit auto-hébergée.
- Faire aboutir toute saisie au même carnet « Le Japon à deux », dix jours entre
  Tokyo, Hakone et Kyoto. Aucun formulaire V2 n'appelle `/api/trips`.
- Versionner trois scènes du couple fictif et trois couvertures d'exemples en
  WebP 1440 × 960. Le traitement commun reprend une esthétique Fuji, un grain
  fin et un titre blanc centré rendu en HTML avec Outfit.
- Ouvrir Booking.com uniquement après un clic explicite, par recherche de ville,
  sans prix, disponibilité ni affiliation annoncés.
- Fournir des liens de partage publics et privés. Le mode privé place seulement
  une preuve SHA-256 dans l'URL et compare le mot de passe dans le navigateur.
- Laisser Workers Static Assets servir les routes HTML avec
  `drop-trailing-slash`, afin que `/v2` soit la forme canonique sans réécriture
  interne vers `index.html`.
- Garder `/v2` hors index et hors sitemap.

## Conséquences

La V2 peut être parcourue de bout en bout sans activer OpenAI, D1, R2, Email
Service ou le Workflow. Elle ajoute React, Vite, Astryx, StyleX et Outfit au
seul bundle `/v2`. Le mot de passe côté navigateur convient à ce parcours
éditorial mais ne remplace pas la page privée à jeton prévue par F06.

Les futures photos de voyageurs réels restent destinées au bucket R2 privé et
au cycle de rétention existant. Cette règle ne requalifie pas les six fixtures
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
