# Résultats : report des scripts à la première interaction

Dossier lu : `brut/serie-2026-10-20T19-51`.

Calibrage (indice de Lighthouse calculé dans la page) : ×1 → 4170 [4152, 4259], ×4 → 1042 [1037, 1044], ×6 → 682 [678, 688], ×7 → 580 [576, 581], ×8 → 502 [500, 507], ×9 → 450 [442, 451], ×10 → 398 [398, 401], ×12 → 329 [327, 330], ×16 → 239 [238, 240], ×20 → 192 [188, 194], ×22 → 172 [170, 173], ×24 → 157 [151, 158], ×26 → 144 [144, 145], ×28 → 132 [132, 132], ×30 → 120 [120, 123] ; Chrome 155.0.8059.85.

## CPU ×9, réseau slow4g

- `serie-cpu9-slow4g-2026-10-20T17-53-35.json` : Chrome 155.0.8059.85, Playwright 1.64.1, 2 passage(s), 2026-10-20T17:53:35.838Z
- `serie-cpu9-slow4g-2026-10-20T19-17-43.json` : Chrome 155.0.8059.85, Playwright 1.64.1, 10 passage(s), 2026-10-20T19:17:43.260Z
- Passages lus : 254 ; passages avec erreur JavaScript : 0/254
- Passages dont un geste a échoué côté banc (écartés) : 0/254
- Retard des gestes sur l'horaire prévu : 1 ms [-5, 3]
- Témoin (gestionnaire de 100 ms, A et B) : traitement 104 ms [103, 107], durée Event Timing 144 ms [144, 152] ; 8/8 (traitement entre 95 et 130 ms)

### Visiteur sans geste (20 s)

| Variante | FCP | LCP | Thème prêt (jQuery ready) | Blocage observé de FCP à 10 s | GA4 page_view | Meta PageView | Chat affiché |
|---|---|---|---|---|---|---|---|
| A classique | 1714 ms [1696, 1728] | 1736 ms [1712, 1748] | 2298 ms [2281, 2306] | 352 ms [340, 407] | 4294 ms [4282, 4318], 10/10 reçus | 4026 ms [4015, 4037], 10/10 reçus | 2868 ms [2859, 2874], 10/10 |
| B defer | 1304 ms [1288, 1308] | 1522 ms [1516, 1544] | 2759 ms [2753, 2781] | 324 ms [312, 375] | 4196 ms [4188, 4213], 10/10 reçus | 3932 ms [3929, 3936], 10/10 reçus | 2535 ms [2530, 2550], 10/10 |
| C report-tiers (AWP) | 1292 ms [1288, 1304] | 1524 ms [1520, 1540] | 2296 ms [2288, 2319] | 127 ms [121, 153] | 9931 ms [9917, 9969], 10/10 reçus | 11603 ms [11595, 11638], 10/10 reçus | 14416 ms [14403, 14455], 10/10 |
| E report hors mesure (AWP) | 1292 ms [1288, 1304] | 1526 ms [1520, 1540] | 2472 ms [2454, 2482] | 130 ms [123, 151] | 3464 ms [3443, 3472], 10/10 reçus | 11778 ms [11763, 11800], 10/10 reçus | 14593 ms [14574, 14612], 10/10 |
| D tout reporter (WP Rocket) | 1304 ms [1288, 1320] | 1540 ms [1532, 1552] | n/a | 0 ms [0, 0] | n/a, 0/10 reçus | n/a, 0/10 reçus | n/a, 0/10 |

Mesure d'audience reçue si le visiteur part à l'instant t (GA4 page_view arrivé avant t ; passages sans geste) :

| Variante | départ à 3 s | départ à 5 s | départ à 10 s | départ à 20 s |
|---|---|---|---|---|
| A classique | 0/10 | 10/10 | 10/10 | 10/10 |
| B defer | 0/10 | 10/10 | 10/10 | 10/10 |
| C report-tiers (AWP) | 0/10 | 0/10 | 10/10 | 10/10 |
| E report hors mesure (AWP) | 0/10 | 10/10 | 10/10 | 10/10 |
| D tout reporter (WP Rocket) | 0/10 | 0/10 | 0/10 | 0/10 |

### Tap sur la FAQ à 2 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 48] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 16 ms [14, 19] | 48 ms [40, 56] |
| B defer | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 16] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 15 ms [14, 17] | 48 ms [40, 64] |
| C report-tiers (AWP) | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 48] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 13 ms [11, 15] | 44 ms [40, 56] |
| E report hors mesure (AWP) | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 48] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 12 ms [10, 13] | 48 ms [40, 64] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 2410 ms [2402, 2434] | 16 ms [16, 16] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 926 ms [918, 951] | n/a |

### Tap sur la FAQ à 4 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 10/10 | 0/10 | 0/10 | 123 ms [93, 134] | 152 ms [120, 168] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 13 ms [11, 14] | 48 ms [40, 56] |
| B defer | FAQ | 10/10 | 0/10 | 0/10 | 20 ms [18, 60] | 56 ms [40, 112] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 12 ms [11, 16] | 48 ms [40, 56] |
| C report-tiers (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 17 ms [16, 18] | 48 ms [40, 64] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 12 ms [10, 17] | 48 ms [40, 72] |
| E report hors mesure (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 17 ms [16, 19] | 48 ms [40, 56] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 12 ms [10, 13] | 48 ms [40, 72] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 2408 ms [2399, 2439] | 16 ms [16, 16] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 924 ms [915, 956] | 16 ms [16, 16] |

### Tap sur la FAQ à 7 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 10/10 | 0/10 | 0/10 | 20 ms [19, 23] | 60 ms [48, 64] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 13 ms [11, 15] | 48 ms [40, 72] |
| B defer | FAQ | 10/10 | 0/10 | 0/10 | 22 ms [19, 24] | 56 ms [48, 64] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 12 ms [12, 14] | 48 ms [40, 72] |
| C report-tiers (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 18 ms [17, 21] | 56 ms [48, 64] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 12 ms [9, 13] | 48 ms [40, 56] |
| E report hors mesure (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 17 ms [15, 18] | 60 ms [48, 64] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 12 ms [9, 13] | 48 ms [40, 72] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 2418 ms [2402, 2434] | 16 ms [16, 24] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 933 ms [900, 966] | 16 ms [16, 16] |

### Défilement à 1,5 s, menu tapé à 2,5 s puis retapé à 4 s

Attendu : menu ouvert au premier tap, visible, refermé au second. Effet d'un tap = bascule du menu avant le tap suivant (un effet survenu après le second tap n'est pas compté au premier). « Vu ouvert » = resté ouvert au moins 16 ms (une image).

| Variante | Tap 1 (ouvrir) : immédiat / différé / perdu | Délai du tap 1 | Tap 2 (fermer) : immédiat / différé / perdu | Vu ouvert | Fermé à la fin | Clics rejoués (non fiables) |
|---|---|---|---|---|---|---|
| A classique | 10 / 0 / 0 sur 10 | 13 ms [11, 14] | 8 / 2 / 0 sur 10 | 10/10 | 10/10 | 0 [0, 0] |
| B defer | 0 / 0 / 10 sur 10 | n/a | 0 / 0 / 10 sur 10 | 10/10 | 0/10 | 0 [0, 0] |
| C report-tiers (AWP) | 10 / 0 / 0 sur 10 | 13 ms [12, 14] | 10 / 0 / 0 sur 10 | 10/10 | 10/10 | 0 [0, 0] |
| E report hors mesure (AWP) | 10 / 0 / 0 sur 10 | 13 ms [10, 16] | 10 / 0 / 0 sur 10 | 10/10 | 10/10 | 0 [0, 0] |
| D tout reporter (WP Rocket) | 0 / 0 / 10 sur 10 | n/a | 3 / 0 / 7 sur 10 | 0/10 | 10/10 | 1 [1, 1] |

## CPU ×22, réseau slow4g

- `serie-cpu22-slow4g-2026-10-20T19-19-08.json` : Chrome 155.0.8059.85, Playwright 1.64.1, 2 passage(s), 2026-10-20T19:19:08.917Z
- `serie-cpu22-slow4g-2026-10-20T20-43-33.json` : Chrome 155.0.8059.85, Playwright 1.64.1, 10 passage(s), 2026-10-20T20:43:33.942Z
- Passages lus : 254 ; passages avec erreur JavaScript : 0/254
- Passages dont un geste a échoué côté banc (écartés) : 0/254
- Retard des gestes sur l'horaire prévu : 1 ms [-2, 3]
- Témoin (gestionnaire de 100 ms, A et B) : traitement 110 ms [105, 113], durée Event Timing 160 ms [144, 168] ; 8/8 (traitement entre 95 et 130 ms)

### Visiteur sans geste (20 s)

| Variante | FCP | LCP | Thème prêt (jQuery ready) | Blocage observé de FCP à 10 s | GA4 page_view | Meta PageView | Chat affiché |
|---|---|---|---|---|---|---|---|
| A classique | 1906 ms [1884, 1964] | 1906 ms [1884, 1964] | 2546 ms [2521, 2639] | 1300 ms [1262, 1563] | 4914 ms [4870, 5073], 10/10 reçus | 4934 ms [4889, 5099], 10/10 reçus | 3272 ms [3233, 3383], 10/10 |
| B defer | 1414 ms [1396, 1436] | 1574 ms [1564, 1588] | 3220 ms [3191, 3276] | 1290 ms [1225, 1445] | 4728 ms [4707, 4822], 10/10 reçus | 4780 ms [4752, 4870], 10/10 reçus | 2867 ms [2844, 2898], 10/10 |
| C report-tiers (AWP) | 1404 ms [1396, 1444] | 1572 ms [1564, 1596] | 2548 ms [2525, 2600] | 476 ms [457, 586] | 10392 ms [10359, 10578], 10/10 reçus | 12036 ms [11994, 12262], 10/10 reçus | 14842 ms [14799, 14978], 10/10 |
| E report hors mesure (AWP) | 1412 ms [1392, 1440] | 1576 ms [1560, 1584] | 2713 ms [2691, 2806] | 623 ms [578, 812] | 3788 ms [3763, 3895], 10/10 reçus | 12168 ms [12149, 12212], 10/10 reçus | 15018 ms [14993, 15098], 10/10 |
| D tout reporter (WP Rocket) | 1392 ms [1380, 1416] | 1566 ms [1552, 1584] | n/a | 0 ms [0, 0] | n/a, 0/10 reçus | n/a, 0/10 reçus | n/a, 0/10 |

Mesure d'audience reçue si le visiteur part à l'instant t (GA4 page_view arrivé avant t ; passages sans geste) :

| Variante | départ à 3 s | départ à 5 s | départ à 10 s | départ à 20 s |
|---|---|---|---|---|
| A classique | 0/10 | 9/10 | 10/10 | 10/10 |
| B defer | 0/10 | 10/10 | 10/10 | 10/10 |
| C report-tiers (AWP) | 0/10 | 0/10 | 0/10 | 10/10 |
| E report hors mesure (AWP) | 0/10 | 10/10 | 10/10 | 10/10 |
| D tout reporter (WP Rocket) | 0/10 | 0/10 | 0/10 | 0/10 |

### Tap sur la FAQ à 2 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 0/10 | 0/10 | 10/10 | n/a | 36 ms [16, 64] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 32 ms [25, 38] | 72 ms [56, 88] |
| B defer | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 24] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 31 ms [26, 52] | 72 ms [64, 104] |
| C report-tiers (AWP) | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 48] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 22 ms [19, 34] | 56 ms [40, 80] |
| E report hors mesure (AWP) | FAQ | 0/10 | 0/10 | 10/10 | n/a | 16 ms [16, 48] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 32 ms [20, 121] | 76 ms [64, 168] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 3502 ms [3428, 3668] | 32 ms [24, 32] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 2036 ms [1962, 2215] | 16 ms [16, 16] |

### Tap sur la FAQ à 4 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 8/10 | 2/10 | 0/10 | 188 ms [159, 378] | 224 ms [200, 416] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 22 ms [17, 28] | 56 ms [48, 64] |
| B defer | FAQ | 1/10 | 9/10 | 0/10 | 218 ms [158, 306] | 260 ms [208, 360] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 22 ms [18, 26] | 56 ms [48, 64] |
| C report-tiers (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 36 ms [32, 43] | 72 ms [64, 88] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 29 ms [13, 39] | 72 ms [64, 88] |
| E report hors mesure (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 32 ms [27, 41] | 68 ms [56, 88] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 18 ms [14, 25] | 64 ms [56, 80] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 3514 ms [3429, 3886] | 32 ms [24, 48] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 2024 ms [1946, 2385] | 16 ms [16, 16] |

### Tap sur la FAQ à 7 s, puis sur le menu 1,5 s plus tard

Issue : immédiat = effet visible ≤ 200 ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. « Event Timing » = durée de l'interaction telle que l'INP la verrait.

| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |
|---|---|---|---|---|---|---|
| A classique | FAQ | 10/10 | 0/10 | 0/10 | 42 ms [37, 49] | 84 ms [72, 96] |
| A classique | menu | 10/10 | 0/10 | 0/10 | 22 ms [18, 29] | 64 ms [56, 72] |
| B defer | FAQ | 10/10 | 0/10 | 0/10 | 41 ms [35, 46] | 84 ms [72, 96] |
| B defer | menu | 10/10 | 0/10 | 0/10 | 23 ms [20, 33] | 64 ms [56, 72] |
| C report-tiers (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 34 ms [31, 61] | 76 ms [72, 128] |
| C report-tiers (AWP) | menu | 10/10 | 0/10 | 0/10 | 19 ms [15, 30] | 60 ms [48, 72] |
| E report hors mesure (AWP) | FAQ | 10/10 | 0/10 | 0/10 | 32 ms [29, 61] | 80 ms [72, 128] |
| E report hors mesure (AWP) | menu | 10/10 | 0/10 | 0/10 | 18 ms [14, 28] | 56 ms [48, 88] |
| D tout reporter (WP Rocket) | FAQ | 0/10 | 10/10 | 0/10 | 3502 ms [3444, 5117] | 32 ms [24, 48] |
| D tout reporter (WP Rocket) | menu | 0/10 | 10/10 | 0/10 | 2034 ms [1960, 3666] | 16 ms [16, 16] |

### Défilement à 1,5 s, menu tapé à 2,5 s puis retapé à 4 s

Attendu : menu ouvert au premier tap, visible, refermé au second. Effet d'un tap = bascule du menu avant le tap suivant (un effet survenu après le second tap n'est pas compté au premier). « Vu ouvert » = resté ouvert au moins 16 ms (une image).

| Variante | Tap 1 (ouvrir) : immédiat / différé / perdu | Délai du tap 1 | Tap 2 (fermer) : immédiat / différé / perdu | Vu ouvert | Fermé à la fin | Clics rejoués (non fiables) |
|---|---|---|---|---|---|---|
| A classique | 10 / 0 / 0 sur 10 | 28 ms [21, 145] | 0 / 10 / 0 sur 10 | 10/10 | 10/10 | 0 [0, 0] |
| B defer | 0 / 0 / 10 sur 10 | n/a | 0 / 0 / 10 sur 10 | 10/10 | 0/10 | 0 [0, 0] |
| C report-tiers (AWP) | 10 / 0 / 0 sur 10 | 35 ms [20, 54] | 10 / 0 / 0 sur 10 | 10/10 | 10/10 | 0 [0, 0] |
| E report hors mesure (AWP) | 8 / 1 / 1 sur 10 | 170 ms [141, 262] | 9 / 0 / 1 sur 10 | 10/10 | 9/10 | 0 [0, 0] |
| D tout reporter (WP Rocket) | 0 / 0 / 10 sur 10 | n/a | 0 / 10 / 0 sur 10 | 0/10 | 10/10 | 2 [2, 2] |

## Lighthouse 13.5.0, mobile, throttling simulé (aucun geste)

| Multiplicateur | Variante | Score | FCP | LCP | TBT | benchmarkIndex de l'hôte |
|---|---|---|---|---|---|---|
| ×9 | A classique | 98 [98, 98] | 1354 ms [1354, 1354] | 1954 ms [1879, 1954] | 122 ms [122, 124] | 4228 [4214, 4239] |
| ×9 | B defer | 98 [98, 98] | 904 ms [904, 904] | 1954 ms [1954, 1954] | 122 ms [119, 126] | 4254 [4214, 4268] |
| ×9 | C report-tiers (AWP) | 100 [100, 100] | 917 ms [917, 917] | 1876 ms [1876, 1876] | 0 ms [0, 0] | 4234 [4226, 4252] |
| ×9 | E report hors mesure (AWP) | 96 [92, 96] | 904 ms [901, 904] | 2734 ms [2733, 3421] | 33 ms [31, 61] | 4239 [4213, 4250] |
| ×9 | D tout reporter (WP Rocket) | 100 [100, 100] | 901 ms [901, 901] | 1501 ms [1501, 1501] | 0 ms [0, 0] | 4234 [4210, 4253] |
| ×22 | A classique | 85 [84, 85] | 1354 ms [1354, 1354] | 2048 ms [1879, 2052] | 568 ms [561, 573] | 4240 [4238, 4262] |
| ×22 | B defer | 84 [83, 85] | 904 ms [904, 1491] | 2068 ms [2065, 2157] | 576 ms [573, 597] | 4228 [4214, 4256] |
| ×22 | C report-tiers (AWP) | 100 [100, 100] | 940 ms [901, 940] | 1876 ms [1876, 1876] | 24 ms [20, 26] | 4235 [4206, 4266] |
| ×22 | E report hors mesure (AWP) | 92 [92, 92] | 903 ms [901, 904] | 2866 ms [2863, 2870] | 205 ms [199, 218] | 4230 [4228, 4250] |
| ×22 | D tout reporter (WP Rocket) | 100 [100, 100] | 901 ms [901, 901] | 1501 ms [1501, 1501] | 0 ms [0, 0] | 4236 [4226, 4254] |
