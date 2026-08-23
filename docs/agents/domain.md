# Documentation du domaine

Cette convention indique aux skills comment lire la documentation du domaine avant d'explorer le code.

## À lire avant l'exploration

- Lire `CONTEXT.md` à la racine lorsqu'il existe.
- Lire sous `docs/decisions/` les ADR qui concernent la zone de travail.

Si un fichier ou le glossaire manque, poursuivre sans le signaler et sans proposer sa création. Le skill `/domain-modeling` crée ces sources seulement lorsqu'un terme ou une décision doit être consigné.

## Structure

Le dépôt utilise un contexte unique :

```text
/
├── CONTEXT.md
├── docs/
│   └── decisions/
│       ├── adr-0001-exemple.md
│       └── adr-0002-exemple.md
└── app/
```

## Employer le vocabulaire du glossaire

Quand une sortie nomme un concept du domaine, dans un titre de ticket, une proposition de refactorisation, une hypothèse ou un test, employer le terme défini dans `CONTEXT.md`. Ne pas le remplacer par un synonyme que le glossaire écarte.

Si le concept manque, vérifier d'abord qu'il existe réellement dans le produit. Signaler au skill `/domain-modeling` un vrai manque de vocabulaire.

## Signaler les conflits avec une ADR

Si une proposition contredit une ADR acceptée, nommer le conflit au lieu de remplacer silencieusement la décision. Par exemple :

> Cette proposition contredit l'ADR-0002 sur le runtime sans base de données. La rouvrir exige une nouvelle décision motivée.
