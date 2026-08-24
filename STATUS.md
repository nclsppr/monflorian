# État courant

Dernière vérification : 2026-08-24 sur Cloudflare, GitHub et le DNS public.

## Résultat

Un premier aperçu Cloudflare répond sur
`https://monflorian.nclsppr.workers.dev`. Il sert l'interface et les contrats
publics, avec `generationReady: false`, `serviceReady: false` et les deux routes
coûteuses fermées en `503`.

Le domaine `monflorian.com` n'est pas migré. Ses serveurs de noms restent chez
OVHcloud et les enregistrements web pointent encore vers l'environnement
précédent. Cette migration n'a modifié aucun DNS ni aucune ressource Atlas.

## Ressources Cloudflare vérifiées

| Ressource | État | Preuve |
| --- | --- | --- |
| Worker `monflorian` | déployé | version `91251c60-c62d-4eb0-93fb-1594d64b3942` |
| Static Assets | actifs | 13 fichiers lus, page et sept PNG servis |
| D1 `monflorian-production` | actif, juridiction `eu`, région d'exécution `EEUR` | migration `0001_trip_lifecycle.sql` appliquée |
| Tables D1 | vides et prêtes | `trips`, `trip_assets`, `daily_quotas` |
| Workflow `monflorian-trip` | déployé | classe `TripWorkflow`, garde-fou fermé |
| R2 | bloqué | activation initiale du compte requise dans le Dashboard |
| Turnstile | absent | requis avant génération gratuite |
| Secrets Worker | absents | aucun secret requis par l'aperçu fermé |
| Domaine Cloudflare | absent | zone et serveurs de noms non migrés |

## Preuves publiques Cloudflare

- `/` répond `200` avec le titre attendu et les en-têtes de sécurité.
- `/api/health` répond `200`, version Worker exacte et
  `generationReady: false`.
- `/api/config` répond `200`, `serviceReady: false` et Booking `external`.
- `/.well-known/monflorian-release` annonce `cloudflare-workers` et la même
  version.
- `POST /api/itineraries` répond `503 GENERATION_UNAVAILABLE`.
- Aucun secret, brief, courriel ou photo n'a été envoyé pendant ces sondes.

## État du dépôt et de la livraison

- Branche de travail : `codex/cloudflare-migration`.
- Le runtime Worker, l'ADR, la migration et la CI Cloudflare ne sont pas encore
  fusionnés dans `main` au moment de ce relevé.
- Le dépôt GitHub ne possède actuellement aucun secret Actions Cloudflare.
- Le déploiement initial a donc été réalisé depuis la session Wrangler locale.
- La protection de branche demande encore l'ancien contrôle
  `Validate application release` jusqu'à la migration de la règle.

## DNS observé avant migration

| Type | Valeur utile |
| --- | --- |
| NS | `ns200.anycast.me`, `dns200.anycast.me` |
| A apex | `137.74.174.163` |
| MX | priorités 1, 5 et 100 vers `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, `mx3.mail.ovh.net` |
| SPF | inclut `mx.ovh.com` et `_spf.tem.scaleway.com` |

Le futur transfert de zone doit recopier et vérifier tous les enregistrements,
pas seulement ceux de ce tableau.

## Limites

Cette tranche prouve le runtime Cloudflare fermé, D1 et le Workflow. Elle ne
prouve ni R2, ni génération OpenAI, ni page privée, ni courriel, ni Turnstile,
ni affiliation, ni paiement, ni migration du domaine. Aucun utilisateur ne doit
envoyer de brief ou de photo tant que les gates de `RESTE-A-FAIRE.md` ne sont pas
terminées.
