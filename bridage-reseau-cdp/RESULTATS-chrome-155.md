# Résultats : bridage réseau CDP

Série `serie-2026-10-22T14-50` : Chrome 155.0.8059.85, Playwright 1.64.1, 10 passages, 300 chargements. Protocole : `PROTOCOLE.md`. Durées en ms, médiane [min, max] sur 10 chargements, relatives au début de la navigation sauf mention.

## Témoins

- Positif (l'émulation s'applique) : sous `L562`, délai serveur 0, `Network.responseReceived` arrive 565 [564, 566] ms après `requestWillBeSent` ; 20/20 chargements à 562 ms ou plus.
- Négatif (l'instrument lit le temps du serveur) : sans émulation, `responseStart − requestStart` s'écarte de l'instant d'envoi des en-têtes par le serveur de 0,2 [0,0, 0,7] ms ; 60/60 chargements à 5 ms ou moins.

## Document de 2 Ko

| Condition | Délai serveur | `responseStart` | `responseEnd` | `domInteractive` | en-têtes livrés (CDP `responseReceived`) | `receiveHeadersStart` (CDP) |
|---|---|---|---|---|---|---|
| `aucun` | 0 | 1,9 [1,8, 3,0] | 2,0 [1,9, 3,4] | 5,4 [5,0, 8,0] | 2,1 [1,9, 3,2] | 1,5 [1,5, 2,3] |
| `aucun` | 300 | 302 [302, 302] | 302 [302, 302] | 307 [305, 308] | 302 [302, 303] | 301 [301, 302] |
| `aucun` | 800 | 802 [801, 803] | 802 [801, 804] | 809 [807, 813] | 803 [802, 805] | 802 [800, 803] |
| `L40` | 0 | 2,0 [1,8, 2,1] | 42 [41, 45] | 45 [44, 48] | 42 [41, 45] | 1,5 [1,4, 1,6] |
| `L40` | 300 | 302 [302, 302] | 302 [302, 303] | 307 [306, 310] | 302 [302, 303] | 302 [301, 302] |
| `L40` | 800 | 802 [801, 802] | 802 [802, 803] | 807 [805, 812] | 802 [801, 805] | 802 [801, 802] |
| `L562` | 0 | 1,9 [0,8, 2,1] | 565 [564, 566] | 571 [569, 574] | 565 [564, 566] | 1,5 [0,4, 1,6] |
| `L562` | 300 | 302 [301, 302] | 568 [566, 569] | 574 [571, 575] | 568 [566, 570] | 302 [300, 302] |
| `L562` | 800 | 802 [801, 802] | 803 [802, 803] | 809 [807, 812] | 803 [802, 804] | 802 [801, 802] |
| `S4G` | 0 | 1,9 [0,7, 2,0] | 580 [579, 580] | 581 [580, 587] | 573 [572, 573] | 1,5 [0,3, 1,6] |
| `S4G` | 300 | 302 [301, 302] | 580 [579, 581] | 582 [580, 587] | 572 [572, 574] | 302 [301, 302] |
| `S4G` | 800 | 802 [801, 803] | 818 [810, 819] | 820 [811, 824] | 811 [802, 812] | 802 [800, 802] |
| `R562` | 0 | 1,9 [0,7, 2,2] | 565 [564, 566] | 572 [568, 574] | 565 [564, 566] | 1,4 [0,3, 1,5] |
| `R562` | 300 | 302 [301, 302] | 568 [564, 568] | 574 [570, 576] | 568 [564, 569] | 302 [300, 302] |
| `R562` | 800 | 802 [801, 802] | 802 [801, 803] | 808 [806, 812] | 803 [801, 804] | 802 [800, 802] |

## Document de 100 Ko

| Condition | Délai serveur | `responseStart` | `responseEnd` | `domInteractive` | en-têtes livrés (CDP `responseReceived`) | `receiveHeadersStart` (CDP) |
|---|---|---|---|---|---|---|
| `aucun` | 0 | 1,9 [0,6, 2,1] | 2,0 [0,8, 2,2] | 5,8 [4,3, 6,2] | 2,0 [0,8, 2,2] | 1,5 [0,3, 1,6] |
| `aucun` | 300 | 302 [300, 302] | 302 [301, 303] | 309 [308, 310] | 302 [301, 303] | 301 [300, 302] |
| `aucun` | 800 | 802 [801, 803] | 802 [801, 803] | 810 [808, 812] | 803 [802, 806] | 802 [801, 802] |
| `L40` | 0 | 1,9 [1,7, 2,0] | 44 [41, 45] | 48 [45, 49] | 44 [41, 45] | 1,5 [1,4, 1,7] |
| `L40` | 300 | 302 [301, 302] | 302 [301, 303] | 309 [306, 310] | 302 [301, 303] | 302 [300, 302] |
| `L40` | 800 | 802 [801, 802] | 803 [802, 804] | 810 [806, 814] | 803 [802, 804] | 802 [801, 802] |
| `L562` | 0 | 2,0 [0,8, 2,2] | 565 [564, 566] | 572 [569, 577] | 566 [564, 566] | 1,5 [0,4, 1,7] |
| `L562` | 300 | 302 [301, 302] | 567 [566, 569] | 574 [571, 578] | 567 [566, 569] | 301 [300, 302] |
| `L562` | 800 | 802 [802, 802] | 803 [802, 804] | 809 [808, 814] | 803 [802, 805] | 802 [801, 802] |
| `S4G` | 0 | 1,9 [1,8, 2,1] | 1113 [1112, 1113] | 1113 [1112, 1114] | 573 [572, 577] | 1,4 [1,4, 1,7] |
| `S4G` | 300 | 302 [300, 302] | 1113 [1111, 1113] | 1113 [1111, 1114] | 573 [572, 573] | 302 [300, 302] |
| `S4G` | 800 | 802 [802, 802] | 1351 [1350, 1352] | 1352 [1350, 1355] | 811 [811, 814] | 802 [801, 802] |
| `R562` | 0 | 2,0 [0,8, 2,1] | 564 [564, 566] | 572 [569, 574] | 565 [564, 566] | 1,5 [0,4, 1,6] |
| `R562` | 300 | 302 [302, 302] | 568 [565, 569] | 575 [571, 584] | 568 [565, 569] | 302 [301, 302] |
| `R562` | 800 | 802 [801, 803] | 803 [801, 803] | 809 [807, 814] | 803 [801, 804] | 802 [801, 802] |

## Ce que la condition ajoute, par rapport à « aucun » (écart des médianes)

| Condition | Taille | Délai serveur | sur `responseStart` | sur `responseEnd` | sur l'image (`responseEnd − requestStart`) |
|---|---|---|---|---|---|
| `L40` | 2 Ko | 0 | 0,1 | 40 | 41 |
| `L40` | 2 Ko | 300 | 0,0 | 0,1 | 41 |
| `L40` | 2 Ko | 800 | -0,1 | 0,1 | 43 |
| `L40` | 100 Ko | 0 | 0,0 | 42 | 42 |
| `L40` | 100 Ko | 300 | 0,1 | 0,3 | 42 |
| `L40` | 100 Ko | 800 | -0,1 | 0,6 | 40 |
| `L562` | 2 Ko | 0 | 0,0 | 563 | 564 |
| `L562` | 2 Ko | 300 | 0,1 | 266 | 563 |
| `L562` | 2 Ko | 800 | -0,0 | 0,2 | 563 |
| `L562` | 100 Ko | 0 | 0,1 | 563 | 564 |
| `L562` | 100 Ko | 300 | -0,4 | 265 | 564 |
| `L562` | 100 Ko | 800 | 0,1 | 0,2 | 563 |
| `S4G` | 2 Ko | 0 | 0,0 | 578 | 580 |
| `S4G` | 2 Ko | 300 | 0,0 | 278 | 579 |
| `S4G` | 2 Ko | 800 | -0,1 | 16 | 579 |
| `S4G` | 100 Ko | 0 | 0,0 | 1111 | 579 |
| `S4G` | 100 Ko | 300 | 0,1 | 810 | 578 |
| `S4G` | 100 Ko | 800 | 0,0 | 549 | 578 |
| `R562` | 2 Ko | 0 | 0,0 | 563 | 564 |
| `R562` | 2 Ko | 300 | 0,1 | 266 | 564 |
| `R562` | 2 Ko | 800 | 0,0 | 0,2 | 563 |
| `R562` | 100 Ko | 0 | 0,1 | 562 | 564 |
| `R562` | 100 Ko | 300 | 0,2 | 266 | 564 |
| `R562` | 100 Ko | 800 | -0,0 | 0,4 | 563 |

## Conditions

- `aucun` (aucune émulation) : aucune
- `L40` (emulateNetworkConditions, 40 ms) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 40, "downloadThroughput": -1, "uploadThroughput": -1}`
- `L562` (emulateNetworkConditions, 562,5 ms) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 562.5, "downloadThroughput": -1, "uploadThroughput": -1}`
- `S4G` (emulateNetworkConditions, Slow 4G) : `Network.emulateNetworkConditions` `{"offline": false, "latency": 562.5, "downloadThroughput": 188743.68, "uploadThroughput": 86400}`
- `R562` (emulateNetworkConditionsByRule, 562,5 ms) : `Network.emulateNetworkConditionsByRule` `{"matchedNetworkConditions": [{"urlPattern": "", "latency": 562.5, "downloadThroughput": -1, "uploadThroughput": -1}]}`
