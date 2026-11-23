# Résultats : bridage réseau CDP

Série `serie-2026-11-23T23-10` : Chrome 158.0.8127.37, Playwright 1.64.1, 10 passages, 300 chargements. Protocole : `PROTOCOLE.md`. Durées en ms, médiane [min, max] sur 10 chargements, relatives au début de la navigation sauf mention.

## Témoins

- Positif (l'émulation s'applique) : sous `L562`, délai serveur 0, `Network.responseReceived` arrive 570 [565, 574] ms après `requestWillBeSent` ; 20/20 chargements à 562 ms ou plus.
- Négatif (l'instrument lit le temps du serveur) : sans émulation, `responseStart − requestStart` s'écarte de l'instant d'envoi des en-têtes par le serveur de 0,2 [0,0, 0,4] ms ; 60/60 chargements à 5 ms ou moins.

## Document de 2 Ko

| Condition | Délai serveur | `responseStart` | `responseEnd` | `domInteractive` | en-têtes livrés (CDP `responseReceived`) | `receiveHeadersStart` (CDP) |
|---|---|---|---|---|---|---|
| `aucun` | 0 | 2,0 [1,9, 2,6] | 2,1 [2,0, 2,7] | 5,4 [5,2, 6,0] | 2,1 [2,0, 2,8] | 1,5 [1,5, 2,2] |
| `aucun` | 300 | 303 [300, 303] | 303 [301, 304] | 314 [308, 316] | 304 [302, 305] | 302 [300, 303] |
| `aucun` | 800 | 803 [802, 804] | 803 [803, 804] | 815 [806, 816] | 804 [803, 807] | 802 [801, 803] |
| `L40` | 0 | 40 [40, 41] | 43 [41, 51] | 46 [44, 54] | 43 [41, 50] | 40 [40, 40] |
| `L40` | 300 | 303 [302, 303] | 303 [303, 305] | 314 [307, 316] | 304 [303, 305] | 302 [301, 303] |
| `L40` | 800 | 803 [802, 804] | 804 [803, 805] | 815 [811, 817] | 805 [803, 807] | 803 [801, 804] |
| `L562` | 0 | 563 [563, 563] | 572 [566, 574] | 582 [576, 586] | 573 [566, 574] | 563 [563, 563] |
| `L562` | 300 | 563 [563, 563] | 571 [566, 573] | 580 [577, 586] | 571 [566, 574] | 563 [563, 563] |
| `L562` | 800 | 803 [801, 803] | 804 [802, 805] | 813 [810, 816] | 804 [802, 806] | 803 [801, 803] |
| `S4G` | 0 | 563 [563, 563] | 580 [579, 589] | 583 [581, 594] | 573 [572, 583] | 563 [563, 563] |
| `S4G` | 300 | 563 [563, 563] | 582 [580, 588] | 586 [580, 595] | 574 [571, 583] | 563 [563, 563] |
| `S4G` | 800 | 803 [801, 804] | 818 [811, 820] | 820 [812, 826] | 812 [802, 814] | 802 [800, 803] |
| `R562` | 0 | 563 [563, 563] | 569 [566, 574] | 581 [578, 587] | 570 [567, 575] | 563 [563, 563] |
| `R562` | 300 | 563 [563, 563] | 570 [566, 574] | 580 [571, 585] | 570 [566, 575] | 563 [563, 563] |
| `R562` | 800 | 803 [802, 844] | 804 [803, 846] | 816 [814, 851] | 805 [804, 846] | 803 [802, 844] |

## Document de 100 Ko

| Condition | Délai serveur | `responseStart` | `responseEnd` | `domInteractive` | en-têtes livrés (CDP `responseReceived`) | `receiveHeadersStart` (CDP) |
|---|---|---|---|---|---|---|
| `aucun` | 0 | 2,1 [1,9, 2,2] | 2,2 [1,9, 2,3] | 5,9 [5,6, 6,2] | 2,2 [2,0, 2,2] | 1,6 [1,5, 1,7] |
| `aucun` | 300 | 303 [301, 303] | 303 [301, 304] | 314 [305, 317] | 303 [301, 305] | 303 [301, 303] |
| `aucun` | 800 | 803 [801, 803] | 803 [802, 804] | 816 [812, 818] | 804 [802, 805] | 802 [801, 803] |
| `L40` | 0 | 41 [40, 41] | 45 [42, 51] | 49 [45, 54] | 45 [41, 50] | 40 [40, 40] |
| `L40` | 300 | 303 [302, 303] | 304 [303, 305] | 314 [309, 317] | 304 [303, 305] | 303 [302, 303] |
| `L40` | 800 | 803 [802, 804] | 804 [804, 805] | 816 [809, 817] | 804 [804, 805] | 802 [801, 803] |
| `L562` | 0 | 563 [563, 563] | 570 [565, 573] | 578 [570, 582] | 569 [565, 573] | 563 [563, 563] |
| `L562` | 300 | 563 [563, 563] | 569 [565, 573] | 579 [573, 582] | 569 [565, 572] | 563 [563, 563] |
| `L562` | 800 | 803 [802, 804] | 804 [802, 805] | 814 [808, 817] | 804 [802, 805] | 802 [801, 803] |
| `S4G` | 0 | 563 [563, 563] | 1114 [1112, 1115] | 1114 [1113, 1116] | 574 [572, 576] | 563 [563, 563] |
| `S4G` | 300 | 563 [563, 563] | 1115 [1112, 1122] | 1115 [1113, 1126] | 575 [572, 584] | 563 [563, 563] |
| `S4G` | 800 | 803 [802, 803] | 1351 [1344, 1353] | 1351 [1344, 1354] | 812 [803, 814] | 803 [801, 803] |
| `R562` | 0 | 563 [563, 563] | 567 [564, 571] | 577 [570, 582] | 567 [564, 571] | 563 [563, 563] |
| `R562` | 300 | 563 [563, 563] | 568 [565, 574] | 579 [572, 596] | 568 [565, 587] | 563 [563, 563] |
| `R562` | 800 | 802 [801, 804] | 804 [803, 805] | 815 [807, 817] | 804 [803, 806] | 802 [801, 803] |

## Ce que la condition ajoute, par rapport à « aucun » (écart des médianes)

| Condition | Taille | Délai serveur | sur `responseStart` | sur `responseEnd` | sur l'image (`responseEnd − requestStart`) |
|---|---|---|---|---|---|
| `L40` | 2 Ko | 0 | 38 | 41 | 41 |
| `L40` | 2 Ko | 300 | -0,0 | 0,2 | 42 |
| `L40` | 2 Ko | 800 | 0,3 | 1,0 | 41 |
| `L40` | 100 Ko | 0 | 38 | 43 | 40 |
| `L40` | 100 Ko | 300 | 0,1 | 0,5 | 43 |
| `L40` | 100 Ko | 800 | 0,0 | 0,9 | 42 |
| `L562` | 2 Ko | 0 | 561 | 570 | 566 |
| `L562` | 2 Ko | 300 | 260 | 268 | 567 |
| `L562` | 2 Ko | 800 | 0,0 | 0,2 | 570 |
| `L562` | 100 Ko | 0 | 561 | 567 | 568 |
| `L562` | 100 Ko | 300 | 260 | 265 | 569 |
| `L562` | 100 Ko | 800 | 0,4 | 1,2 | 567 |
| `S4G` | 2 Ko | 0 | 561 | 578 | 579 |
| `S4G` | 2 Ko | 300 | 260 | 279 | 578 |
| `S4G` | 2 Ko | 800 | -0,2 | 15 | 581 |
| `S4G` | 100 Ko | 0 | 561 | 1112 | 581 |
| `S4G` | 100 Ko | 300 | 260 | 811 | 579 |
| `S4G` | 100 Ko | 800 | 0,6 | 548 | 578 |
| `R562` | 2 Ko | 0 | 561 | 567 | 568 |
| `R562` | 2 Ko | 300 | 260 | 266 | 569 |
| `R562` | 2 Ko | 800 | 0,2 | 1,0 | 565 |
| `R562` | 100 Ko | 0 | 561 | 564 | 570 |
| `R562` | 100 Ko | 300 | 260 | 265 | 569 |
| `R562` | 100 Ko | 800 | -0,1 | 0,9 | 565 |

## Conditions

- `aucun` (aucune émulation) : aucune
- `L40` (emulateNetworkConditions, 40 ms) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 40, "downloadThroughput": -1, "uploadThroughput": -1}`
- `L562` (emulateNetworkConditions, 562,5 ms) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 562.5, "downloadThroughput": -1, "uploadThroughput": -1}`
- `S4G` (emulateNetworkConditions, Slow 4G) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 562.5, "downloadThroughput": 188743.68, "uploadThroughput": 86400}`
- `R562` (emulateNetworkConditionsByRule, 562,5 ms) : `Network.emulateNetworkConditionsByRule` `{"matchedNetworkConditions": [{"urlPattern": "", "latency": 562.5, "downloadThroughput": -1, "uploadThroughput": -1}]}`
