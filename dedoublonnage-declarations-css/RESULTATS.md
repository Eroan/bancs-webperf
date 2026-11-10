# Résultats : dédoublonner les déclarations CSS (UDJO), poids, compression et rendu

Produit par `synthese.py` depuis `brut/` ; protocole dans `PROTOCOLE.md`. Tout chiffre cité ailleurs vient de ce fichier.

```
date : 2026-11-10T18:06:27.890Z
os : Darwin 25.5.0 arm64 ; Apple M4 Max
node : v26.13.0
chrome : 157.0.8103.50
css-dedup : 1.13.3
lightningcss : 1.33.0
cssnano : 9.9.0
csso : 5.0.5
clean-css : 5.3.3
postcss : 8.5.32
playwright : 1.65.0
charge : CPU usage: 13.74% user, 17.81% sys, 68.43% idle
```

## 1. Corpus, constats et structure

Constats = groupes signalés par l'analyse (`analyze()`, mode par défaut). Sélecteurs = listes dépliées, comptés par PostCSS.

| Feuille | Octets | Constats | Règles | Sélecteurs | Sélecteurs `-f` | `-f -s` | `-f -a` | `-f -a -s` |
|---|---|---|---|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | 29 198 | 96 | 273 | 426 | +40,6 % | -0,5 % | +40,6 % | -0,5 % |
| `astra-4.14.2-main.min.css` | 44 905 | 166 | 518 | 830 | +52,8 % | -0,4 % | +54,6 % | -1,0 % |
| `kadence-1.6.0-global.min.css` | 28 012 | 79 | 206 | 505 | +54,7 % | +0,2 % | +54,9 % | -0,2 % |
| `woocommerce-11.2.2.css` | 92 709 | 184 | 479 | 976 | +81,9 % | 0,0 % | +88,0 % | 0,0 % |
| `elementor-4.4.0-frontend.css` | 64 419 | 146 | 549 | 680 | +20,1 % | -0,1 % | +22,8 % | -0,4 % |
| `wordpress-7.1.4-block-library.css` | 164 523 | 307 | 1 063 | 1 540 | +58,4 % | -0,6 % | +61,8 % | -0,8 % |
| `bootstrap-5.3.8.css` | 280 311 | 832 | 2 550 | 2 961 | +31,6 % | +4,6 % | +43,1 % | +11,3 % |
| `bulma-1.0.4.css` | 763 923 | 1478 | 4 233 | 5 092 | +17,9 % | +13,7 % | +19,1 % | +14,5 % |

Sélecteurs à sujet universel (composé le plus à droite sans classe, id, balise ni attribut, `> *` par exemple), listes dépliées :

| Feuille | Origine | `-f` | `-f -s` | `-f -a` | `-f -a -s` |
|---|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | 17 | 17 | 17 | 17 | 17 |
| `astra-4.14.2-main.min.css` | 25 | 31 | 25 | 31 | 25 |
| `kadence-1.6.0-global.min.css` | 15 | 15 | 15 | 15 | 15 |
| `woocommerce-11.2.2.css` | 17 | 18 | 17 | 18 | 17 |
| `elementor-4.4.0-frontend.css` | 106 | 106 | 106 | 106 | 106 |
| `wordpress-7.1.4-block-library.css` | 98 | 151 | 97 | 151 | 97 |
| `bootstrap-5.3.8.css` | 83 | 132 | 117 | 132 | 117 |
| `bulma-1.0.4.css` | 12 | 10 | 10 | 10 | 10 |

Fusions appliquées / groupes ignorés comme non sûrs / fusions retenues par `-s` :

| Feuille | `-f` | `-f -s` | `-f -a` | `-f -a -s` |
|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | 86 / 69 / 0 | 10 / 86 / 71 | 90 / 67 / 0 | 12 / 86 / 72 |
| `astra-4.14.2-main.min.css` | 151 / 128 / 0 | 8 / 163 / 129 | 172 / 111 / 0 | 21 / 155 / 133 |
| `kadence-1.6.0-global.min.css` | 62 / 45 / 0 | 6 / 75 / 50 | 66 / 41 / 0 | 8 / 72 / 52 |
| `woocommerce-11.2.2.css` | 231 / 141 / 0 | 4 / 183 / 197 | 239 / 133 / 0 | 5 / 182 / 205 |
| `elementor-4.4.0-frontend.css` | 86 / 67 / 0 | 10 / 96 / 63 | 109 / 80 / 0 | 24 / 120 / 71 |
| `wordpress-7.1.4-block-library.css` | 329 / 228 / 0 | 28 / 270 / 274 | 347 / 221 / 0 | 30 / 274 / 288 |
| `bootstrap-5.3.8.css` | 402 / 625 / 0 | 39 / 747 / 293 | 867 / 204 / 0 | 401 / 417 / 358 |
| `bulma-1.0.4.css` | 2157 / 381 / 0 | 2131 / 392 / 23 | 2250 / 315 / 0 | 2215 / 327 / 33 |

## 2. Taille brute, sans minification (forme du tableau du billet)

| Feuille | `-f` | `-f -s` | `-f -a` | `-f -a -s` |
|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | +1 077 (+3,7 %) | -224 (-0,8 %) | +1 090 (+3,7 %) | -233 (-0,8 %) |
| `astra-4.14.2-main.min.css` | +6 585 (+14,7 %) | -103 (-0,2 %) | +6 586 (+14,7 %) | -463 (-1,0 %) |
| `kadence-1.6.0-global.min.css` | +6 899 (+24,6 %) | -188 (-0,7 %) | +6 889 (+24,6 %) | -223 (-0,8 %) |
| `woocommerce-11.2.2.css` | +50 432 (+54,4 %) | -90 (-0,1 %) | +54 314 (+58,6 %) | -109 (-0,1 %) |
| `elementor-4.4.0-frontend.css` | +2 275 (+3,5 %) | -750 (-1,2 %) | +1 630 (+2,5 %) | -1 467 (-2,3 %) |
| `wordpress-7.1.4-block-library.css` | +35 824 (+21,8 %) | -1 240 (-0,8 %) | +38 733 (+23,5 %) | -1 392 (-0,8 %) |
| `bootstrap-5.3.8.css` | +1 158 (+0,4 %) | -1 676 (-0,6 %) | -14 499 (-5,2 %) | -15 669 (-5,6 %) |
| `bulma-1.0.4.css` | -96 320 (-12,6 %) | -99 439 (-13,0 %) | -103 591 (-13,6 %) | -106 884 (-14,0 %) |

`-f` grossit 7 feuilles sur 8 ; `-f -s` en réduit 8 sur 8.

## 3. Après minification et compression, par feuille

Écart de chaque mode à la même minification sans dédoublonnage : octets bruts, gzip 6, Brotli 5, Brotli 11.

### `generatepress-3.6.1-main.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 29 198 / 5 138 | +1 077, +65, +96, +69 | -224, -11, -13, -22 | -233, -9, -8, -12 |
| Lightning CSS | 19 214 / 4 013 | +1 411, +98, +109, +94 | -88, -10, -1, -5 | -94, -6, +3, -2 |
| cssnano | 18 737 / 4 037 | +1 946, +111, +152, +108 | -3, +2, +8, -6 | -14, +7, +7, +2 |
| csso | 18 846 / 4 059 | +1 501, +97, +116, +109 | -47, -6, -10, -9 | -16, +3, -3, +5 |
| clean-css niv. 1 | 19 512 / 4 088 | +1 261, +93, +101, +82 | -149, -6, -7, -8 | -155, -1, -7, -5 |
| clean-css niv. 2 | 19 247 / 4 052 | +1 406, +93, +110, +95 | -68, 0, -1, +1 | -24, +11, +10, +23 |

Variante inverse (Lightning CSS puis `-f -s`, 5 fusion(s)) : brut -91, gzip6 -10, br5 -10, br11 -10.

### `astra-4.14.2-main.min.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 44 905 / 7 767 | +6 585, +433, +332, +255 | -103, -11, -19, -20 | -463, -34, -44, -44 |
| Lightning CSS | 44 160 / 7 582 | +6 800, +451, +338, +317 | -71, -7, -15, -3 | -359, -23, -32, -24 |
| cssnano | 43 996 / 7 685 | +7 246, +472, +400, +336 | 0, 0, -5, -7 | -257, -7, -23, -3 |
| csso | 44 599 / 7 757 | +5 442, +359, +361, +276 | -64, -9, -12, -2 | -371, -31, -36, -26 |
| clean-css niv. 1 | 44 905 / 7 767 | +6 585, +424, +352, +289 | -103, -11, -20, -23 | -463, -30, -43, -42 |
| clean-css niv. 2 | 43 887 / 7 641 | +6 967, +448, +398, +327 | -43, +2, -7, -10 | -261, -6, -24, -21 |

Variante inverse (Lightning CSS puis `-f -s`, 5 fusion(s)) : brut -71, gzip6 -7, br5 -14, br11 -13.

### `kadence-1.6.0-global.min.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 28 012 / 4 712 | +6 899, +154, +197, +104 | -188, -8, -8, +63 | -223, -5, +13, +4 |
| Lightning CSS | 27 203 / 4 563 | +7 275, +195, +231, +144 | -5, -1, +1, +32 | -40, -5, +11, -14 |
| cssnano | 27 511 / 4 700 | +7 252, +228, +255, +167 | 0, 0, 0, 0 | -29, +1, +3, -26 |
| csso | 27 501 / 4 692 | +7 118, +230, +260, +166 | -23, 0, +2, -10 | -64, -1, +9, 0 |
| clean-css niv. 1 | 27 889 / 4 706 | +6 911, +204, +237, +165 | -186, -13, -10, -21 | -221, -11, -5, +20 |
| clean-css niv. 2 | 27 502 / 4 661 | +7 191, +233, +264, +175 | -5, -1, +3, -17 | -34, +2, -1, -1 |

Variante inverse (Lightning CSS puis `-f -s`, 2 fusion(s)) : brut -8, gzip6 +1, br5 +4, br11 +4.

### `woocommerce-11.2.2.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 92 709 / 10 268 | +50 432, +2 077, +1 191, +793 | -90, +3, +1, -29 | -109, +6, +11, -19 |
| Lightning CSS | 91 399 / 9 993 | +50 814, +2 137, +1 283, +909 | -18, 0, +2, -6 | -37, +5, +8, +6 |
| cssnano | 91 459 / 10 192 | +50 966, +2 239, +1 623, +1 191 | 0, -2, -1, -18 | -19, +1, -3, -13 |
| csso | 90 587 / 10 197 | +49 065, +2 335, +1 650, +1 141 | -56, 0, +1, +33 | -75, +4, +8, -1 |
| clean-css niv. 1 | 92 709 / 10 268 | +50 432, +2 273, +1 657, +1 143 | -90, -5, 0, -7 | -109, -1, +6, -42 |
| clean-css niv. 2 | 91 823 / 10 252 | +50 790, +2 247, +1 639, +1 132 | -18, -2, 0, -42 | -37, +1, +5, -58 |

Variante inverse (Lightning CSS puis `-f -s`, 1 fusion(s)) : brut -18, gzip6 0, br5 +2, br11 -6.

### `elementor-4.4.0-frontend.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 64 419 / 6 331 | +2 275, +151, +197, +120 | -750, -19, +4, -49 | -1 467, -27, -5, -21 |
| Lightning CSS | 54 520 / 5 950 | +3 058, +183, +192, +203 | -103, -5, -8, +7 | -487, -13, -19, -4 |
| cssnano | 54 295 / 6 018 | +3 159, +152, +182, +168 | -40, -7, -12, +24 | -428, -19, -14, -20 |
| csso | 54 531 / 6 019 | +2 345, +106, +134, +87 | -89, -8, -13, +14 | -502, -21, -28, -54 |
| clean-css niv. 1 | 55 267 / 6 023 | +2 730, +146, +160, +145 | -430, -16, -25, -23 | -927, -22, -37, -58 |
| clean-css niv. 2 | 54 410 / 6 037 | +3 079, +139, +179, +148 | -96, -8, -7, -9 | -432, -17, -18, -30 |

Variante inverse (Lightning CSS puis `-f -s`, 5 fusion(s)) : brut -103, gzip6 -5, br5 -8, br11 +7.

### `wordpress-7.1.4-block-library.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 164 523 / 18 510 | +35 824, +2 177, +1 609, +1 105 | -1 240, -48, -24, -114 | -1 392, -41, -9, -75 |
| Lightning CSS | 139 873 / 15 934 | +38 614, +2 250, +1 731, +1 137 | -628, -26, -45, -69 | -749, -15, -46, -32 |
| cssnano | 139 589 / 16 180 | +39 650, +2 185, +1 794, +1 258 | -171, -38, -49, -27 | -199, -32, -60, -18 |
| csso | 139 950 / 16 156 | +37 971, +2 196, +1 828, +1 298 | -264, -62, -43, -22 | -385, -42, -55, -25 |
| clean-css niv. 1 | 142 451 / 16 196 | +37 612, +2 231, +1 838, +1 285 | -850, -52, -73, -25 | -971, -36, -80, -44 |
| clean-css niv. 2 | 140 746 / 16 134 | +38 628, +2 240, +1 878, +1 324 | -295, -17, -28, -29 | -360, +25, -51, +17 |

Variante inverse (Lightning CSS puis `-f -s`, 20 fusion(s)) : brut -628, gzip6 -24, br5 -46, br11 -62.

### `bootstrap-5.3.8.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 280 311 / 24 474 | +1 158, +1 922, +1 741, +1 389 | -1 676, +259, +319, +212 | -15 669, +255, +29, +41 |
| Lightning CSS | 228 703 / 22 533 | +3 781, +1 518, +1 616, +1 485 | -245, +270, +332, +426 | -11 046, +284, +148, +260 |
| cssnano | 226 909 / 23 491 | +6 687, +1 227, +1 149, +679 | +27, -2, -55, -142 | -10 664, -282, -361, +5 |
| csso | 228 306 / 23 279 | +5 207, +1 360, +1 224, +1 034 | -178, +214, +134, +3 | -10 857, -32, -201, +224 |
| clean-css niv. 1 | 232 065 / 22 747 | +2 386, +1 717, +1 708, +1 448 | -1 178, +316, +268, +427 | -11 994, +64, -36, +465 |
| clean-css niv. 2 | 230 255 / 22 675 | +3 137, +1 732, +1 731, +1 553 | -541, +342, +333, +468 | -10 858, +101, +10, +566 |

Variante inverse (Lightning CSS puis `-f -s`, 17 fusion(s)) : brut -605, gzip6 +46, br5 +96, br11 +210.

### `bulma-1.0.4.css`

| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| aucune | 763 923 / 37 828 | -96 320, -5 114, +1 147, +2 908 | -99 439, -5 716, +690, +2 390 | -106 884, -5 921, +562, +2 283 |
| Lightning CSS | 682 662 / 36 207 | -86 927, -5 308, +4 306, +3 288 | -90 440, -5 869, +3 881, +3 046 | -97 155, -6 072, +3 784, +2 878 |
| cssnano | 660 695 / 36 510 | -70 331, -5 041, +4 205, +3 427 | -73 781, -5 563, +3 771, +2 785 | -76 879, -5 710, +3 693, +2 893 |
| csso | 677 938 / 36 730 | -81 333, -5 169, +4 122, +3 338 | -84 852, -5 677, +3 654, +2 726 | -91 581, -5 904, +3 555, +2 755 |
| clean-css niv. 1 | 684 868 / 36 411 | -88 868, -5 225, +4 382, +3 387 | -92 301, -5 774, +3 947, +3 076 | -99 015, -6 000, +3 837, +2 838 |
| clean-css niv. 2 | 677 242 / 36 575 | -88 021, -5 409, +4 340, +3 061 | -91 454, -5 935, +3 888, +2 850 | -94 622, -6 131, +3 872, +2 701 |

Variante inverse (Lightning CSS puis `-f -s`, 2087 fusion(s)) : brut -92 351, gzip6 -6 148, br5 +3 776, br11 +2 906.

## 4. Agrégats sur les 8 feuilles et les 6 minifications (48 couples)

| Mode | brut réduit | gzip 6 réduit | Brotli 5 réduit | Brotli 11 réduit | Brotli 11 : écart médian [min, max] |
|---|---|---|---|---|---|
| `-f` | 6/48 | 6/48 | 0/48 | 0/48 | +4,33 % [+1,34, +11,69] |
| `-f -s` | 44/48 | 34/48 | 26/48 | 29/48 | -0,11 % [-0,77, +8,45] |
| `-f -a` | 12/48 | 6/48 | 0/48 | 0/48 | +4,37 % [+1,36, +12,47] |
| `-f -a -s` | 48/48 | 33/48 | 27/48 | 28/48 | -0,06 % [-0,96, +7,95] |

Écart en pourcentage par feuille, sans minification puis après Lightning CSS (brut / gzip 6 / Brotli 11) :

| Feuille | Minification | `-f` | `-f -s` | `-f -a -s` |
|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | aucune | +3,7 % / +1,1 % / +1,3 % | -0,8 % / -0,2 % / -0,4 % | -0,8 % / -0,2 % / -0,2 % |
| `generatepress-3.6.1-main.css` | Lightning CSS | +7,3 % / +2,1 % / +2,3 % | -0,5 % / -0,2 % / -0,1 % | -0,5 % / -0,1 % / 0,0 % |
| `astra-4.14.2-main.min.css` | aucune | +14,7 % / +5,0 % / +3,3 % | -0,2 % / -0,1 % / -0,3 % | -1,0 % / -0,4 % / -0,6 % |
| `astra-4.14.2-main.min.css` | Lightning CSS | +15,4 % / +5,3 % / +4,2 % | -0,2 % / -0,1 % / 0,0 % | -0,8 % / -0,3 % / -0,3 % |
| `kadence-1.6.0-global.min.css` | aucune | +24,6 % / +2,9 % / +2,2 % | -0,7 % / -0,1 % / +1,3 % | -0,8 % / -0,1 % / +0,1 % |
| `kadence-1.6.0-global.min.css` | Lightning CSS | +26,7 % / +3,7 % / +3,2 % | 0,0 % / 0,0 % / +0,7 % | -0,1 % / -0,1 % / -0,3 % |
| `woocommerce-11.2.2.css` | aucune | +54,4 % / +17,5 % / +7,7 % | -0,1 % / 0,0 % / -0,3 % | -0,1 % / +0,1 % / -0,2 % |
| `woocommerce-11.2.2.css` | Lightning CSS | +55,6 % / +18,4 % / +9,1 % | 0,0 % / 0,0 % / -0,1 % | 0,0 % / 0,0 % / +0,1 % |
| `elementor-4.4.0-frontend.css` | aucune | +3,5 % / +1,9 % / +1,9 % | -1,2 % / -0,2 % / -0,8 % | -2,3 % / -0,3 % / -0,3 % |
| `elementor-4.4.0-frontend.css` | Lightning CSS | +5,6 % / +2,5 % / +3,4 % | -0,2 % / -0,1 % / +0,1 % | -0,9 % / -0,2 % / -0,1 % |
| `wordpress-7.1.4-block-library.css` | aucune | +21,8 % / +9,5 % / +6,0 % | -0,8 % / -0,2 % / -0,6 % | -0,8 % / -0,2 % / -0,4 % |
| `wordpress-7.1.4-block-library.css` | Lightning CSS | +27,6 % / +11,9 % / +7,1 % | -0,4 % / -0,1 % / -0,4 % | -0,5 % / -0,1 % / -0,2 % |
| `bootstrap-5.3.8.css` | aucune | +0,4 % / +5,7 % / +5,7 % | -0,6 % / +0,8 % / +0,9 % | -5,6 % / +0,8 % / +0,2 % |
| `bootstrap-5.3.8.css` | Lightning CSS | +1,7 % / +4,9 % / +6,6 % | -0,1 % / +0,9 % / +1,9 % | -4,8 % / +0,9 % / +1,2 % |
| `bulma-1.0.4.css` | aucune | -12,6 % / -7,4 % / +7,7 % | -13,0 % / -8,3 % / +6,3 % | -14,0 % / -8,6 % / +6,0 % |
| `bulma-1.0.4.css` | Lightning CSS | -12,7 % / -8,0 % / +9,1 % | -13,2 % / -8,9 % / +8,4 % | -14,2 % / -9,2 % / +7,9 % |

Minification seule contre dédoublonnage seul (octets bruts, écart à la feuille d'origine) :

| Feuille | Lightning CSS seul | cssnano seul | `-f -a -s` seul | `-f -a -s` puis Lightning CSS |
|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | -34,2 % | -35,8 % | -0,8 % | -34,5 % |
| `astra-4.14.2-main.min.css` | -1,7 % | -2,0 % | -1,0 % | -2,5 % |
| `kadence-1.6.0-global.min.css` | -2,9 % | -1,8 % | -0,8 % | -3,0 % |
| `woocommerce-11.2.2.css` | -1,4 % | -1,3 % | -0,1 % | -1,5 % |
| `elementor-4.4.0-frontend.css` | -15,4 % | -15,7 % | -2,3 % | -16,1 % |
| `wordpress-7.1.4-block-library.css` | -15,0 % | -15,2 % | -0,8 % | -15,4 % |
| `bootstrap-5.3.8.css` | -18,4 % | -19,1 % | -5,6 % | -22,4 % |
| `bulma-1.0.4.css` | -10,6 % | -13,5 % | -14,0 % | -23,4 % |

## 5. Conservation des déclarations (feuilles réelles)

Couple perdu = (portée, sélecteur, propriété, valeur) présent avant et absent après. « Équivalent » : la sortie porte, pour ce sélecteur et cette propriété (ou son alias), une valeur de même forme canonique (`bold`/`700`, `normal`/`400`, `none`/`0` sur une bordure, zéro sans unité, valeur répétée).

| Feuille | Mode | Couples perdus | dont équivalents | non expliqués |
|---|---|---|---|---|
| `generatepress-3.6.1-main.css` | `-f` | 1 | 1 | 0 |
| `generatepress-3.6.1-main.css` | `-f -a` | 1 | 1 | 0 |
| `astra-4.14.2-main.min.css` | `-f` | 2 | 2 | 0 |
| `astra-4.14.2-main.min.css` | `-f -a` | 5 | 5 | 0 |
| `kadence-1.6.0-global.min.css` | `-f` | 1 | 1 | 0 |
| `kadence-1.6.0-global.min.css` | `-f -a` | 1 | 1 | 0 |
| `elementor-4.4.0-frontend.css` | `-f` | 5 | 5 | 0 |
| `elementor-4.4.0-frontend.css` | `-f -a` | 5 | 5 | 0 |
| `wordpress-7.1.4-block-library.css` | `-f` | 20 | 20 | 0 |
| `wordpress-7.1.4-block-library.css` | `-f -s` | 1 | 1 | 0 |
| `wordpress-7.1.4-block-library.css` | `-f -a` | 20 | 20 | 0 |
| `wordpress-7.1.4-block-library.css` | `-f -a -s` | 1 | 1 | 0 |
| `bulma-1.0.4.css` | `-f` | 4 | 4 | 0 |
| `bulma-1.0.4.css` | `-f -s` | 4 | 4 | 0 |
| `bulma-1.0.4.css` | `-f -a` | 4 | 4 | 0 |
| `bulma-1.0.4.css` | `-f -a -s` | 4 | 4 | 0 |

16 sorties sur 32 sans aucun couple perdu ; couples perdus non expliqués : 0.

## 6. Témoins de cascade (Chrome)

| Cas | Référence | Fusion naïve | `-f` | `-f -a` | `-f` sans liste d'exclusion |
|---|---|---|---|---|---|
| `sur` | e1 rgb(255, 0, 0), e2 rgb(255, 0, 0) | rendu inchangé | fusionné, rendu inchangé | fusionné, rendu inchangé | fusionné, rendu inchangé |
| `intercale` | e1 rgb(0, 0, 255), e2 rgb(255, 0, 0) | **rendu changé** | non fusionné, rendu inchangé | fusionné, **rendu changé** | non fusionné, rendu inchangé |
| `blocs` | e1 rgb(0, 0, 255), e2 rgb(255, 0, 0) | **rendu changé** | non fusionné, rendu inchangé | fusionné, **rendu changé** | non fusionné, rendu inchangé |
| `hack` | e1 rgb(255, 0, 0), e2 rgb(0, 0, 0) | **rendu changé** | non fusionné, rendu inchangé | non fusionné, rendu inchangé | fusionné, **rendu changé** |

- `intercale`, f : raison donnée par l'outil : « intervening `color` declaration in `.x` (line 1) »
- `intercale`, f-sans-liste : raison donnée par l'outil : « intervening `color` declaration in `.x` (line 1) »

## 7. Rendu d'une page réelle : règles appariées et styles calculés (Bootstrap 5.3.8, Chrome 157.0.8103.50)

Variantes minifiées par Lightning CSS. Règles appariées : somme sur les éléments (pseudo-éléments compris) des règles d'auteur appariées. Écarts : éléments (ou pseudo-éléments) dont au moins un style calculé diffère de l'origine.

| Page | Variante | Octets de la feuille | Éléments | Règles appariées | Écart | Max par élément | Écarts de style calculé |
|---|---|---|---|---|---|---|---|
| cheatsheet | origine | 228 703 | 1 416 | 8 026 | 0,0 % | 17 | 0 |
| cheatsheet | f | 232 484 | 1 416 | 10 597 | +32,0 % | 29 | 0 |
| cheatsheet | fs | 228 458 | 1 416 | 8 059 | +0,4 % | 17 | 0 |
| cheatsheet | fa | 220 669 | 1 416 | 11 171 | +39,2 % | 34 | 385 |
| cheatsheet | fas | 217 657 | 1 416 | 8 096 | +0,9 % | 17 | 0 |
| cheatsheet | double | 457 406 | 1 416 | 15 737 | +96,1 % | 34 | 0 |
| album | origine | 228 703 | 211 | 1 214 | 0,0 % | 15 | 0 |
| album | f | 232 484 | 211 | 1 655 | +36,3 % | 25 | 0 |
| album | fs | 228 458 | 211 | 1 251 | +3,0 % | 15 | 0 |
| album | fa | 220 669 | 211 | 1 758 | +44,8 % | 28 | 360 |
| album | fas | 217 657 | 211 | 1 263 | +4,0 % | 16 | 0 |
| album | double | 457 406 | 211 | 2 401 | +97,8 % | 29 | 0 |

Statistiques de sélecteurs de Chrome sur un recalcul complet forcé (feuilles d'auteur ; durée sous trace, indicative) :

| Page | Variante | Éléments recalculés | Tentatives | Écart | Correspondances | Rejets rapides | µs sous trace |
|---|---|---|---|---|---|---|---|
| cheatsheet | origine | 1 217 | 80 930 | 0,0 % | 6 780 | 67 568 | 1 226 |
| cheatsheet | f | 1 217 | 134 933 | +66,7 % | 8 970 | 117 520 | 1 890 |
| cheatsheet | fs | 1 217 | 112 857 | +39,5 % | 6 813 | 99 390 | 1 595 |
| cheatsheet | fa | 1 217 | 135 722 | +67,7 % | 9 415 | 117 785 | 1 886 |
| cheatsheet | fas | 1 217 | 112 899 | +39,5 % | 6 850 | 99 392 | 1 526 |
| cheatsheet | double | 1 217 | 159 429 | +97,0 % | 13 255 | 134 313 | 2 251 |
| album | origine | 161 | 10 979 | 0,0 % | 1 011 | 8 829 | 142 |
| album | f | 161 | 18 604 | +69,5 % | 1 408 | 15 145 | 244 |
| album | fs | 161 | 15 516 | +41,3 % | 1 042 | 13 119 | 203 |
| album | fa | 161 | 18 736 | +70,7 % | 1 503 | 15 179 | 277 |
| album | fas | 161 | 15 518 | +41,3 % | 1 052 | 13 110 | 229 |
| album | double | 161 | 21 943 | +99,9 % | 2 009 | 17 657 | 282 |

Exemples d'écarts, cheatsheet / fa :

- `button.btn btn-primary` (style) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent` ; `background-color: rgb(13, 110, 253) → rgba(0, 0, 0, 0)`
- `button.btn btn-primary` (avant) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent`
- `button.btn btn-primary` (apres) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent`
- `button.btn btn-primary` (style) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent`

Exemples d'écarts, album / fa :

- `a.btn btn-primary my-2` (style) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent` ; `background-color: rgb(13, 110, 253) → rgba(0, 0, 0, 0)`
- `a.btn btn-primary my-2` (avant) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent`
- `a.btn btn-primary my-2` (apres) : `--bs-btn-bg: #0d6efd → transparent` ; `--bs-btn-border-color: #0d6efd → transparent` ; `--bs-btn-hover-border-color: #0a58ca → transparent`
- `a.btn btn-secondary my-2` (style) : `--bs-btn-bg: #6c757d → transparent` ; `--bs-btn-border-color: #6c757d → transparent` ; `--bs-btn-hover-border-color: #565e64 → transparent` ; `background-color: rgb(108, 117, 125) → rgba(0, 0, 0, 0)`

## 8. Durée du recalcul de style (série `rendu-t1-9-p10-202611101759-TEMOIN-ECHOUE.json`)

10 passages par variante et par page, ordre tourné, échauffement jeté. Médiane [min, max] en ms par recalcul ; écart des médianes à l'origine. Départ : inactivité médiane 85.0 % (relevés 82.4, 84.5, 85.56, 87.7).

- « display » : `body` en `display: none` puis rendu, 20 fois (arbre de rendu reconstruit) ;
- « classe » : classe basculée sur `html`, 40 fois, règle `html.banc-bascule *` injectée hors de la feuille testée.

Témoin de durée (plus courte mesure de `double` au-dessus de la plus longue de l'origine) :

| Niveau | Page | Déclencheur | Origine, max | Double, min | Témoin |
|---|---|---|---|---|---|
| ×1 | cheatsheet | display | 2,139 | 2,063 | **échoué** |
| ×1 | cheatsheet | classe | 1,661 | 1,852 | passé |
| ×1 | album | display | 0,298 | 0,291 | **échoué** |
| ×1 | album | classe | 0,254 | 0,278 | passé |
| ×9 | cheatsheet | display | 21,125 | 19,541 | **échoué** |
| ×9 | cheatsheet | classe | 19,737 | 19,398 | **échoué** |
| ×9 | album | display | 1,783 | 1,595 | **échoué** |
| ×9 | album | classe | 1,575 | 1,817 | passé |

Mesures publiables comme écart (témoin passé partout) : aucune. Sans témoin passé partout, les médianes ci-dessous ne se citent que comme borne.

### Processeur ×1

| Page | Variante | « display » | Écart | « classe » | Écart | Recalcul au chargement | Écart |
|---|---|---|---|---|---|---|---|
| cheatsheet | origine | 2,06 [1,82, 2,14] | — | 1,64 [1,62, 1,66] | — | 10,56 [9,92, 11,03] | — |
| cheatsheet | f | 2,11 [1,96, 2,20] | +2,6 % (recouvrantes) | 1,73 [1,70, 1,77] | +5,4 % | 10,73 [9,70, 11,80] | +1,6 % (recouvrantes) |
| cheatsheet | fs | 2,07 [1,84, 2,20] | +0,4 % (recouvrantes) | 1,65 [1,64, 1,72] | +0,7 % (recouvrantes) | 10,34 [9,82, 10,82] | -2,1 % (recouvrantes) |
| cheatsheet | fa | 2,18 [2,08, 2,25] | +6,1 % (recouvrantes) | 1,73 [1,71, 1,94] | +5,3 % | 10,66 [10,34, 11,49] | +0,9 % (recouvrantes) |
| cheatsheet | fas | 2,03 [1,85, 2,26] | -1,5 % (recouvrantes) | 1,65 [1,62, 1,68] | +0,6 % (recouvrantes) | 10,55 [9,83, 10,91] | -0,1 % (recouvrantes) |
| cheatsheet | double | 2,24 [2,06, 2,35] | +9,0 % (recouvrantes) | 1,88 [1,85, 1,94] | +14,3 % | 11,13 [10,81, 12,05] | +5,4 % (recouvrantes) |
| album | origine | 0,26 [0,16, 0,30] | — | 0,24 [0,17, 0,25] | — | 2,12 [1,95, 2,20] | — |
| album | f | 0,27 [0,23, 0,30] | +6,1 % (recouvrantes) | 0,26 [0,23, 0,27] | +6,5 % (recouvrantes) | 2,21 [2,02, 2,42] | +3,9 % (recouvrantes) |
| album | fs | 0,24 [0,20, 0,31] | -5,4 % (recouvrantes) | 0,23 [0,20, 0,26] | -4,3 % (recouvrantes) | 2,15 [1,78, 2,31] | +1,1 % (recouvrantes) |
| album | fa | 0,29 [0,22, 0,33] | +12,2 % (recouvrantes) | 0,26 [0,22, 0,29] | +9,3 % (recouvrantes) | 2,30 [2,10, 2,43] | +8,3 % (recouvrantes) |
| album | fas | 0,29 [0,21, 0,33] | +12,7 % (recouvrantes) | 0,26 [0,21, 0,27] | +5,6 % (recouvrantes) | 2,20 [2,08, 2,34] | +3,7 % (recouvrantes) |
| album | double | 0,34 [0,29, 0,36] | +30,8 % (recouvrantes) | 0,30 [0,28, 0,32] | +24,4 % | 2,64 [2,32, 2,78] | +24,3 % |

### Processeur ×9

| Page | Variante | « display » | Écart | « classe » | Écart | Recalcul au chargement | Écart |
|---|---|---|---|---|---|---|---|
| cheatsheet | origine | 20,60 [17,89, 21,13] | — | 18,98 [16,84, 19,74] | — | 89,47 [81,87, 96,06] | — |
| cheatsheet | f | 19,65 [18,57, 22,32] | -4,6 % (recouvrantes) | 19,87 [17,85, 20,80] | +4,7 % (recouvrantes) | 90,89 [85,80, 95,81] | +1,6 % (recouvrantes) |
| cheatsheet | fs | 18,59 [17,81, 22,37] | -9,8 % (recouvrantes) | 19,12 [16,98, 19,66] | +0,7 % (recouvrantes) | 93,67 [85,40, 111,67] | +4,7 % (recouvrantes) |
| cheatsheet | fa | 19,32 [18,53, 20,68] | -6,2 % (recouvrantes) | 18,70 [17,76, 21,22] | -1,5 % (recouvrantes) | 89,11 [86,42, 107,72] | -0,4 % (recouvrantes) |
| cheatsheet | fas | 18,38 [17,81, 21,58] | -10,8 % (recouvrantes) | 17,43 [16,96, 20,33] | -8,2 % (recouvrantes) | 89,81 [83,66, 95,77] | +0,4 % (recouvrantes) |
| cheatsheet | double | 20,31 [19,54, 20,85] | -1,4 % (recouvrantes) | 19,74 [19,40, 20,52] | +4,0 % (recouvrantes) | 97,30 [94,09, 100,02] | +8,7 % (recouvrantes) |
| album | origine | 1,39 [1,17, 1,78] | — | 1,50 [1,43, 1,57] | — | 18,66 [17,18, 20,97] | — |
| album | f | 1,49 [0,91, 1,83] | +6,8 % (recouvrantes) | 1,66 [1,55, 1,71] | +11,2 % (recouvrantes) | 20,48 [18,89, 22,99] | +9,8 % (recouvrantes) |
| album | fs | 1,55 [1,13, 2,00] | +11,1 % (recouvrantes) | 1,55 [1,51, 1,60] | +3,5 % (recouvrantes) | 19,42 [18,10, 22,02] | +4,1 % (recouvrantes) |
| album | fa | 1,69 [1,39, 2,05] | +21,4 % (recouvrantes) | 1,70 [1,66, 1,79] | +13,3 % | 19,62 [16,54, 22,78] | +5,2 % (recouvrantes) |
| album | fas | 1,52 [1,31, 1,98] | +9,3 % (recouvrantes) | 1,55 [1,43, 1,63] | +3,5 % (recouvrantes) | 19,01 [17,42, 21,13] | +1,9 % (recouvrantes) |
| album | double | 1,71 [1,59, 2,15] | +23,1 % (recouvrantes) | 1,89 [1,82, 2,02] | +26,2 % | 24,42 [21,04, 27,77] | +30,9 % |

