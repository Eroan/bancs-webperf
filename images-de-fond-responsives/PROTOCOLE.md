# Protocole : image de fond responsive, `image-set()`, media queries et préchargement

Écrit le 2026-11-06, avant la première mesure. Point de départ : la page MDN de `image-set()`, la section 2.4 de CSS Images 4
(Editor's Draft) et le code de sélection de Chromium, Firefox et WebKit. Le banc répond à ce qu'un intégrateur doit savoir pour
poser une image de fond responsive, pas à une question de durée.

## Questions

1. Quelle image chaque moteur télécharge-t-il selon le DPR, pour `image-set()`, `<img srcset>` et `<link rel=preload imagesrcset>` ?
   Le code annonce la même règle partout (première densité supérieure ou égale au DPR, sinon la plus grande) ; Chromium l'a alignée
   pour `srcset` en version 133 (drapeau `SrcsetSelectionMatchesImageSet`).
2. Un préchargement et un fond CSS téléchargent-ils une ou deux images selon la forme du préchargement ? Forme testée en premier :
   celle que le wiki donne aujourd'hui pour un fond (`imagesrcset` en `w` + `imagesizes`), face à un CSS en media queries.
3. Combinaisons de `type()` et de densité : ordre des options, doublons, format perdu à une densité, tous les types inconnus, unités,
   chaînes nues, dégradé, préfixe `-webkit-`.
4. La densité déclarée change-t-elle la taille affichée avec `background-size: auto` ?
5. Media queries, requêtes de conteneur, éléments hors écran ou masqués : quelles images partent, et au redimensionnement ?
6. Le choix change-t-il avec le DPR en cours de page ? Avec une connexion lente (Chrome seul) ?
7. Passer les URL par des propriétés personnalisées (`style="--fond-1x: url(...)"`, cas d'un CMS) : `image-set()` les accepte-t-il,
   contre quoi une URL relative se résout-elle, et le repli par double déclaration tient-il encore avec `var()` ?
8. L'élément LCP et les outils : `largest-contentful-paint`, valeur calculée, Resource Timing disent-ils quelle image a été retenue ?

Ajouts après un passage de contrôle du même jour, non publié, avant la série : requêtes de conteneur sans déclaration de base (Firefox avait
téléchargé deux images), recalcul de style après un changement de DPR (aucune requête sans lui), blocs publiés rejoués tels quels.

## Banc

Serveur Node intégré (`banc.mjs`), port libre lu à l'exécution, marqueur `/__banc` relu avant la mesure, HTTP/1.1. Trois moteurs :
Chrome stable installé (Playwright, `channel: 'chrome'`), Firefox stable installé (puppeteer-core, WebDriver BiDi), WebKit de
Playwright. WebKit de Playwright n'est pas Safari publié : son résultat se lit avec les données de compatibilité et le code. Un
contexte neuf par cas, identifiant de cas dans chaque URL (rien ne survit d'un cas à l'autre). Trois passages, ordre des moteurs
tourné ; une valeur qui varie d'un passage à l'autre s'imprime en plage ou en liste dans `RESULTATS.md`.

Images en `max-age=3600` : un préchargement doit pouvoir servir la requête CSS, et un retour de redimensionnement doit pouvoir se
servir du cache. Délai serveur de 120 ms par image, pour que préchargement et fond CSS se croisent comme sur un vrai site. Le compte
vient du **journal du serveur**, pas du panneau réseau.

DPR : `deviceScaleFactor` du contexte Playwright, `page.setViewport` sous Firefox. Le DPR réellement atteint est relu dans la page
(`window.devicePixelRatio`) à chaque cas ; un écart fait échouer le banc. Valeurs : 1, 1,25, 1,5, 2, 2,625, 3.

Aucune durée n'est mesurée : la charge du processeur est relevée dans `machine.txt` mais ne bloque pas le départ, à la différence
des bancs chronométrés du dépôt.

## Groupes et témoins

| Groupe | Mesure | Témoin (le banc échoue sinon) |
|---|---|---|
| `selection` | Image demandée par `image-set()`, `srcset` et préchargement, 6 DPR, jeux `1x 2x`, `1x 1.5x 2x` et `1x 2x 3x` | une seule requête par cas ; DPR 1 donne `1x`, DPR 2 donne `2x` |
| `doublon` | Requêtes pour 7 formes de préchargement face au CSS correspondant : 400 × 800 px en DPR 1, 2 et 3, 412 × 915 px en DPR 2,625, 1 400 × 900 px en DPR 1, 1,25 et 2 | forme sans préchargement : une requête |
| `combinaisons` | Requêtes pour 14 écritures de `image-set()`, DPR 1 et 2 | type inconnu jamais demandé, option suivante retenue |
| `taille` | Largeur affichée (pixels de la capture, rapportés au facteur d'échelle de la capture) d'un PNG de 1 000 × 500 px en `background-size: auto` | `url()` seul : 1 000 px à tout DPR |
| `media` | Requêtes à 400 px, après passage à 1 400 px, après retour à 400 px ; élément hors écran, `display: none`, `visibility: hidden`, `content-visibility: auto` | `display: none` : aucune requête |
| `changement` | DPR de 1 à 2 puis retour, en cours de page (Chrome par CDP, Firefox par `setViewport`) | DPR relu après chaque changement |
| `reseau` | Chrome, DPR 3, `Network.emulateNetworkConditions` (latence 2 500 ms) : image demandée | `navigator.connection.effectiveType` à `slow-2g` |
| `variables` | `image-set(var(--a) ...)`, ensemble entier dans une variable, résolution des URL relatives, repli | repli sans `var()` : image de repli demandée |
| `lcp` | Entrées `largest-contentful-paint`, valeur calculée, extrait de console `extraits/console-fonds.js` tel que publié | image retenue présente dans Resource Timing |
| `publie` | Blocs publiés dans l'article (`extraits/bloc-recommande.*`, `extraits/bloc-variables.*`), lus et servis tels quels, 7 tailles et DPR | une seule requête, en AVIF |
| `syntaxe` | `CSS.supports` de chaque écriture | `image-set(url("a.jpg") 1x)` pris en charge |

## Limites connues

Le banc dit quelle image part, pas à quelle vitesse : il ne mesure ni le gain de LCP d'un préchargement ni le coût d'un doublon.
Un DPR émulé ne remplace pas un écran réel : il pilote le même calcul, relu dans la page. Le zoom du navigateur n'est pas testé. La
connexion lente n'est testée que sous Chrome ; Firefox et WebKit se lisent dans le code (seul le DPR entre dans le choix). `Save-Data`
n'est pas testé. Chrome 132 et antérieurs (`srcset` à moyenne géométrique) ne sont pas lancés : ils se lisent dans le code.
