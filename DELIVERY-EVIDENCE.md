# Preuves de livraison

Chaque section nomme son environnement et ses limites. Les sections Atlas sont
des archives historiques ; la section Cloudflare porte la migration courante.

## Lockup d'introduction partagé avec la V2, 2026-08-26

La PR [#49](https://github.com/nclsppr/monflorian/pull/49) reprend sur `/v2`
le grand lockup canonique de la racine, la note Kalam sur trois traits blancs et
le seuil d'intersection qui fait apparaître sa composition compacte dans
l'en-tête. Les ancres du questionnaire réservent aussi la hauteur de cet
en-tête.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `99440d5808e8d11a4c7d4a80efed08074fe7e3a6` |
| Version active | `fce98697-262d-4351-89c9-9346c5d0a18a` |
| CI du SHA fusionné | runs `32980857522` et `32980857606` verts |
| CI de la PR | runs `32980683184` et `32980683123` verts sur `a381735` |
| Bundle Worker | 99,59 Kio avant compression, 24,64 Kio gzip, 66 assets lus |
| Publication | 4 assets nouveaux ou modifiés envoyés, 56 assets réutilisés |
| Assets V2 actifs | `index-Ez4flX5B.css` et `index-BkZh_n4F.js` |
| Route V2 | `/v2` en `200`, avec `noindex` |
| Bureau | introduction et étapes 1 à 3 à `1440 × 900`, dépassement horizontal `0` |
| Mobile | introduction et étapes 1 à 3 à `390 × 844`, dépassement horizontal `0` |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 57 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Le runtime public a ensuite été relu dans Chromium aux deux
viewports indiqués. L'introduction, le passage au header et l'arrivée du
questionnaire à `16 px` sous celui-ci sont visibles sur le domaine actif. Aucun
iPhone Safari physique n'était disponible pendant cette tranche.

Les sondes publiques retrouvent les deux assets hachés et la version active sur
`/api/health`. Aucun brief, courriel, photo, secret ni appel OpenAI n'a été
envoyé. Le corps synthétique vide utilisé pour la sonde de création a été
refusé en `503` avant tout traitement.

## Identité V2 et questionnaire mobile, 2026-08-26

La PR [#47](https://github.com/nclsppr/monflorian/pull/47) réintègre dans
`/v2` la grammaire de l'accueil historique : pile système, halos cyan et
citron, encre, surfaces, formes et prises de parole de Florian. Outfit reste
limitée aux titres blancs sur les photos. Le questionnaire conserve les
composants Astryx mais corrige le rendu de ses trois étapes sur petit écran.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `567f27bbb2c93b2896e96c39b374bbf25826f413` |
| Version active | `6f25138f-a901-4dd5-8c37-14f834d300d4` |
| CI du SHA fusionné | runs `32976483187` et `32976483108` verts |
| CI de la PR | runs `32976312038` et `32976311887` verts sur `cc8eeda` |
| Bundle Worker | 99,59 Kio avant compression, 24,64 Kio gzip, 66 assets lus |
| Publication | 4 assets nouveaux ou modifiés envoyés, 56 assets réutilisés |
| Assets V2 actifs | `index-dI_eD7VM.css` et `index-cPIIkQC_.js` |
| Bureau | étapes 1 à 3 à `1440 × 900`, largeur du document `1440 px`, dépassement `0` |
| Mobile | étapes 1 à 3 à `390 × 844`, largeur du document `390 px`, dépassement `0` |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

La correction retire les steppers numériques natifs, stabilise le libellé
facultatif, supprime les hauteurs forcées et empile les actions de la troisième
étape sous `440 px`. Les contrôles visibles mesurent au moins `52 px` de haut.
Les éléments Astryx annoncés aux technologies d'assistance restent
volontairement masqués à `1 px` et ne constituent pas un dépassement visible.

`./scripts/verify.sh` passe avec 56 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Le runtime public a ensuite été relu dans Chromium aux deux
viewports indiqués. Aucun iPhone Safari physique n'était disponible pendant
cette tranche.

Les sondes publiques confirment `/v2` en `200` et `noindex`, les deux assets
hachés, `www` en `308` vers l'apex et la même version sur la santé et le marqueur
de release. Aucun brief, courriel, photo, secret ni appel OpenAI n'a été envoyé.
Le corps synthétique vide utilisé pour la sonde de création a été refusé en
`503` avant tout traitement.

## Parcours V2 Japon, 2026-08-26

La PR [#45](https://github.com/nclsppr/monflorian/pull/45) publie sous `/v2`
le questionnaire Astryx, le carnet fixe « Le Japon à deux », les six visuels
WebP et le partage public ou privé côté navigateur. Le parcours reste isolé du
backend fermé et hors index.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `6672048100346562af8d9efbee045b10cbb4b6a0` |
| Version active | `b7fbef1e-b0d4-4524-94c2-0a0a283eaa3e` |
| CI du SHA fusionné | runs `32936664672` et `32936664685` verts |
| Bundle Worker | 99,59 Kio avant compression, 24,64 Kio gzip, 66 assets lus |
| Publication | 12 assets nouveaux ou modifiés envoyés, 48 assets réutilisés |
| Route V2 | `/v2` en `200` et `noindex`; `/v2/` et `/v2/index.html` en `308` vers `/v2` |
| Médias | six WebP publics en `200`, avec le type `image/webp` |
| Parcours | formulaire en trois étapes, génération, carnet de dix jours et trois recherches Booking.com |
| Partage | modes public et privé présents; mot de passe de démonstration affiché dans le dialogue |
| Bureau | `/v2` puis carnet Japon à `1440 × 900`, sans erreur console |
| Mobile | carnet Japon à `390 × 844`, largeur du document `390 px`, dépassement `0` |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

Le titre, les assets Vite, Outfit auto-hébergée et les trois scènes du couple
fictif ont été relus depuis l'apex. `www` redirige vers l'apex, `workers.dev`
sert aussi la V2 et le sitemap ne contient que l'accueil canonique. Aucun brief,
courriel, portrait personnel, secret ni appel OpenAI n'a été envoyé pendant
ces sondes.

## Florian V2 principal et notes variables, 2026-08-25

La PR [#43](https://github.com/nclsppr/monflorian/pull/43) promeut les cinq
portraits Florian V2 sur l'accueil. La note manuscrite choisit indépendamment
parmi dix formulations et exclut la phrase vue au chargement précédent. Sa
teinte devient le crayon sauge `#85897a`. Les icônes et la carte sociale suivent
la même famille visuelle, tandis que `/v2` devient une redirection vers
l'accueil canonique.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `8609565b66fd61ac9b087680bc1d8468ac631386` |
| Version active | `53adda80-16a4-40fe-869b-26e5d16a46d2` |
| CI du SHA fusionné | runs `32881682239` et `32881682196` verts |
| Bundle Worker | 99,94 Kio avant compression, 24,72 Kio gzip, 51 assets lus, dont 37 visuels de marque |
| Portraits | les variantes `original`, `wind`, `beanie`, `summer` et `flower` utilisent toutes Florian V2 |
| Notes | dix formulations testées, tirage aléatoire indépendant et exclusion de la précédente via la session |
| Bureau | `/` à `1280 × 720`, introduction, lockup et hero à `1240 px`, note à `311 px`, dépassement `0` |
| Mobile | `/` à `390 × 844`, introduction, lockup et hero à `362 px`, note à `278 px` en `17 px`, dépassement `0` |
| Couleur | Kalam en crayon sauge `rgb(133, 137, 122)` sur trois traits blancs translucides |
| Rotation publique | 20 chargements, 9 phrases observées et aucune répétition consécutive ; les 10 choix sont couverts par le test déterministe |
| Route de test | `/v2` et `/v2/` en `308` vers `/` avec la requête conservée |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 52 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions couvrent les dix phrases, l'absence de
répétition immédiate, la famille V2, la redirection canonique, la teinte, les
dimensions des icônes et le poids de la carte sociale.

Les sondes publiques confirment `/avatar.js?v=6`, la feuille
`intro-sage-1`, les portraits V2, les nouveaux fichiers de marque, la version
Worker cohérente sur la santé et le marqueur de release, ainsi que les deux
redirections `/v2`. Le runtime public a été relu dans Chromium aux deux
viewports indiqués.

Aucun brief, portrait personnel, courriel, secret ni appel OpenAI n'a été
envoyé. Le corps synthétique vide utilisé pour la sonde de création a été
refusé en `503` avant tout traitement.

## Introduction bornée et note au crayon, 2026-08-25

La PR [#41](https://github.com/nclsppr/monflorian/pull/41) aligne
l'introduction et son grand logo sur le conteneur de contenu plafonné à
`1240 px`. Elle remplace la typographie de la note par Kalam auto-hébergée en
gris graphite et resserre légèrement son empreinte sur mobile.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `85529c9da16a92ad08a6c2bdb13e13410f259309` |
| Version active | `9e0e0c78-beb7-4c5b-a84c-422f11b97346` |
| CI du SHA | runs `32878314291` et `32878314253` verts |
| Bundle Worker | 99,98 Kio avant compression, 24,73 Kio gzip, 51 assets lus, dont 37 visuels de marque |
| Fonte | Kalam latin 400 auto-hébergée, WOFF2 public de 22 336 octets, licence OFL publique |
| Bureau | `/v2?avatar=flower`, viewport `1920 × 1000`, introduction, lockup et hero à `1240 px`, note à `311 px` en `25 px`, dépassement `0` |
| Mobile | `/v2?avatar=flower`, viewport `390 × 844`, introduction, lockup et hero à `362 px`, note à `278 px`, papier à `301 px`, texte en `17 px`, dépassement `0` |
| Note | Kalam chargée, graphite `rgb(69, 73, 80)`, trois traits blancs translucides, aucun mouvement |
| Route de test | `/v2` en `200` et `noindex`; `/v2/` en `308` vers `/v2` |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 51 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions contrôlent la largeur maximale de
l'introduction, ses gouttières mobiles, le préchargement de Kalam, le format
WOFF2, sa taille et la présence de la licence OFL.

Les sondes publiques confirment la feuille `intro-pencil-1`, la fonte WOFF2 et
sa licence en `200`, la version Worker cohérente sur la santé et le marqueur de
release, ainsi que `/v2` en `noindex`. Le runtime public a été relu dans
Chromium aux deux viewports indiqués.

Aucun brief, portrait personnel, courriel, secret ni appel OpenAI n'a été
envoyé. Le corps synthétique vide utilisé pour la sonde de création a été refusé
en `503` avant tout traitement.

## Comparaison des avatars et note de Florian, 2026-08-25

La PR [#39](https://github.com/nclsppr/monflorian/pull/39) ajoute une seconde
famille de cinq portraits sur `/v2`, sans dupliquer l'accueil. La note
« Alors, on part où ? » remplace la précédente accroche sur les deux routes afin
que la comparaison porte seulement sur Florian.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `123aa956394d86a0d58059b41b53fb23c2116512` |
| Version active | `f9702f56-0fc3-4809-8789-6f9eb9928f31` |
| CI du SHA | runs `32876057692` et `32876057635` verts |
| Bundle Worker | 99,98 Kio avant compression, 24,73 Kio gzip, 48 assets lus, dont 37 visuels de marque |
| Route de test | `/v2` en `200` et `noindex`; `/v2/` en `308` vers `/v2` avec la requête conservée |
| Test apparié | `?avatar=original`, `wind`, `beanie`, `summer` ou `flower` choisit la même variante dans chaque famille |
| Nouveaux assets | dix WebP publics en `200`, compacts de 25 818 à 36 052 octets et introductions de 104 784 à 162 212 octets |
| Note | bleu électrique `rgb(23, 114, 255)`, trois traits blancs translucides, aucun mouvement |
| Bureau | `/v2?avatar=original`, viewport `1440 × 900`, avatar `526 px`, note `311 px` en `25 px`, dépassement `0` |
| Mobile | `/v2?avatar=flower`, viewport `390 × 844`, avatar `141 px`, note `311 px` en `18 px`, dépassement `0` |
| Console | aucune erreur ni alerte pendant les contrôles Chromium |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 51 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions contrôlent les deux familles de portraits,
le paramètre apparié, la route hors index, les dérivés transparents et la note
statique.

Les sondes publiques confirment la feuille `intro-note-2`, le script
`avatar.js?v=3`, la version Worker cohérente sur la santé et le marqueur de
release, les dix nouveaux WebP et la redirection canonique de `/v2/`. Le runtime
a été relu dans Chromium aux deux viewports indiqués. Aucun iPhone Safari ni
poste Windows 11 physique n'était disponible pendant cette tranche.

Aucun brief, portrait personnel, courriel, secret ni appel OpenAI n'a été
envoyé. Le corps synthétique vide utilisé pour la sonde de création a été refusé
en `503` avant tout traitement.

## Logo pleine largeur et accroche saisie, 2026-08-25

La PR [#37](https://github.com/nclsppr/monflorian/pull/37) donne toute la
largeur disponible au lockup d'introduction et réserve davantage d'air avant
le hero sur grand écran. L'accroche passe en bleu profond et se révèle comme
une courte saisie au clavier, sans mouvement continu ni changement des
capacités fermées du service.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `030d675d59e84da81c14a001aab0161f0fb06e71` |
| Version active | `a5ea6451-debb-40d9-9f5d-00c8cedfdeb3` |
| CI du SHA | runs `32872922049` et `32872922188` verts |
| Bundle Worker | 99,72 Kio avant compression, 24,68 Kio gzip, 33 assets lus, dont 22 visuels de marque |
| Bureau | viewport `1440 × 900`, lockup `1440 px`, avatar `526 px`, mot-symbole `907 × 486 px`, hero à `900 px`, dépassement `0` |
| Mobile | viewport `390 × 844`, lockup `390 px`, mot-symbole au bord droit, hero à `596 px`, dépassement `0` |
| Accroche | bleu profond, révélation unique de `1 400 ms` en `35` pas sur `clip-path`, sans boucle ni JavaScript |
| Mouvement réduit | animation et masque désactivés, accroche immédiatement lisible |
| Assets d'introduction | portraits WebP `1024 × 1024` de 112 à 160 Kio, mot-symbole WebP `1352 × 724` de 111 Kio |
| Passage à l'en-tête | apparition du logo compact après l'introduction, sans calcul continu du défilement |
| Application | aucune exception applicative pendant les contrôles Chromium |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 49 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions contrôlent les sources d'introduction, la
largeur du lockup, la saisie ponctuelle et son repli sans mouvement.

Les sondes publiques confirment les nouveaux WebP, la feuille
`intro-full-1`, la version Worker cohérente sur la santé et le marqueur de
release, `www` en `308` et `workers.dev` en `noindex`. Le runtime public a été
relu dans Chromium aux deux viewports indiqués. Le beacon injecté par
Cloudflare reste bloqué par la politique CSP existante ; aucun script
applicatif n'en dépend. Aucun iPhone Safari ni poste Windows 11 physique
n'était disponible pendant cette tranche.

Aucun brief, portrait, courriel, secret ni appel OpenAI n'a été envoyé. Le
corps synthétique vide utilisé pour la sonde de création a été refusé en `503`
avant tout traitement.

## Accroche et échelle du logo d'introduction, 2026-08-25

La PR [#35](https://github.com/nclsppr/monflorian/pull/35) donne plus de place au
lockup complet avant son remplacement par l'en-tête compact. Elle ajoute
l'accroche « Ton voyage commence avec une envie. » sous le logo, sans rétablir
de mouvement continu ni modifier les capacités fermées du service.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `d49f40db8adb951b8b999cbab4071c799234bb49` |
| Version active | `2dafd61a-0980-4332-9251-3bb54788001f` |
| CI du SHA | runs `32870479571` et `32870479667` verts |
| Bundle Worker | 99,73 Kio avant compression, 24,68 Kio gzip, 27 assets lus |
| Bureau | viewport `1440 × 900`, lockup `860 px`, mot-symbole `540 × 289 px`, dépassement `0` |
| Mobile | viewport `390 × 844`, lockup `343 px` soit `88 %` de la largeur, dépassement `0` |
| Accroche | arrivée unique de `800 ms` sur `opacity` et `transform`, sans boucle ni JavaScript |
| Mouvement réduit | animation et décalage désactivés, accroche immédiatement lisible |
| Passage à l'en-tête | apparition du logo compact après l'introduction, sans calcul continu du défilement |
| Console | aucune erreur ni alerte pendant les contrôles Chromium |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 49 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions contrôlent l'échelle sur grand écran et
mobile, la copie, l'animation ponctuelle et son repli sans mouvement.

Les sondes publiques confirment la feuille `motion-stable-2`, l'accroche, les
deux dimensions CSS, la version Worker cohérente sur la santé et le marqueur de
release, `www` en `308` et `workers.dev` en `noindex`. Le candidat fusionné a
été relu dans Chromium aux deux viewports indiqués. Aucun iPhone Safari ni
poste Windows 11 physique n'était disponible pendant cette tranche.

Aucun brief, portrait, courriel, secret ni appel OpenAI n'a été envoyé. Le corps
synthétique vide utilisé pour la sonde de création a été refusé en `503` avant
tout traitement.

## Correctif de fluidité mobile et de netteté du logo, 2026-08-25

La PR [#33](https://github.com/nclsppr/monflorian/pull/33) remplace le mouvement
continu du logo par un basculement ponctuel et corrige sa source sur grand
écran. Cette livraison annule les choix de mouvement documentés dans la section
« Accueil animé et état de préparation » ci-dessous. Elle ne modifie ni le
runtime privé, ni les secrets, ni les garde-fous d'ouverture.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `d9ea2e5599c3b3b9625a29c61f7635a808b57b1f` |
| Version active | `621a7fce-64cf-4759-a538-a873025a3346` |
| CI du SHA | runs `32841075336` et `32841075379` verts |
| Bundle Worker | 99,73 Kio avant compression, 24,68 Kio gzip, 27 assets lus |
| Défilement | aucun écouteur `scroll`, accès à `scrollY` ou `requestAnimationFrame` dans les scripts publics |
| Premier écran | grand lockup en mise en page réelle, puis apparition du logo compact par `IntersectionObserver` |
| Logo Windows | mot-symbole PNG `676 × 362`, rendu à `325 × 174 px` en DPR 1, sans `scale()` ni `will-change` |
| Téléphone | fixe sur écran tactile ; profondeur CSS native réservée aux pointeurs précis compatibles |
| Bureau public | viewport `1280 × 720`, lockup `520 px`, dépassement `0` |
| Mobile public | viewport `390 × 844`, lockup `304 px`, dépassement `0` |
| Console publique | aucune erreur ni alerte |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 48 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les régressions interdisent désormais tout mouvement lié
au défilement dans les scripts publics, contrôlent la source haute définition
et conservent la suppression de la surbrillance tactile iOS.

Les sondes publiques confirment `/motion.js?v=2`, la feuille
`motion-stable-1`, le PNG haute définition, la version Worker cohérente sur la
santé et le marqueur de release, `www` en `308` et `workers.dev` en `noindex`.
Le rendu public a été relu dans Chromium aux deux viewports indiqués. Aucun
iPhone Safari ni poste Windows 11 physique n'était disponible pendant cette
tranche ; le comportement tactile statique repose sur la media query de
capacités et sa régression automatisée.

Aucun brief, portrait, courriel, secret ni appel OpenAI n'a été envoyé. Le corps
synthétique vide utilisé pour la sonde de création a été refusé en `503` avant
tout traitement.

## Accueil animé et état de préparation, 2026-08-25

La PR [#31](https://github.com/nclsppr/monflorian/pull/31) met en scène le logo,
ajoute une profondeur courte à l'exemple de voyage et retire le vocabulaire qui
présentait les demandes comme « fermées ». Elle ne modifie ni le runtime privé,
ni les secrets, ni les garde-fous d'ouverture.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `41aed05b94122c51bf6eaffc4561359cb1d57abe` |
| Version active | `711148f5-3f4f-4f44-81ae-235e729f9595` |
| CI du SHA | runs `32835924931` et `32835924933` verts |
| Bundle Worker | 99,73 Kio avant compression, 24,68 Kio gzip, 27 assets lus |
| Premier écran | logo centré, puis réduction continue vers l'en-tête |
| Exemple de voyage | téléphone, soleil et montagnes déplacés séparément, sans mouvement du texte |
| Copie | « Ton voyage, à ton rythme », état « En préparation » et limite d'envoi explicite |
| Tactile iOS | surbrillance native retirée des boutons, libellés et questions ; focus clavier conservé |
| Bureau public | viewport `1280 × 720`, logo `520 × 188 px`, dépassement `0` |
| Mobile public | viewport `390 × 844`, logo compact `158 × 57 px`, parallaxe actif, dépassement `0` |
| Console publique | aucune erreur ni alerte |
| Garde-fous | `generationReady: false`, `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 47 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint de
46 fichiers Nimbus. Les tests couvrent aussi l'ordre d'initialisation du
mouvement, le repli `prefers-reduced-motion`, l'impression, le focus clavier et
la surbrillance tactile.

Les sondes publiques confirment le nouveau titre, `/motion.js` en `200`, la
version Worker cohérente sur la santé et le marqueur de release, `www` en `308`
et `workers.dev` en `noindex`. Le rendu public a été relu sur ordinateur et
mobile. Le masque tactile n'a pas été contrôlé sur un iPhone Safari physique
pendant cette tranche.

Aucun brief, portrait, courriel, secret ni appel OpenAI n'a été envoyé. Le corps
synthétique vide utilisé pour la sonde de création a été refusé en `503` avant
tout traitement.

## Accueil indexable et formulaire public, 2026-08-25

La PR [#29](https://github.com/nclsppr/monflorian/pull/29) publie l'accueil
canonique, sa présentation réelle du produit sur invitation et la correction
des champs. Elle n'ouvre aucune demande et ne modifie aucun secret.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `344c26e9d01dfd872cd8b39f96ff0f84098dcb52` |
| Version active | `36448047-c74a-4e92-b0f5-913bf3ca8212` |
| CI du SHA | runs `32828870730` et `32828870752` verts |
| Bundle Worker | 99,72 Kio avant compression, 24,68 Kio gzip, 26 assets lus |
| Indexation | accueil `index,follow`, canonical apex, sitemap à une URL |
| Partage | carte PNG `1200 × 630` servie en `image/png` |
| Canonisation | HTTP, `www` et suffixes HTML publics en `308` vers l'apex HTTPS |
| Surfaces privées | API, voyages, médias et `workers.dev` en `noindex` ; redirections privées en `no-store` |
| Bureau public | viewport `1280 × 720`, dépassement `0`, champ et bouton à `52 px` |
| Mobile local du même candidat | viewport `375 × 812`, dépassement `0`, formulaire et sections stables |
| Garde-fous | `serviceReady: false`, création `false`, `POST /api/trips` en `503` |

`./scripts/verify.sh` passe avec 45 tests, le typage TypeScript, le dry-run
Wrangler, l'image Docker, les sondes Compose ainsi que le build et le lint
Nimbus. Les états fermé réel et ouvert simulé ont été relus sur ordinateur et
mobile. Les sondes publiques confirment le titre, la canonical, les
redirections, `robots.txt`, le sitemap, les types d'assets et l'exclusion des
surfaces privées.

Aucun brief, portrait, courriel, secret ni appel OpenAI n'a été envoyé. Cette
preuve ne constitue pas un score Lighthouse ni une mesure de Core Web Vitals :
le serveur MCP Chrome DevTools spécialisé n'était pas activé pendant la tranche.

## Notice de confidentialité publique, 2026-08-24

La PR [#27](https://github.com/nclsppr/monflorian/pull/27) publie la notice et
la relie au formulaire ainsi qu'aux pages privées. Elle ne termine pas le gate
de droits : le canal complémentaire et les réglages de rétention OpenAI restent
explicitement à publier avant une personne réelle.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `7ff50daa26e4d3a06ae1b780e66929ac07ca23db` |
| Version active | `0d1b0955-6b73-41ba-abc7-43ea9d4679c0` |
| CI du SHA | runs `32768890646` et `32768890626` verts |
| URL | `/confidentialite` en `200` sur l'apex, `www` et `workers.dev` |
| Contenu | données, Cloudflare, OpenAI, Booking.com, durées et retrait anticipé |
| Mobile | viewport `430 × 932`, largeur de page `430`, dépassement `0` |
| Bureau | viewport `1 440 × 900`, dépassement `0` |
| Garde-fou | création toujours en `503`, D1 à zéro voyage, asset et quota |

`./scripts/verify.sh` passe avec 33 tests. Le contrôle navigateur public confirme
le titre, la copie de limite et le rendu mobile. Aucun brief, portrait, courriel
ni appel OpenAI n'a été envoyé.

## Courriel Cloudflare fermé déployé, 2026-08-24

La PR [#25](https://github.com/nclsppr/monflorian/pull/25) ajoute l'envoi du
lien privé par le binding natif Cloudflare Email. Le domaine et le binding sont
actifs, mais aucun message n'a été envoyé et tous les drapeaux restent fermés.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `ab852a55d5dcd8095b445cdc5dd7e868b95a20fa` |
| Version active | `621217cf-3033-4144-8f74-be1cd7c3ff4b` |
| CI du SHA | runs `32767377995` et `32767378027` verts |
| Email Service | domaine `monflorian.com` activé, DNS configurés, quota initial de 200 par jour |
| Binding Worker | `EMAIL`, expéditeur limité à `voyage@monflorian.com` |
| Contenu | lien privé et date d'expiration, sans brief, photo ni itinéraire |
| Échec d'envoi | voyage conservé prêt, notification marquée en échec, aucun retry automatique |
| Succès d'envoi | notification marquée envoyée, adresse chiffrée effacée de D1 |
| Secrets présents | chiffrement, quota et Turnstile seulement, aucun secret de courriel |
| Garde-fous | création, texte, image et courriel à `false` |

Les sondes de l'apex, de `www` et de `workers.dev` renvoient la même version,
`generationReady: false` et `serviceReady: false`. `POST /api/trips` répond
`503` et D1 contient toujours zéro voyage, zéro asset et zéro quota. Les MX de
`cf-bounce.monflorian.com` répondent via `1.1.1.1` et `8.8.8.8`, tandis que
l'apex reste sans MX de réception humaine.

`./scripts/verify.sh` passe avec 32 tests. Aucun appel OpenAI, courriel, brief,
photo ou coût fournisseur n'a été déclenché. Un parcours synthétique complet
reste nécessaire avant l'ouverture.

## Génération asynchrone fermée déployée, 2026-08-24

La PR [#22](https://github.com/nclsppr/monflorian/pull/22) câble le parcours
Responses puis Image Edits dans le Workflow Cloudflare. La PR
[#23](https://github.com/nclsppr/monflorian/pull/23) ajoute Turnstile. La version
est publique, mais tous les appels payants et la création de voyage restent
fermés.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `de029d02f5a27976893e82f2e2b16d032d3b0316` |
| Version active | `ff2bc6e7-6bc2-4a6f-968c-3862ed060534` |
| CI du SHA | runs `32765104823` et `32765104771` verts |
| D1 distant | migrations à jour, zéro voyage, zéro asset et zéro quota |
| Quotas | plafond global `10`, plafond client `2`, débit atomique |
| OpenAI Responses | `store: false`, schéma strict, identifiant de sûreté pseudonymisé |
| OpenAI Image Edits | source lue depuis R2 privé, sortie WebP privée |
| Reprise | aucun retry automatique d'un appel OpenAI au résultat incertain |
| Route d'image | `/api/trips/{jeton}/media/{position}`, liée au jeton et `no-store` |
| Turnstile | widget géré pour l'apex, `www` et `workers.dev`, secret Worker installé |
| Secrets présents | chiffrement, quota et Turnstile, valeurs non affichées |
| Garde-fous | création, texte, image et courriel à `false` |

Les sondes de l'apex, de `www` et de `workers.dev` renvoient la même version et
`generationReady: false`. `POST /api/trips` répond `503` avant de lire la
demande. Une route d'image inconnue répond `404` avec `no-store`, `same-origin`
et `no-referrer`. Le contrôle ciblé du quota provoque l'erreur attendue quand un
plafond est dépassé et confirme le rollback des deux compteurs.

`./scripts/verify.sh` passe avec 31 tests. Aucun appel OpenAI, aucun courriel,
aucune photo réelle et aucun coût fournisseur n'ont été déclenchés. L'ouverture
attend encore la clé OpenAI, le secret du code d'accès, la validation Turnstile
de bout en bout, l'envoi synthétique du lien privé et un unique essai OpenAI
observé.

## Fondation du voyage privé déployée, 2026-08-24

Cette tranche prépare le stockage privé et le contrat asynchrone sans ouvrir la
création. Elle ne contient aucune donnée personnelle et ne lance aucun appel
OpenAI ni courriel.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `e8718a4507ca3e491f9b4d8eadc469c21fdf14a5` |
| PR | [#19](https://github.com/nclsppr/monflorian/pull/19) et [#20](https://github.com/nclsppr/monflorian/pull/20) fusionnées |
| CI du SHA | runs `32762468302` et `32762468303` verts |
| Version active | `e0a0dae3-7330-4912-afe0-679608886323` |
| R2 | `monflorian-media-production`, juridiction `eu`, région `EEUR`, 0 objet |
| Exposition R2 | aucun domaine personnalisé, `r2.dev` désactivé |
| Cycle de vie R2 | `source/` expire après 1 jour, `generated/` après 30 jours |
| D1 distant | migration `0002_trip_idempotency.sql` appliquée |
| Secrets | `TRIP_DATA_KEY` et `TRIP_QUOTA_HASH_KEY` présents, valeurs non affichées |
| Contrat déployé | `POST /api/trips`, page `/voyages/{jeton}`, retrait et purge planifiée |
| Protection des champs | AES-GCM avec contexte, jeton SHA-256, idempotence hachée |
| Garde-fou | `MONFLORIAN_TRIP_CREATION_ENABLED=false` |

Les sondes publiques prouvent `/api/health` et `/api/config` en `200`, le même
identifiant de version sur l'apex, `www` et `workers.dev`, ainsi que
`POST /api/trips` en `503 TRIP_CREATION_UNAVAILABLE`. Un jeton synthétique
inconnu répond `404` avec `no-store`, `noindex`, `nofollow` et `no-referrer`. D1
contient zéro voyage, zéro asset et zéro quota ; R2 contient zéro objet.

Les contrôles locaux ciblés couvrent la validation de la demande combinée,
l'idempotence, le chiffrement lié au contexte, les en-têtes privés et les routes
de jeton normalisées. Le rendu a été contrôlé à `430 × 932` et `1440 × 900` :
aucun débordement horizontal, aucune erreur console et états du formulaire
lisibles. La fondation privée est livrée, mais pas la création de voyage. La
purge applicative reste à prouver avec des données synthétiques ; Turnstile,
quotas, OpenAI, illustration privée et courriel restent fermés.

## Champs de date contenus sur iOS, 2026-08-24

La PR [#17](https://github.com/nclsppr/monflorian/pull/17) retire le padding des
champs `date` qui déclenche le calcul de largeur incorrect de WebKit iOS. La
feuille CSS change aussi d'URL pour éviter de conserver l'ancienne règle dans le
cache du navigateur.

| Preuve | Résultat |
| --- | --- |
| Source runtime | `753fbd91aab7df1f3e4b2ccdac757b2bacadcd35` |
| Version active | `f5a18f77-3f32-466e-a3d4-35fa4218ee97` |
| CI du SHA | runs `32753875356` et `32753875457` verts |
| URL CSS | `/styles.css?v=ios-date-1` sur l'apex et `www` |
| Mobile | viewport `430 × 932`, largeur de page `430`, dépassement `0` |
| Contrôles mesurés | départ, retour, voyageurs et code d'accès |

La régression ciblée échoue sans la surcharge `padding-inline: 0` et passe avec
elle. La page publique, la santé et la nouvelle feuille CSS répondent en `200`
sur `monflorian.com` et `www.monflorian.com`. La génération reste fermée et
aucune donnée utilisateur n'a été envoyée.

## Domaine Cloudflare web-only, 2026-08-24

La PR [#15](https://github.com/nclsppr/monflorian/pull/15) attache l'apex et
`www` au Worker comme Custom Domains. La version a été déployée après fusion,
puis sondée sur les deux noms publics.

| Preuve | Résultat |
| --- | --- |
| URLs | `https://monflorian.com`, `https://www.monflorian.com` |
| Surface de diagnostic | `https://monflorian.nclsppr.workers.dev` conservée |
| Source runtime | `6f6a8438222db31293541c81957434e1841c5df4` |
| Version active | `ce9761c2-5c36-480e-958c-d923bdf49ef0` |
| CI du SHA | runs `32752297195` et `32752297248` verts |
| NS | `armfazh.ns.cloudflare.com`, `uma.ns.cloudflare.com` |
| DNS web | apex et `www` résolus en A et AAAA par `1.1.1.1` et `8.8.8.8` |
| TLS | certificat Google Trust Services pour `monflorian.com` et `*.monflorian.com` |
| HTTP | page, santé et marqueur de release en `200` sur les deux noms |
| Garde-fou | `POST /api/itineraries` en `503 GENERATION_UNAVAILABLE` |
| Courriel de zone | aucun MX, SPF ou DMARC, conformément à l'ADR-0008 |

La santé et le marqueur public renvoient tous deux la version exacte
`ce9761c2-5c36-480e-958c-d923bdf49ef0`. Le titre public est
`Mon Florian · Prépare ton voyage` et la politique de sécurité reste servie par
le Worker. Aucun secret, brief, courriel ou fichier n'a été envoyé pendant ces
sondes. Atlas n'a pas été modifié.

## Bootstrap Cloudflare fermé, 2026-08-24

Cette preuve ouvre la migration décidée par l'ADR-0007. La PR
[#12](https://github.com/nclsppr/monflorian/pull/12) est fusionnée sur `main` et
la version Worker ci-dessous a été redéployée depuis ce SHA.

| Preuve | Résultat |
| --- | --- |
| URL | `https://monflorian.nclsppr.workers.dev` |
| Worker | `monflorian` |
| Source runtime | `6d7029877c9acb098feecea029337d427d0aedd6` |
| Version active | `70b89e6c-e5ce-4e57-a74e-a3bd4186a0ab` |
| Bundle | 9,05 KiB avant compression, 3,13 KiB gzip |
| Static Assets | 13 fichiers lus, 11 objets initiaux chargés |
| D1 | `monflorian-production`, juridiction `eu`, exécution `EEUR` |
| Migration | `0001_trip_lifecycle.sql`, 9 commandes appliquées |
| Workflow | `monflorian-trip`, classe `TripWorkflow` |
| R2 | non activé sur le compte, aucun bucket créé |
| CI du SHA | runs `32742064604` et `32742064568` verts |

Les sondes publiques prouvent : page `200`, en-têtes de sécurité, santé `200`,
configuration fermée, marqueur de release cohérent et itinéraire refusé en
`503 GENERATION_UNAVAILABLE`. Aucun secret ni contenu utilisateur n'a été
envoyé.

Le dry-run Wrangler a validé les bindings Static Assets, D1, Workflow et version
metadata. La base contient seulement `trips`, `trip_assets`, `daily_quotas` et
les tables internes D1 ; aucune ligne utilisateur n'a été créée.

La protection de `main` exige désormais `verify` et
`Validate Cloudflare release`. Limites : le domaine reste hors Cloudflare ; R2,
Turnstile, OpenAI, courriel, page privée, affiliation et Stripe ne font pas
partie de cette preuve. Le déploiement automatique depuis Git reste à connecter.

## Avatars transparents en production, 2026-08-24

La source `4c5619f807c98c929becf7589886577c2bdf9a5b` est active sur
`https://monflorian.com`. La PR produit
[#10](https://github.com/nclsppr/monflorian/pull/10) fournit cinq avatars PNG
RGBA. La PR Atlas [#114](https://github.com/nclsppr/vps-infra/pull/114) aligne
la route publique sur la source attestée avant l'activation applicative.

| Preuve | Résultat |
| --- | --- |
| Source produit | `4c5619f807c98c929becf7589886577c2bdf9a5b` |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:47dbc6705f5a1a8ce5a259dc5919a9472bda8afeae406319fb12447b70aaa816` |
| Intégration VPS | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:528d64d5d3c4b7e70b2de3ecc21c0eaf6d6f064908cacaf5d27d14b4a89f63da` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:73837666d5b4bc7e96560f5c64a5908976c9afd9f3ded3d0686b55c336394f9b` |
| Route publique Atlas | `72b3ad4c8e3d83ce629cdc68cea11c599d9b543e` |
| HTTP | apex `200`, `www` `308`, configuration publique désactivée |
| Runtime | sain, aucun redémarrage, UID/GID `10001:10001`, lecture seule, aucun port hôte |
| Navigateur | 1280 x 720 et 390 x 844, cinq variantes vues, fond transparent et aucun débordement |

Les cinq fichiers publics ont les mêmes SHA-256 que les sources du dépôt :

- `florian-original.png` : `05e7d579661357685a75057990ca2526101b287be1a15c0b6cf0e374d7f5f20c` ;
- `florian-wind.png` : `e7886a41ce1e3975c9a89935ba352160a0b8f0095aafc21dde1d4bc0d5c936dc` ;
- `florian-beanie.png` : `0ec7f32e8fc276a5ec6b824cf7cb841bc5ac5db0ddbaae678dc8c16f8955c7e6` ;
- `florian-summer.png` : `8ebf4de989f1d5a84b9c56b00fc33e18e8ee5e930ea25b96d005bc34869382cc` ;
- `florian-flower.png` : `cdd5e43f5bcc015517682313faca5077b12b84cc71e03e1fca2058ec8c51d202`.

Les workflows produit `32726011754`, `32726011698` et `32726011739` sont
verts. Le workflow Atlas `32735640921` est vert. La convergence de l'edge a
terminé avec `failed=0`. Le contrôle prédictif global a terminé avec `failed=0`
et n'a appliqué aucun changement. Les trois autres apex publics répondent encore
`200`.

## Aperçu public Atlas, 2026-08-24

L'aperçu décidé par ADR-0004 est actif sur `https://monflorian.com`. Il sert
l'interface réelle sans identifiant, tout en refusant les générations.

| Preuve | Résultat |
| --- | --- |
| Source produit | `4ac2c42339941e34c128f779399688032c8ef304` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:af8d18a3df82f8be18f2fd48aebb0a7ff5d62159baf552f1d9fe00ef92d418ba` |
| Contrôle central | `d98db4e339224faebacbc0bc415388749abac91e` |
| Apex | HTTPS `200`, certificat valide, HSTS |
| `www` | `308` vers `https://monflorian.com/` |
| Configuration publique | `serviceReady: false`, `illustrationEnabled: false`, accès `public` |
| Runtime | backend sain, UID/GID `10001:10001`, lecture seule, aucun port hôte |
| Réseau | backend sur `app_monflorian` uniquement, Caddy sain à `172.30.40.254` |
| Navigateur | 1440 x 900 et 390 x 844, aucun débordement ni erreur de console |
| Journaux | champs backend limités au contrat technique; aucun brief, photo, clé, secret ou corps; unique mention Caddy `authorization` liée à ACME |
| Régression Atlas | Mon Florian et les trois apex existants sont restés en `200` pendant quinze minutes |

Les workflows produit `32662637850`, `32662637871` et `32662637854` sont
verts. L'admission Atlas a été fusionnée par la PR 111, puis la correction du
contrôleur historique par la PR 113. Aucun appel OpenAI, aucune photo, aucun
paiement et aucune réservation ne font partie de cette preuve.

> Ce relevé conserve la preuve historique du candidat F01. Il ne décrit pas le candidat courant et ne doit pas servir d'entrée à un déploiement. Utiliser [`STATUS.md`](STATUS.md) pour le tuple figé et [`RESTE-A-FAIRE.md`](RESTE-A-FAIRE.md) pour l'ordre de reprise.

## Référence

| Champ | Valeur |
| --- | --- |
| Unité de travail | F01, backend OpenAI, interface, dessins et contrat Atlas |
| Date | 2026-08-23 |
| Dépôt | `nclsppr/monflorian` |
| Branche | `main` |
| Candidat vérifié | `a7c5d1c32a41c2e43c92f02bff4d584910727eb1` |
| Admission Atlas | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Statut | candidat publié, VPS préparé, service non activé |

## Résultat demandé

Produire une application qui génère un trajet avec OpenAI, ouvre des recherches d'hébergement Booking.com sans inventer d'affiliation, puis crée une projection dessinée à partir de photos consenties. Préparer son déploiement sur Atlas et le domaine OVHcloud.

## Résultat prouvé

- Le backend et le frontend sont commités et poussés sur `main`.
- Les tests locaux, Compose, l'interface mobile et l'interface bureau passent.
- Trois workflows GitHub du même SHA sont verts.
- Les trois artefacts OCI ont des digests et des attestations de provenance.
- L'admission Atlas dormante a été relue, fusionnée et convergée sur le vrai VPS.
- Les enregistrements A de l'apex et de `www` pointent vers Atlas sur les serveurs autoritaires et les résolveurs publics.
- Mon Florian ne tourne pas encore. Le secret, le conteneur, la route active et le certificat sont absents.

## Frontières produit

| Sujet | Contrat retenu |
| --- | --- |
| Itinéraire | Réponse JSON structurée, `store: false`, délai borné et annulation si le client part |
| Photos | 1 à 4 images consenties, validation réelle, réencodage et aucune persistance applicative |
| Illustration | Dessin de projection, jamais présenté comme une photo future réelle |
| Booking.com | Modes `off`, `external` et `cj-static`; aucun hôtel, prix ou stock inventé |
| Affiliation | `rel="sponsored"`; mode `cj-static` interdit sans lien approuvé |
| Runtime | Node.js 24, bibliothèque standard, aucun paquet npm en production |
| Exposition | Aucun port hôte, Caddy doit rejoindre le réseau applicatif et protéger les routes coûteuses |

## Contrôles du candidat

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| `npm test` | 25 tests réussis | Validation, fournisseur simulé, erreurs, annulation et serveur |
| Contrat de release Atlas | 13 tests réussis | Compose, OCI, workflows et règles d'intégration |
| `./scripts/verify.sh` | succès | Tests, documentation, image, santé Compose et arrêt propre |
| Navigateur 1440 x 900 | succès | Mise en page, états et console |
| Navigateur 390 x 844 | succès | Responsive, cibles tactiles et absence de débordement |
| Trivy distant | 0 HIGH, 0 CRITICAL | Image backend publiée |
| Détection de fausse image | rejetée | Le serveur ne fait pas confiance au seul en-tête de fichier |
| Requête HTTP mal formée | `400`, serveur toujours sain | Robustesse du parseur |
| Photo quand la fonction est coupée | bloquée avant envoi | Le drapeau de fonction ne laisse pas fuiter les photos |

## Publication immuable

| Élément | Preuve |
| --- | --- |
| Backend | `ghcr.io/nclsppr/monflorian/backend@sha256:a5c3b1d1f1164697039afe62ccb4bfcb1258c941a5667a220cb3a80a7e3ae114` |
| Intégration | `ghcr.io/nclsppr/monflorian/vps-integration@sha256:cb485c36bc32311f9066bb9e7af6089377090fde2f5d493e7f5d48a9205e052b` |
| Release applicative | `ghcr.io/nclsppr/monflorian/application-release@sha256:9f7e279892bb3d2e4fbddf8a3bbb36238485d4c3279ff4ddef15927ec4b460e1` |
| Archive de preuve | [artifact 9494271140](https://github.com/nclsppr/monflorian/actions/runs/32643543726/artifacts/9494271140) |
| SHA-256 de l'archive | `793181a9f1043de7d982e810329843ca1a39b91c0634940cbad62c8d38128aa3` |
| Attestation backend | [42424171](https://github.com/nclsppr/monflorian/attestations/42424171) |
| Attestation intégration | [42424201](https://github.com/nclsppr/monflorian/attestations/42424201) |
| Attestation release | [42424207](https://github.com/nclsppr/monflorian/attestations/42424207) |

## CI distante

| Workflow | Run | État |
| --- | --- | --- |
| Verify | [32643543755](https://github.com/nclsppr/monflorian/actions/runs/32643543755) | succès |
| Container images | [32643543727](https://github.com/nclsppr/monflorian/actions/runs/32643543727) | succès |
| VPS integration release | [32643543726](https://github.com/nclsppr/monflorian/actions/runs/32643543726) | succès |

## Admission Atlas

La PR [vps-infra 96](https://github.com/nclsppr/vps-infra/pull/96) a ajouté un profil désactivé, sans base ni migrateur. Les contrôles de branche et les trois workflows de `main` sont verts.

| Élément | Preuve |
| --- | --- |
| Révision fusionnée | `891a898074314104e5bfacf78e46cdf512b7e5c5` |
| Validate | [32644204671](https://github.com/nclsppr/vps-infra/actions/runs/32644204671) |
| Platform integration artifact | [32644204694](https://github.com/nclsppr/vps-infra/actions/runs/32644204694) |
| Caddy platform image | [32644204794](https://github.com/nclsppr/vps-infra/actions/runs/32644204794) |
| Convergence réelle | `ok=379`, `changed=13`, `failed=0` |
| Contrôle prédictif | `ok=221`, `changed=0`, `failed=0` |

L'inspection distante confirme la révision installée, le réseau vide `172.30.40.0/24`, les répertoires root et l'absence du secret, du conteneur et du lien d'activation. Caddy, PostgreSQL et les services de supervision déjà présents restent sains.

## Changement DNS

| Contrôle | Résultat |
| --- | --- |
| A autoritaire, apex | `137.74.174.163` |
| A autoritaire, `www` | `137.74.174.163` |
| Cloudflare `1.1.1.1` | les deux noms sur `137.74.174.163` |
| Google `8.8.8.8` | les deux noms sur `137.74.174.163` |
| AAAA | aucun |
| MX | `mx1.mail.ovh.net`, `mx2.mail.ovh.net`, `mx3.mail.ovh.net` préservés |
| TXT | présents, hors du changement |

Une requête avec résolution forcée vers Atlas renvoie `404` en HTTP. TLS renvoie une erreur interne avant émission du certificat. C'est le résultat attendu d'une route encore désactivée, pas une preuve de mise en ligne.

## Gates

| Gate | État | Ce qui manque |
| --- | --- | --- |
| Publication Git et CI | validée | rien pour le candidat `a7c5d1c` |
| Artefacts et provenance | validée | rien pour le candidat `a7c5d1c` |
| Admission Atlas dormante | validée | rien pour la préparation |
| Secret OpenAI | bloquée | nouvelle clé créée hors conversation |
| Smoke test Responses | bloqué | clé sûre et budget borné |
| Smoke test Images | bloqué | clé sûre et fixture synthétique |
| Accès privé | bloqué | identifiant privé et vérification de tous les chemins coûteux |
| Activation Atlas | bloquée | PR d'activation, secret, route, profil et sondes |
| TLS public | bloqué | route active et application saine |
| Booking affilié | bloqué | partenariat et lien approuvé |

## Secrets

La clé OpenAI partagée dans la conversation n'est pas une entrée de production. Elle doit être révoquée. Aucun secret n'a été inscrit dans le dépôt, les sorties de CI ou Atlas. Le contrat de production attend un fichier root lisible par le groupe applicatif, mode `0440`, sous `/etc/vps/secrets/monflorian/`.

## Rollback

| Cible | Procédure |
| --- | --- |
| DNS | Remettre seulement apex et `www` sur `213.186.33.5` |
| Admission dormante | Revenir sur la PR Atlas sans toucher aux autres applications |
| Activation future | Retirer la route, désactiver le profil et revenir au digest précédent |
| Booking.com | Garder ou remettre le mode `external` |
| Données utilisateur | Aucun volume applicatif à restaurer, car l'application ne persiste rien |

## Conclusion

Le candidat est publié et l'hôte est prêt à le recevoir. Le domaine pointe déjà vers Atlas, un peu en avance sur l'application. Le service reste volontairement fermé tant qu'une nouvelle clé OpenAI, un accès privé et les deux smoke tests réels ne sont pas disponibles.
