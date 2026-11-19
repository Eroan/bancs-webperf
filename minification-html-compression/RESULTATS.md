# Résultats : minification du HTML et compression de transfert

Corpus : 127 pages (relevé 2026-11-19T07:17:37.411Z, agent minifier-benchmarks/0.0, Node v26.13.0). Compression : zlib de Node (gzip niveau 6, Brotli mode texte qualités 5 et 11). Un échec compte la page non minifiée.

## Témoins

- Témoin positif : page « Minifier Test », HTML Minifier, mode HTML seul : 19.9 % en brut (attendu > 10 % ; relevé publié 19,9 %) : OK.
- Témoin d'identité : ligne « aucune » = page d'origine : OK.

## Gain de taille, total du corpus

Somme des octets de toutes les pages, avant et après minification.

| Mode | Minificateur | Pages minifiées | Brut | gzip 6 | Brotli 5 | Brotli 11 |
|---|---|---|---|---|---|---|
| | aucune (total du corpus) | 127 | 41 452 Kio | 6 538 Kio | 5 232 Kio | 4 519 Kio |
| HTML seul | @swc/html 1.16.22 | 127/127 | −8.2 % | −3.3 % | −2.8 % | −2.3 % |
| HTML seul | HTML Minifier 5.2.0 | 127/127 | −10.6 % | −4.9 % | −4.3 % | −3.9 % |
| HTML seul | htmlnano 3.6.1 | 127/127 | −9.2 % | −3.9 % | −3.3 % | −3.2 % |
| HTML seul | minify-html 0.18.1 | 127/127 | −7.8 % | −3.0 % | −2.6 % | −2.3 % |
| HTML seul | Minimize 2.2.0 | 127/127 | −6.9 % | −2.9 % | −2.5 % | −2.1 % |
| HTML seul | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 127/127 | −8.8 % | −3.6 % | −3.0 % | −2.6 % |
| maximal | @swc/html 1.16.22 | 127/127 | −11.0 % | −5.4 % | −4.8 % | −4.3 % |
| maximal | HTML Minifier 5.2.0 | 127/127 | −21.6 % | −14.4 % | −14.1 % | −13.5 % |
| maximal | htmlnano 3.6.1 | 127/127 | −21.1 % | −13.9 % | −13.7 % | −13.4 % |
| maximal | minify-html 0.18.1 | 127/127 | −10.5 % | −4.6 % | −4.2 % | −3.7 % |
| maximal | minify (tdewolff) 2.24.8 | 123/127 | −10.4 % | −5.1 % | −4.6 % | −4.0 % |
| maximal | Minimize 2.2.0 | 127/127 | −6.9 % | −2.9 % | −2.5 % | −2.1 % |
| maximal | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 127/127 | −19.8 % | −13.0 % | −12.8 % | −12.2 % |
| maximal | HTML Minifier 5.2.0 sans `removeUnusedCSS` (variante du banc) | 127/127 | −16.2 % | −9.4 % | −8.6 % | −8.0 % |

## Gain par page, médiane [P10, P90]

| Mode | Minificateur | Brut (%) | Brotli 5 (%) | Brotli 11 (%) | Brotli 5, octets gagnés (Kio) | Brotli 11, octets gagnés (Kio) |
|---|---|---|---|---|---|---|
| HTML seul | @swc/html 1.16.22 | 7.8 [1.5, 28.7] | 3.2 [0.3, 9.7] | 2.9 [0.1, 8.5] | 0.8 [0.1, 2.1] | 0.6 [0.0, 1.6] |
| HTML seul | HTML Minifier 5.2.0 | 9.6 [2.5, 30.8] | 4.1 [1.1, 12.7] | 3.8 [0.7, 11.2] | 1.2 [0.4, 2.7] | 0.8 [0.2, 2.1] |
| HTML seul | htmlnano 3.6.1 | 8.8 [1.8, 29.3] | 3.6 [0.6, 10.8] | 3.3 [0.4, 9.5] | 0.9 [0.2, 2.5] | 0.7 [0.2, 1.8] |
| HTML seul | minify-html 0.18.1 | 7.2 [1.3, 28.3] | 3.2 [0.4, 9.7] | 2.7 [0.2, 8.3] | 0.8 [0.1, 2.1] | 0.6 [0.1, 1.6] |
| HTML seul | Minimize 2.2.0 | 5.9 [0.7, 27.4] | 2.5 [0.2, 9.2] | 2.3 [-0.0, 7.7] | 0.6 [0.1, 1.9] | 0.5 [-0.0, 1.4] |
| HTML seul | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 8.0 [1.7, 29.1] | 3.3 [0.6, 10.2] | 2.9 [0.4, 8.9] | 0.8 [0.2, 2.2] | 0.7 [0.1, 1.7] |
| maximal | @swc/html 1.16.22 | 11.5 [4.2, 30.5] | 6.3 [1.2, 13.2] | 5.6 [0.7, 12.1] | 1.4 [0.3, 4.7] | 1.0 [0.2, 3.6] |
| maximal | HTML Minifier 5.2.0 | 25.4 [8.9, 48.2] | 13.6 [4.2, 34.7] | 13.1 [3.9, 32.6] | 3.7 [0.8, 13.3] | 3.1 [0.6, 10.2] |
| maximal | htmlnano 3.6.1 | 24.8 [8.8, 47.7] | 13.9 [3.7, 32.0] | 13.0 [3.3, 30.6] | 3.7 [0.7, 12.0] | 3.0 [0.5, 10.0] |
| maximal | minify-html 0.18.1 | 10.7 [4.0, 29.1] | 5.3 [0.9, 11.6] | 4.7 [0.6, 10.4] | 1.4 [0.4, 4.0] | 0.9 [0.2, 3.0] |
| maximal | minify (tdewolff) 2.24.8 | 10.3 [3.2, 30.0] | 5.4 [0.4, 13.5] | 4.8 [0.1, 11.8] | 1.3 [0.2, 4.7] | 1.0 [0.0, 3.9] |
| maximal | Minimize 2.2.0 | 5.9 [0.7, 27.4] | 2.5 [0.2, 9.2] | 2.3 [-0.0, 7.7] | 0.6 [0.1, 1.9] | 0.5 [-0.0, 1.4] |
| maximal | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 23.9 [8.0, 45.8] | 13.2 [3.3, 30.5] | 12.2 [2.9, 29.1] | 3.5 [0.8, 11.7] | 2.8 [0.5, 8.9] |
| maximal | HTML Minifier 5.2.0 sans `removeUnusedCSS` (variante du banc) | 19.0 [7.7, 38.6] | 10.0 [2.8, 19.8] | 8.8 [2.4, 18.2] | 2.2 [0.7, 7.0] | 1.8 [0.6, 5.6] |

Page d'origine après Brotli 5 : médiane 28.1 Kio [P10 8.2, P90 69.4].

## Conservation du contenu

Pages où la sortie diffère de l'origine (sorties réussies seulement). Texte : texte visible (hors `script`, `style`, `template`, `noscript`), entités décodées, sans aucun blanc, différent de celui de l'origine.

| Mode | Minificateur | Texte | Moins de `a` | Moins de `img` | Moins de `script` à `src` | Moins de `link` | Moins de `use` | `i` vides retirés (pages, éléments) | `span` vides retirés (pages, éléments) |
|---|---|---|---|---|---|---|---|---|---|
| HTML seul | @swc/html 1.16.22 | 0 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 0, 0 |
| HTML seul | HTML Minifier 5.2.0 | 1 | 37 | 0 | 0 | 0 | 0 | 23, 471 | 80, 3221 |
| HTML seul | htmlnano 3.6.1 | 0 | 0 | 0 | 0 | 0 | 0 | 28, 547 | 83, 3342 |
| HTML seul | minify-html 0.18.1 | 3 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 2, 2 |
| HTML seul | Minimize 2.2.0 | 2 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 0, 0 |
| HTML seul | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 1 | 0 | 0 | 0 | 0 | 0 | 1, 1 | 0, 0 |
| maximal | @swc/html 1.16.22 | 0 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 0, 0 |
| maximal | HTML Minifier 5.2.0 | 2 | 37 | 0 | 0 | 0 | 1 | 23, 471 | 80, 3221 |
| maximal | htmlnano 3.6.1 | 1 | 0 | 0 | 0 | 0 | 0 | 28, 547 | 83, 3342 |
| maximal | minify-html 0.18.1 | 3 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 2, 2 |
| maximal | minify (tdewolff) 2.24.8 | 0 | 0 | 0 | 1 | 0 | 0 | 0, 0 | 1, 25 |
| maximal | Minimize 2.2.0 | 2 | 0 | 0 | 0 | 0 | 0 | 0, 0 | 0, 0 |
| maximal | HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc) | 2 | 0 | 0 | 0 | 0 | 1 | 1, 1 | 0, 0 |
| maximal | HTML Minifier 5.2.0 sans `removeUnusedCSS` (variante du banc) | 2 | 37 | 0 | 0 | 0 | 1 | 23, 471 | 80, 3221 |

Pages d'origine qui ont au moins un `i` vide : 29/127 ; au moins un `span` vide : 91/127.

## Échecs

4 échec(s) de minification, détail dans `brut/echecs.tsv`.
- max, minify (tdewolff) 2.24.8, 007-amnesty-international-australia.html : expected , or ) instead of : in arguments on line 183 and column 47
- max, minify (tdewolff) 2.24.8, 022-din.html : unterminated string literal in expression on line 9165 and column 66
- max, minify (tdewolff) 2.24.8, 114-the-spinoff.html : unterminated string literal in expression on line 5 and column 184809
- max, minify (tdewolff) 2.24.8, 121-vivaldi.html : unexpected = in expression on line 397 and column 688
