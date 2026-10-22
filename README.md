# Bancs webperf

Bancs de mesure reproductibles de l'Agence Web Performance : une question de performance
web par dossier, tranchée par une mesure qu'on peut rejouer. Chaque banc porte son
protocole (écrit avant la mesure), ses scripts exacts, ses données brutes et la synthèse
qui en tire chaque chiffre.

| Banc | Question |
|---|---|
| [`report-interaction/`](report-interaction/) | Reporter les scripts à la première interaction : gain au chargement, mesure d'audience perdue, gestes différés ou perdus (jQuery, GA4, Meta Pixel, WP Rocket Delay JS, chargeur AWP) |
| [`bridage-reseau-cdp/`](bridage-reseau-cdp/) | Bridage réseau du protocole DevTools (`emulateNetworkConditions`, `emulateNetworkConditionsByRule`) : la latence retarde-t-elle le TTFB, s'ajoute-t-elle au temps du serveur ? |

## Principes communs

- Une variable à la fois, variantes alternées, contexte de navigateur neuf à chaque passage.
- Instruments prouvés avant la série : témoin de durée connue, bridage constaté par son effet.
- Processeur bridé par **calibrage** sur l'indice de Lighthouse mesuré dans la page, jamais
  par le ×4 par défaut : sur un poste récent, ×4 donne un mobile haut de gamme.
- Durées en médiane [min, max] sur dix passages au moins ; proportions en « n/N » avec leur critère.
- Machine au repos : chaque lanceur refuse de démarrer sous charge.
- Rien ne sort de la machine : les appels de mesure vers des tiers sont interceptés.
- Code tiers non redistribuable (balises Google, Meta) : jamais dans le dépôt ; un script le
  récupère et compare son empreinte à celle de la série de référence.

## Licence

Code du dépôt : MIT (voir `LICENSE`). Le code tiers récupéré par les scripts garde sa
propre licence et n'est pas redistribué.
