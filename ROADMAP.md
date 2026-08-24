# ROADMAP.md

Source canonique de l'ordre de livraison.

## Résultat produit

Mon Florian prépare un voyage, montre les voyageurs dans les destinations sous
forme de projections générées, conserve une page privée et l'envoie par
courriel. Le MVP est gratuit. Booking affilié et Stripe viennent après la preuve
de ce parcours.

## Principes de séquencement

- Un seul runtime et un seul déploiement Cloudflare.
- Aucune photo réelle avant R2 privé, rétention et suppression prouvées.
- Aucun appel payant avant quotas persistants, Turnstile et budget.
- Aucun retry aveugle d'une étape OpenAI au résultat incertain.
- Aucun déplacement DNS avant preuve sur `workers.dev` et décision explicite sur
  les services non web de la zone.
- Aucun paiement avant la preuve du parcours gratuit.
- Une ressource provisionnée ne vaut pas capacité livrée.

## Vue d'ensemble

| Ordre | ID | Phase | État | Critère de sortie |
| --- | --- | --- | --- | --- |
| 0 | F00 | Prototype reproductible | done | concept local, Compose et CI |
| 1 | F01 | Contrats métier et OpenAI simulé | done | validateurs, OpenAPI et fakes fournisseur |
| 2 | F02 | Aperçu historique sans génération | done | interface publique fermée sur l'ancienne cible |
| 3 | F03 | Runtime Cloudflare fermé | done | Worker, D1, Workflow, PR, CI et preuve publique |
| 4 | F04 | Stockage privé et cycle de vie | in_progress | R2 UE, chiffrement, jetons et purge prouvés |
| 5 | F05 | Génération synthétique asynchrone | in_progress | texte, images, quotas, reprise et coûts observés |
| 6 | F06 | Page privée et courriel | in_progress | rendu, suppression, notification et notice validés |
| 7 | F07 | Domaine Cloudflare | done | web, DNS d'envoi, apex, `www`, TLS et release vérifiés |
| 8 | F08 | MVP gratuit limité | planned | Turnstile, budget et premier utilisateur informé |
| 9 | F09 | Attribution Booking.com | blocked | partenariat et liens approuvés |
| 10 | F10 | Paiement Stripe | planned | Checkout, webhook signé, fiscalité et remboursement décidés |
| 11 | F11 | Voyage vivant | planned | parcours pendant et après le séjour testé |

États autorisés : `planned`, `in_progress`, `blocked`, `done`, `cancelled`.

## F03, runtime Cloudflare fermé

Inclus :

- Worker TypeScript et Static Assets ;
- D1 avec migrations versionnées ;
- Workflow déployé mais incapable d'appeler OpenAI ;
- suppression du serveur HTTP et des releases OCI/VPS du chemin courant ;
- CI Wrangler et Docker Compose local ;
- URL `workers.dev` avec génération fermée.

La phase est terminée quand la branche est fusionnée, `main` est vert, la règle
de protection exige `Validate Cloudflare release`, la version Worker issue du
SHA fusionné répond et la preuve est consignée.

## F04, stockage privé et cycle de vie

Le bucket privé UE, ses règles de cycle de vie, les secrets de chiffrement et
la migration d'idempotence sont en place. Le Worker déployé ajoute l'écriture R2, le
chiffrement AES-GCM, le jeton haché, la suppression anticipée et la tâche de
purge. La phase reste ouverte jusqu'à une preuve synthétique après déploiement.

- Activer R2 et créer un bucket à juridiction UE.
- Garder le bucket privé et refuser `r2.dev`.
- Écrire les photos dans R2 avant de démarrer le Workflow.
- Chiffrer brief, résultat et courriel dans D1 avec un Worker Secret.
- Hacher le jeton de consultation et ne jamais le journaliser.
- Supprimer les sources après génération, au plus tard sous 24 heures.
- Expirer le voyage sous 30 jours et offrir une suppression anticipée.
- Prouver la purge avec des objets et données synthétiques.

## F05, génération synthétique asynchrone

Le quota transactionnel, les étapes Responses et Image Edits sans retry, le
stockage R2 et la lecture privée de l'image sont codés. La phase reste ouverte :
Turnstile est configuré, mais la clé OpenAI n'est pas installée sur le Worker,
les drapeaux sont à `false` et aucun coût fournisseur n'a été engagé.

- Vérifier Turnstile avant création.
- Débiter les quotas D1 de façon atomique.
- Démarrer une seule instance Workflow par voyage.
- Appeler Responses avec `store: false`, schéma strict et plafond de sortie.
- Appeler Image Edits depuis des clés R2 validées.
- Ne pas relancer automatiquement un appel payant si son résultat est inconnu.
- Stocker les identifiants techniques et l'usage sans contenu.
- Exécuter un seul brief et une seule image synthétiques, puis inspecter coût et
  logs.

Un test avec fake ne termine pas cette phase.

## F06, page privée et courriel

Le domaine Cloudflare Email Service est actif et le binding restreint à
`voyage@monflorian.com` est câblé derrière
`MONFLORIAN_EMAIL_ENABLED=false`. Aucun courriel n'a encore été envoyé.

- Rendre `/voyages/{jeton}` depuis D1 et R2 avec `noindex` et `no-store`.
- Ne pas enregistrer une copie HTML par voyage ; utiliser le template commun.
- Envoyer un lien privé, jamais les photos ou le brief complet dans le courriel.
- Chiffrer puis supprimer l'adresse après envoi réussi.
- Fournir statut, reprise d'envoi et suppression.
- Publier la notice et le canal de droits avant un utilisateur réel.

## F07, domaine Cloudflare

- L'ancienne zone OVHcloud a été relevée avant mutation.
- Les anciens MX, SPF et DMARC inutilisés n'ont pas été recréés. L'ADR-0009
  ajoute seulement les DNS propres à l'envoi transactionnel Cloudflare.
- Le Worker porte l'apex et `www` comme Custom Domains.
- Les anciennes valeurs A web restent consignées pour un rollback explicite.
- DNS public, TLS, page, configuration et release ont été sondés après
  propagation.

## F08, MVP gratuit limité

- Limite quotidienne globale et par client.
- Turnstile visible et erreurs compréhensibles.
- Budget OpenAI et alerte de coût.
- Consentement photo et durée de rétention visibles.
- Premier parcours humain volontaire, limité et supprimable.

## F09, attribution Booking.com

Le mode `external` reste la valeur par défaut. `cj-static` exige un partenariat
accepté, des liens approuvés, une liste d'hôtes et la mention commerciale près de
chaque lien. Aucune affiliation n'est déduite d'une URL trouvée en ligne.

## F10, paiement Stripe

Le paiement ponctuel utilisera Checkout Sessions hébergé avec méthodes de
paiement dynamiques et clé restreinte. Seul un webhook signé et idempotent peut
marquer le paiement comme acquis. Fiscalité, remboursements, support et mode réel
font l'objet d'une décision séparée.

## Règle de mise à jour

- Mettre à jour une phase uniquement avec une preuve observable.
- Reporter résultats et limites dans `DELIVERY-EVIDENCE.md` et `STATUS.md`.
- Créer une ADR si l'ordre, la durée de rétention ou un fournisseur change.
- Garder une seule roadmap.
