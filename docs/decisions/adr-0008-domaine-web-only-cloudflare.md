# ADR-0008, migrer le domaine sans service de messagerie

## Statut

Acceptée le 2026-08-24.

Cette décision remplace uniquement l'obligation de reprise des enregistrements
de messagerie prévue par l'ADR-0007.

L'ADR-0009 complète ensuite cette décision avec les DNS nécessaires à l'envoi
transactionnel, sans créer de boîte de réception humaine.

## Contexte

`monflorian.com` est désormais délégué aux serveurs de noms Cloudflare. La zone
Cloudflare publiée ne contient encore aucun enregistrement web ou mail.

Les anciens serveurs OVHcloud conservent un relevé de trois MX, d'un SPF et d'un
DMARC. Le propriétaire confirme qu'aucune adresse de courriel du domaine n'a été
utilisée et qu'aucun service de messagerie entrant ne doit être repris.

Le futur courriel transactionnel du produit reste un besoin distinct, décidé
ensuite par l'ADR-0009.

## Décision

- Attacher `monflorian.com` et `www.monflorian.com` au Worker `monflorian` avec
  deux Custom Domains exacts.
- Conserver `monflorian.nclsppr.workers.dev` comme surface de diagnostic.
- Ne recréer aucun MX, SPF, DMARC ou autre enregistrement de messagerie issu de
  l'ancienne zone.
- Ne modifier aucune ressource Atlas pendant cette migration.

## Conséquences

- Le domaine devient volontairement web-only.
- Un courriel envoyé vers une adresse `@monflorian.com` n'a pas de service de
  réception prévu.
- La notification transactionnelle exige sa propre décision, ses
  enregistrements DNS et une preuve d'envoi.
- Le relevé OVHcloud reste une preuve historique et non une source à restaurer.

## Vérification

- Vérifier la délégation Cloudflare sur plusieurs résolveurs.
- Vérifier TLS et HTTP sur l'apex et `www`.
- Vérifier que les deux noms servent la même version Worker.
- Vérifier que la génération reste fermée.
- Vérifier l'absence intentionnelle de MX sur la zone Cloudflare.

## Rollback

Retirer les deux Custom Domains ou restaurer uniquement les anciens
enregistrements web. Ne pas réintroduire une messagerie sans nouvelle décision.

## Références

- [ADR-0007](adr-0007-runtime-et-production-cloudflare.md)
- [`RUNBOOK.md`](../../RUNBOOK.md)
- [`ROADMAP.md`](../../ROADMAP.md)
- `wrangler.jsonc`
