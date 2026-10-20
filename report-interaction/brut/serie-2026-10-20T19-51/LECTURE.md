# Lecture de la série du 2026-10-20 (19 h 51 à 22 h 48)

Chiffres recopiés de `RESULTATS.md` (produit par `synthese.py` sur les JSON bruts de ce dossier).
Deux niveaux de processeur : ×9 (indice 450, mobile milieu de gamme visé par Lighthouse) et
×22 (indice 172, équivalent des machines de PageSpeed Insights). Réseau Slow 4G. 10 passages
par parcours, variante et niveau ; médiane [min, max].

## Validité de la série

- 254 passages par niveau, 0 erreur JavaScript, 0 geste en échec, gestes à l'heure prévue
  (écart 1 ms [-5, 3]).
- Témoin de 100 ms : traitement 104 ms [103, 107] à ×9, 110 ms [105, 113] à ×22 (8/8 dans
  la plage attendue à chaque niveau).
- Machine : processeur inactif à 90,5 à 96,4 % aux points de relevé, sauf 73,4 % juste après
  la fin de la série ×9 (fermeture du Chrome du banc, avant le témoin ×22).

## Chargement, visiteur sans geste

| | A classique | B defer | C report des tiers | E report hors mesure | D tout reporter (WP Rocket) |
|---|---|---|---|---|---|
| LCP ×9 / ×22 | 1 736 / 1 906 ms | 1 522 / 1 574 ms | 1 524 / 1 572 ms | 1 526 / 1 576 ms | 1 540 / 1 566 ms |
| Thème prêt ×9 / ×22 | 2 298 / 2 546 ms | 2 759 / 3 220 ms | 2 296 / 2 548 ms | 2 472 / 2 713 ms | jamais sans geste |
| Blocage FCP à 10 s, ×9 / ×22 | 352 / 1 300 ms | 324 / 1 290 ms | 127 / 476 ms | 130 / 623 ms | 0 / 0 ms |
| GA4 page_view ×9 / ×22 | 4,3 / 4,9 s | 4,2 / 4,7 s | 9,9 / 10,4 s | 3,5 / 3,8 s | jamais (0/10) |
| Meta PageView ×9 / ×22 | 4,0 / 4,9 s | 3,9 / 4,8 s | 11,6 / 12,0 s | 11,8 / 12,2 s | jamais (0/10) |

- **Le report des tiers ne change pas le LCP** de cette page par rapport au seul `defer` :
  B, C, E et D sont à 20 ms près. Le gain de LCP vient du `defer` (jQuery bloquant en A).
- **`defer` seul retarde le thème** (+460 ms à ×9, +670 ms à ×22 par rapport à A) quand des
  tiers `async` le concurrencent ; reporter les tiers (C) ramène le thème au niveau de A.
  Explication la plus probable, non démontrée par une mesure dédiée : concurrence pour la bande
  passante Slow 4G et pour le fil principal avant `DOMContentLoaded` (E, qui ne garde que GA4 en
  `async`, se place entre B et C).
- **Mesure d'audience** : en C, un visiteur qui part avant 5 s n'est jamais compté (0/10 aux
  deux niveaux), avant 10 s non plus à ×22 (0/10). E compte tous les visiteurs dès 5 s, et
  plus tôt que A et B. D ne compte aucun visiteur sans geste, quelle que soit la durée.

## Gestes

- **Tap à 2 s sur la FAQ** : perdu dans A, B, C et E (10/10 à chaque niveau), le thème n'étant
  pas prêt. En D, il est rejoué après le chargement complet : effet à 2 410 ms [2 402, 2 434]
  à ×9, 3 502 ms [3 428, 3 668] à ×22.
- **En D, le délai ne dépend pas du moment du geste** : rien ne se charge avant le premier
  geste, donc un tap à 7 s attend autant qu'un tap à 2 s (FAQ 2 418 ms à ×9, 3 502 ms à ×22 ;
  menu 0,9 s à ×9, 2,0 s à ×22).
- **L'INP ne voit pas ce retard** : en D, l'interaction interceptée dure 16 à 32 ms selon
  l'Event Timing, alors que l'effet arrive 0,9 à 3,5 s plus tard.
- **Tap à 4 s, ×22** : FAQ immédiate en C et E (36 et 32 ms ; Event Timing 72 et 68 ms),
  dégradée en A (188 ms [159, 378], 2/10 au-delà de 200 ms ; Event Timing 224 ms) et en B
  (218 ms, 9/10 au-delà de 200 ms ; Event Timing 260 ms) : les tiers s'exécutent à ce moment.
- **Défilement puis double tap sur le menu** : en D, le menu n'est jamais vu ouvert (0/10 aux
  deux niveaux) : les deux taps sont rejoués ensemble, ouverture et fermeture dans la même
  image. En B, le premier tap (2,5 s) précède le thème (2,76 s) et se perd ; le second ouvre
  le menu au lieu de le fermer (fermé à la fin : 0/10).

## Lighthouse (aucun geste, throttling simulé)

| Score ×9 / ×22 | A 98 / 85 | B 98 / 84 | C 100 / 100 | E 96 / 92 | D 100 / 100 |
|---|---|---|---|---|---|

TBT à ×22 : A 568 ms, B 576 ms, C 24 ms, E 205 ms, D 0 ms. Lighthouse ne fait aucun geste :
il note D à 100 alors que D ne mesure aucun visiteur sans geste et diffère chaque premier geste
de 0,9 à 3,5 s. Le LCP simulé de E (2 734 ms à ×9) s'écarte des autres sans que le LCP mesuré
dans le navigateur ne bouge (1 526 ms) : artefact du modèle de simulation (Lantern), non
expliqué ; le LCP observé par Lighthouse sur cette page locale non bridée est de 32 à 38 ms.

## Limites

Une page, un navigateur (Chrome 155), HTTP/1.1 local, chat synthétique, identifiants GA4 et
Pixel fictifs. Les gestes perdus avant que le thème soit prêt existent dans toutes les variantes
sauf D : leur parade (comportement critique sans dépendre du chargement des scripts) n'est pas
mesurée ici.
