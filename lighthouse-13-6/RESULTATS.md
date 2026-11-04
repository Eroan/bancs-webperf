# Résultats : Lighthouse 13.5.0 contre 13.6.0

Série `serie-2026-11-04T16-34` : Chrome 156.0.0.0, mobile simulé, 10 relevés par page. Protocole : `PROTOCOLE.md`.

ProductName:		macOS ; ProductVersion:		26.5.1 ; BuildVersion:		25F80 ; Apple M4 Max ; Google Chrome 156.0.8078.80  ; v25.9.0 ; départ 2026-11-04 16:35:00 ; processeur inactif : 87.5 % ; fin 2026-11-04 17:10:36 ; processeur inactif : 85.4 % 

## Même relevé, 13.5.0 et 13.6.0

| Page | Élément LCP | Protocoles | FCP observé | Score 13.5.0 | Score 13.6.0 | FCP 13.5.0 | FCP 13.6.0 | LCP 13.5.0 | LCP 13.6.0 | SI 13.5.0 | SI 13.6.0 | TBT 13.5.0 | TBT 13.6.0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| texte-preload | text | http/1.1 40 | 32 [20, 40] | 91 [91, 91] | 100 [100, 100] | 2251 [2250, 2251] | 610 [607, 612] | 3151 [3150, 3151] | 610 [607, 612] | 2251 [2250, 2251] | 610 [607, 612] | 0 [0, 0] | 0 [0, 0] |
| module-tete | text | http/1.1 30 | 30 [21, 35] | 95 [95, 95] | 96 [96, 100] | 2250 [2250, 2251] | 2256 [607, 2259] | 2400 [2400, 2401] | 2256 [607, 2259] | 2250 [2250, 2251] | 2256 [607, 2259] | 0 [0, 0] | 0 [0, 0] |
| css-bloquante | text | http/1.1 30 | 28 [22, 33] | 95 [95, 95] | 96 [96, 96] | 2250 [2250, 2251] | 2250 [2250, 2251] | 2400 [2400, 2401] | 2250 [2250, 2251] | 2250 [2250, 2251] | 2250 [2250, 2251] | 0 [0, 0] | 0 [0, 0] |
| image-locale | image | http/1.1 30 | 33 [10, 40] | 77 [77, 77] | 77 [77, 77] | 602 [601, 603] | 602 [601, 603] | 6750 [6750, 6751] | 6750 [6750, 6751] | 602 [601, 603] | 602 [601, 603] | 0 [0, 0] | 0 [0, 0] |
| module-flux | text | http/1.1 30 | 31 [25, 40] | 96 [96, 96] | 100 [100, 100] | 2251 [2250, 2251] | 607 [607, 608] | 2251 [2250, 2251] | 607 [607, 608] | 2251 [2250, 2251] | 607 [607, 608] | 0 [0, 0] | 0 [0, 0] |
| awp-accueil | image | h3 360 | 262 [230, 287] | 98 [97, 98] | 100 [100, 100] | 1264 [961, 1541] | 955 [933, 1083] | 2377 [2300, 2444] | 1594 [1450, 1608] | 1405 [961, 1541] | 1025 [949, 1107] | 0 [0, 30] | 0 [0, 30] |
| awp-article | image | h3 190 | 225 [211, 243] | 99 [98, 99] | 100 [100, 100] | 980 [952, 1402] | 978 [952, 1079] | 2166 [2124, 2387] | 1543 [1523, 1681] | 1015 [965, 1402] | 978 [952, 1079] | 0 [0, 0] | 0 [0, 0] |
| horizon | image | h3 2645, h2 825 | 222 [202, 1301] | 80 [64, 91] | 83 [70, 94] | 2003 [1859, 4002] | 1148 [1134, 2246] | 5726 [3178, 11427] | 5275 [2875, 11127] | 2855 [2292, 5040] | 2569 [2039, 4613] | 32 [1, 142] | 32 [1, 142] |

## Écart relevé par relevé (13.6.0 moins 13.5.0)

| Page | Score | FCP | LCP | Relevés où le score monte | Relevés où il baisse |
|---|---|---|---|---|---|
| texte-preload | 9 [9, 9] | -1641 [-1643, -1640] | -2541 [-2543, -2540] | 10/10 | 0/10 |
| module-tete | 1 [1, 5] | 6 [-1643, 8] | -144 [-1793, -142] | 10/10 | 0/10 |
| css-bloquante | 1 [1, 1] | 0 [0, 0] | -150 [-150, -150] | 10/10 | 0/10 |
| image-locale | 0 [0, 0] | 0 [0, 0] | 0 [0, 0] | 0/10 | 0/10 |
| module-flux | 4 [4, 4] | -1643 [-1643, -1642] | -1643 [-1643, -1642] | 10/10 | 0/10 |
| awp-accueil | 2 [2, 3] | -306 [-473, 0] | -798 [-863, -747] | 10/10 | 0/10 |
| awp-article | 1 [1, 2] | 0 [-323, 0] | -629 [-706, -572] | 10/10 | 0/10 |
| horizon | 3 [1, 6] | -865 [-1756, -724] | -300 [-600, -150] | 10/10 | 0/10 |

## Écart attribué : un seul groupe rétabli en 0.0.65 dans la 13.6.0 (3 premiers relevés)

| Page | Métrique | 135 | 136 | 136-reseau65 | 136-rendu65 | 136-lcptexte65 | 136-graphe65 | 136-tout65 | 135-h3-en-h2 |
|---|---|---|---|---|---|---|---|---|---|
| texte-preload | FCP | 2251 | 611 | 611 | 2251 | 611 | 611 | 2251 | — |
| texte-preload | LCP | 3151 | 611 | 611 | 2251 | 3151 | 611 | 3151 | — |
| module-tete | FCP | 2251 | 2257 | 2257 | 2257 | 2257 | 609 | 2251 | — |
| module-tete | LCP | 2401 | 2257 | 2257 | 2257 | 2407 | 609 | 2401 | — |
| css-bloquante | FCP | 2250 | 2250 | 2250 | 2250 | 2250 | 2250 | 2250 | — |
| css-bloquante | LCP | 2400 | 2250 | 2250 | 2250 | 2400 | 2250 | 2400 | — |
| image-locale | FCP | 602 | 602 | 602 | 602 | 602 | 602 | 602 | — |
| image-locale | LCP | 6750 | 6750 | 6750 | 6750 | 6750 | 6750 | 6750 | — |
| module-flux | FCP | 2251 | 608 | 608 | 2251 | 608 | 608 | 2251 | — |
| module-flux | LCP | 2251 | 608 | 608 | 2251 | 2251 | 608 | 2251 | — |
| awp-accueil | FCP | 1406 | 961 | 1406 | 974 | 961 | 961 | 1406 | 974 |
| awp-accueil | LCP | 2313 | 1528 | 2313 | 1528 | 1528 | 1528 | 2313 | 1608 |
| awp-article | FCP | 965 | 965 | 965 | 965 | 965 | 965 | 965 | 965 |
| awp-article | LCP | 2158 | 1549 | 2158 | 1549 | 1549 | 1549 | 2158 | 1624 |
| horizon | FCP | 2003 | 1148 | 1148 | 1853 | 1148 | 1148 | 2003 | 2003 |
| horizon | LCP | 3323 | 3028 | 3323 | 3028 | 3028 | 3028 | 3323 | 3323 |

## Témoins

- Déterminisme : 8/8 doubles audits `136` identiques.
- Instrument : FCP et LCP observés identiques entre variantes d'un même relevé : 374/374.
- Attribution : `136-tout65` égale `135` à moins de 1 ms près (FCP, LCP, SI) : 80/80 relevés.

Bridage réel (`--throttling-method=devtools`, 5 relevés) : Lantern n'intervient pas.

| Page | FCP 13.5.0 | FCP 13.6.0 | LCP 13.5.0 | LCP 13.6.0 |
|---|---|---|---|---|
| texte-preload | 601 [597, 602] | 601 [597, 602] | 601 [597, 602] | 601 [597, 602] |
| module-tete | 605 [599, 620] | 605 [599, 620] | 605 [599, 620] | 605 [599, 620] |
| module-flux | 613 [599, 629] | 613 [599, 629] | 613 [599, 629] | 613 [599, 629] |

Collecte : audit par la 13.5.0, relevé collecté par la 13.5.0 ou la 13.6.0 (5 premiers relevés).

| Page | FCP, collecte 13.5.0 | FCP, collecte 13.6.0 | LCP, collecte 13.5.0 | LCP, collecte 13.6.0 |
|---|---|---|---|---|
| texte-preload | 2250 [2250, 2251] | 2251 [2250, 2251] | 3150 [3150, 3151] | 3151 [3150, 3151] |
| module-tete | 2250 [2250, 2250] | 2251 [2250, 2251] | 2400 [2250, 2400] | 2401 [2400, 2401] |
| css-bloquante | 2250 [2250, 2250] | 2250 [2250, 2250] | 2400 [2400, 2400] | 2400 [2400, 2400] |
| image-locale | 602 [601, 602] | 602 [601, 603] | 6750 [6750, 6750] | 6750 [6750, 6751] |
| module-flux | 2251 [2251, 2251] | 2251 [2251, 2251] | 2251 [2251, 2251] | 2251 [2251, 2251] |
| awp-article | 1100 [964, 1377] | 970 [952, 1402] | 2317 [2271, 2378] | 2173 [2135, 2387] |

## Audits selon la réponse du serveur

| Cas | 13.5.0 | 13.6.0 | Message 13.6.0 |
|---|---|---|---|
| llms 200 | score 1 | score 1 |  |
| llms 404 | non applicable | non applicable |  |
| llms 429 | non applicable | score 0 |  |
| llms 500 | score 0 | score 0 |  |
| robots 200 | score 1 | score 1 |  |
| robots 404 | non applicable | non applicable |  |
| robots 429 | non applicable | score 0 |  |
| robots 500 | score 0 | score 0 |  |
| ard aucun signal | non applicable | non applicable |  |
| ard .well-known/ard.json | non applicable | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry. |
| ard .well-known/ard.json avec representativeQueries | non applicable | score 1 |  |
| ard .well-known/ai-catalog.json | score 0 | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry.; Manifest was only foun |
| ard link rel=ard | non applicable | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry. |
| ard link rel=ai-catalog | score 0 | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry.; Manifest was only foun |
| ard en-tête Link rel=ard | non applicable | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry. |
| ard Agentmap dans robots.txt | score 0 | score 0.9 | No 'representativeQueries'. The semantic index is built from this term, so the entry will not be found by search — it is a valid catalog entry but not a discoverable ARD entry. |
| ard link rel=ard en 404 | non applicable | score 0 | Advertised ARD manifest location could not be loaded (HTTP status 404). |

## Ligne de commande en lot (13.6.0)

- --url-file, deux URL, commentaire et ligne vide : code de sortie 0 ; fichiers : `127.0.0.1-image-locale_<date>.report.json`, `127.0.0.1-texte-preload_<date>.report.json`
- URL en échec au milieu, sans --fail-fast : code de sortie 1 ; fichiers : `127.0.0.1-image-locale_<date>.report.json`, `127.0.0.1-texte-preload_<date>.report.json`, `chromewebdata_<date>.report.json`
- URL en échec au milieu, avec --fail-fast : code de sortie 1 ; fichiers : `127.0.0.1-texte-preload_<date>.report.json`, `chromewebdata_<date>.report.json`
- deux URL en arguments : code de sortie 0 ; fichiers : `127.0.0.1-image-locale_<date>.report.json`, `127.0.0.1-texte-preload_<date>.report.json`
- --output-path qui n'est pas un dossier existant : code de sortie 1 ; message : --output-path must be an existing directory when auditing multiple URLs
- -G sur plusieurs URL : code de sortie 1 ; message : Cannot use -G/--gather-mode or -A/--audit-mode when auditing multiple URLs
- une URL, --output-path vers un fichier (forme du script du wiki) : code de sortie 0 ; fichiers : `seul.json`
