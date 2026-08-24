# ADR-0004, servir un aperçu public sans génération

## Statut

Remplacée le 2026-08-24 par l'ADR-0007 pour le runtime et la production. Elle
reste la preuve historique de l'aperçu Atlas.

## Contexte

Le candidat F01 possède déjà l'interface cible et un backend sans port hôte. Sa
première route Atlas exigeait un accès privé avant d'afficher la page. Cette
condition empêchait de voir le rendu sur `monflorian.com` tant que l'accès privé
et les essais OpenAI n'étaient pas terminés.

Le propriétaire demande une première page visible sur le domaine, même si la
composition de voyage ne fonctionne pas encore. Cette demande n'autorise ni un
appel OpenAI, ni l'envoi d'une photo, ni un paiement.

## Décision

Publier l'interface F01 comme aperçu public. Le backend conserve son image
immuable, son utilisateur non privilégié, son système de fichiers en lecture
seule et l'absence de port hôte.

La configuration Atlas fixe `MONFLORIAN_GENERATION_ENABLED=false` et
`MONFLORIAN_ILLUSTRATION_ENABLED=false`. `/api/config` renvoie donc
`serviceReady: false`. Le navigateur garde le formulaire visible, désactive son
action et indique qu'aucune demande ne sera envoyée.

Caddy sert la page sans identifiant et redirige `www` vers l'apex. La clé OpenAI
reste un secret Atlas versionné par son registre, mais ce candidat ne l'utilise
pas pour traiter une demande. Sa présence ne prouve aucune capacité de
génération.

## Conséquences

- Le public peut voir le vrai rendu sur le vrai domaine.
- Aucun brief ou photo ne part vers OpenAI dans cet état.
- L'aperçu ne livre ni itinéraire, ni illustration, ni mini-site personnalisé.
- L'activation des générations exige un nouveau candidat, les essais privés et
  une nouvelle décision d'ouverture.
