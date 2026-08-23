# Profil web

Activer ce profil pour un site, une application web, un dashboard ou une documentation publiée.

Ce profil opérationnalise `P08`, `P10`, `P13`, `P14` et le default `D06`. Ses gates sont opt-in au niveau du projet. La définition de done active ensuite uniquement celles qui concernent l'unité de travail.

## Contrat utilisateur

- Définir le parcours principal et son résultat.
- Rendre les états chargement, vide, erreur, succès et indisponibilité explicites.
- Conserver les contrats publics existants : URLs, ancres, paramètres et liens profonds.
- Signaler les données de démonstration.
- Préserver une fonction essentielle sans enrichissement optionnel lorsque c'est réaliste.

## Accessibilité

- Préférer les éléments HTML et contrôles natifs. Utiliser ARIA pour compléter un comportement que le HTML ne peut pas exprimer.
- Navigation clavier complète.
- Focus visible et ordre logique.
- Contrastes au moins WCAG AA sauf exception documentée.
- Cibles tactiles d'au moins 44 px sur une interface tactile ou un pointeur grossier.
- État ARIA synchronisé avec l'interface.
- Aucun sens porté uniquement par la couleur.
- Images informatives avec alternative utile.
- Décor masqué aux technologies d'assistance.
- Modales avec focus géré et arrière-plan inerte.
- `prefers-reduced-motion` respecté.
- Champs avec label et nom accessible.
- Instructions et erreurs associées à leur champ.
- Zoom, agrandissement du texte et reflow sans perte d'information.
- Sous-titres ou transcription lorsqu'un média porte une information.

## Responsive

- Concevoir la composition mobile, ne pas seulement réduire la version desktop.
- Vérifier au moins un petit viewport tactile et un viewport bureau.
- Tester contenu court, contenu long et chaînes non sécables.
- Interdire les débordements horizontaux involontaires.
- Réserver les hovers aux périphériques qui les supportent.

## Design system

- Écrire `DESIGN.md` avant une refonte significative.
- Le pack Full ou Critical avec ce profil porte `DESIGN.md`. Un pack Minimal ou Standard conserve l'intention légère dans son brief ou `PROJECT.md`, sauf si l'ampleur justifie d'adopter le template complet.
- Définir les tokens et leur source exécutable.
- Lier chaque différence visuelle à une intention produit.
- Éviter les décorations génériques sans fonction.
- Documenter les zones gelées.
- Choisir les images selon leur fonction : information, narration, identité ou ambiance.

## Performance et résilience

- Définir un appareil et un réseau de référence.
- Fixer des budgets pour images, JavaScript, rendu et mouvement.
- Suspendre les enrichissements hors écran ou onglet caché lorsque pertinent.
- Une couche décorative ou 3D ne doit pas muter le domaine métier.
- Prévoir un fallback si WebGL, JavaScript ou une dépendance facultative échoue.

## SEO et publication

Pour une surface publique :

- titre, description, canonical et métadonnées sociales ;
- `lang` et `hreflang` si multilingue ;
- sitemap et robots cohérents ;
- statut d'indexation explicite pour les expériences ;
- cache-busting lié à l'artefact ;
- contrôle HTTP et visuel de l'URL publiée.

## Gate minimale

- contrôles statiques et tests du projet ;
- absence d'erreur console et réseau inattendue ;
- mobile et desktop ;
- clavier et focus ;
- mouvement normal et réduit ;
- thèmes supportés ;
- routes et liens ;
- performance sur la cible définie ;
- URL finale après déploiement.
