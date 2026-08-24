# ADR-0009, envoyer le lien privé avec Cloudflare Email Service

## Statut

Acceptée le 2026-08-24.

Cette décision remplace le fournisseur HTTP encore indéterminé de l'ADR-0007 et
complète la frontière web-only de l'ADR-0008. Elle n'active aucune boîte de
réception humaine sur `@monflorian.com`.

## Contexte

Le MVP doit prévenir la personne quand son voyage est prêt. Le message doit
contenir le lien privé et sa date d'expiration, sans photo, brief ni copie du
voyage. Ajouter un fournisseur externe créerait un compte, un secret, une API et
une chaîne d'exploitation supplémentaires.

Cloudflare Email Service fournit désormais un binding natif Workers. Le domaine
`monflorian.com` peut envoyer vers tout destinataire après activation de SPF,
DKIM, DMARC et du sous-domaine de bounce. Le compte dispose d'un quota initial
de 200 envois par jour.

## Décision

- Utiliser le binding `send_email` nommé `EMAIL`.
- Autoriser uniquement l'expéditeur `voyage@monflorian.com` dans ce binding.
- Envoyer un unique lien vers `/voyages/{jeton}` après le passage du voyage à
  `ready`.
- Ne joindre ni photo, ni brief, ni itinéraire au message.
- Ne jamais relancer automatiquement un envoi dont le résultat est incertain.
- Marquer la notification `sent` ou `failed` sans dégrader un voyage déjà prêt.
- Supprimer l'adresse chiffrée de D1 après un envoi confirmé.
- Garder `MONFLORIAN_EMAIL_ENABLED=false` jusqu'au parcours synthétique complet.

## Conséquences

- Aucun compte ni secret de courriel tiers n'est nécessaire.
- Cloudflare reçoit l'adresse du destinataire, le lien privé et les métadonnées
  de livraison.
- Les MX du sous-domaine `cf-bounce`, SPF, DKIM et DMARC servent uniquement
  l'envoi et les bounces. Ils ne créent pas une boîte de réception utilisateur.
- Une panne d'envoi laisse la page privée disponible et conserve l'adresse
  chiffrée pour une reprise contrôlée.
- Le produit dépend d'une fonctionnalité Cloudflare encore en bêta publique.

## Vérification

- Vérifier le statut `Enabled` et les DNS `Configured` dans Email Service.
- Vérifier le binding et sa restriction d'expéditeur dans le dry-run Wrangler.
- Vérifier qu'un message synthétique ne contient que le lien privé et la date
  d'expiration.
- Vérifier qu'un succès efface l'adresse et qu'un échec ne supprime pas le
  voyage.
- Envoyer un seul courriel synthétique avant toute personne réelle et inspecter
  le journal de livraison, les bounces et les suppressions.

## Rollback

Couper `MONFLORIAN_EMAIL_ENABLED`, retirer le binding du Worker, puis désactiver
le domaine dans Email Service si le retour arrière doit aussi supprimer la
capacité d'envoi. Ne retirer les DNS ajoutés qu'après cette désactivation.

## Références

- [Cloudflare Email Service](https://developers.cloudflare.com/email-service/)
- [Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Configuration des bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [ADR-0007](adr-0007-runtime-et-production-cloudflare.md)
- [ADR-0008](adr-0008-domaine-web-only-cloudflare.md)
