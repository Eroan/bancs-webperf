# Protocole : minification du HTML, gain après compression de transfert et conservation du contenu

Écrit le 2026-11-19, avant la série. Point de départ : le Minifier Benchmarks Project (Jens Oliver Meiert, dépôt
`j9t/minifier-benchmarks`, relevé du 2026-11-11), qui compare des minificateurs HTML sur 124 pages réelles et publie
le gain en octets **non compressés** seulement : son script calcule aussi gzip, LZMA et Brotli, mais ne les publie ni
dans le README ni dans les données du site. L'auteur tient le projet et maintient aussi HTML Minifier, le plus
souvent premier du classement.

## Questions

1. Sur les pages du projet, récupérées le jour du banc, quel gain en octets bruts donne chaque minificateur, en mode
   « HTML seul » et en mode « maximal » (CSS, JavaScript, JSON et SVG en ligne compris) ? (Contrôle : ordre de grandeur
   du relevé publié du 2026-11-11.)
2. Que reste-t-il de ce gain après la compression de transfert : gzip niveau 6, Brotli qualité 5 (niveau courant d'une
   compression à la volée) et Brotli qualité 11 (compression statique) ?
3. Combien d'octets transférés une page gagne-t-elle, en valeur absolue, après Brotli ?
4. La minification conserve-t-elle le texte visible et les éléments porteurs (liens, images, scripts, feuilles, icônes
   vides) ?

## Corpus

Les 128 adresses de `sites.json` (copie du projet au commit `a4d68fa`), récupérées une fois par `recuperer.mjs` le jour du
banc avec l'agent utilisateur du projet (`minifier-benchmarks/0.0`) et `Accept-Encoding: gzip, br`, réponse décompressée
et gardée telle quelle. Une page entre au corpus si elle répond 200 en `text/html` avec plus de 1 024 octets. Les pages
ne sont pas commitées (contenu de tiers) : `brut/corpus.tsv` garde pour chacune le code HTTP, le type, la taille et
l'empreinte SHA-256 du relevé, si bien que les chiffres se rejouent sur le même relevé, pas sur les pages du jour.

## Chaîne mesurée

Minificateurs et réglages du projet, copiés sans changement (`minifieurs.mjs`, `html-minifier.config.json`), aux versions
de son `package-lock.json` du 2026-11-11 : @swc/html 1.16.22, HTML Minifier 5.2.0, htmlnano 3.6.1, minify-html 0.18.1,
minify (tdewolff, mode maximal seulement, comme le projet) 2.24.8 et Minimize 2.2.0. htmlcompressor.com (service distant)
n'est pas mesuré. Chaque couple (minificateur, mode) tourne dans son propre processus Node, page par page ; un échec
(exception, sortie vide) compte la page comme non minifiée, règle du projet.

Pour chaque page et chaque sortie : taille UTF-8 brute, gzip (zlib de Node, niveau 6), Brotli (zlib de Node, mode texte,
qualités 5 et 11). Aucune durée n'est mesurée : le temps de minification publié par le projet se cite depuis le projet.

## Conservation du contenu

Chaque page et chaque sortie passent par htmlparser2 (version épinglée) : texte hors `script`, `style`, `template` et
`noscript`, entités décodées, tous les blancs retirés, comparé par empreinte ; nombre de balises ouvrantes `a`, `img`,
`source`, `picture`, `script` à attribut `src`, `link`, `meta`, `iframe`, `video`, `svg`, `use`, `input`, `button`, `form`, et d'éléments `i` ou `span` vides
(icônes posées par une classe). Un écart n'est pas forcément un défaut (balises facultatives, doublons fusionnés) : la
synthèse compte les pages touchées par minificateur et mode, et les écarts se relisent sur un échantillon.

## Changements après la première série (2026-11-19)

La première série (mêmes pages, mêmes minificateurs) a montré deux mesures de conservation mal posées, corrigées avant
la série retenue, qui rejoue tout :

- le texte comparé avec les blancs réduits à une espace signalait 81 à 99 pages chez tous les minificateurs, Minimize
  compris : un blanc retiré entre deux blocs (`</p>\n<p>`) change ce texte sans rien changer à l'affichage. Le texte se
  compare désormais sans aucun blanc, par empreinte : seule une perte ou un ajout de caractère compte ;
- le nombre de `script` baissait par fusion des scripts en ligne consécutifs (`mergeScripts`), sans perte : seuls les
  scripts à `src` se comptent.

Elle a aussi montré que HTML Minifier et htmlnano retirent, dès le mode HTML seul, des `i`, `span` et `a` vides porteurs
de rendu (icônes par classe, logo et bouton de menu dessinés en CSS). Deux variantes de HTML Minifier, hors réglages du
projet, isolent la part de deux options : `minifier-sans-vides` (`removeEmptyElements: false`, modes HTML seul et
maximal) et `minifier-sans-css-inutilise` (`removeUnusedCSS: false`, mode maximal).

## Contrôles de la série

- **Témoin d'identité** : la ligne « aucune » (page d'origine) passe par la même chaîne ; son gain vaut 0 partout.
- **Témoin positif** : la page de test du projet (`Minifier Test`) perd plus de 10 % en brut chez HTML Minifier, mode
  HTML seul (relevé publié : 19,9 %).
- **Aller-retour de compression** : chaque flux gzip et Brotli se décompresse et redonne l'entrée à l'octet près.
- **Complétude** : pages du corpus × (6 couples en mode HTML seul + 8 en mode maximal) sorties attendues ; le banc
  imprime le compte et les échecs par couple.
- **Contrôle de l'instrument de conservation** : l'original comparé à lui-même donne zéro écart ; une copie dont un lien
  et une icône vide sont retirés donne un écart de 1 sur chacun.
