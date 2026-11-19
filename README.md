# Bancs webperf

Bancs de mesure reproductibles de l'Agence Web Performance : une question de performance
web par dossier, tranchée par une mesure qu'on peut rejouer. Chaque banc porte son
protocole (écrit avant la mesure), ses scripts exacts, ses données brutes et la synthèse
qui en tire chaque chiffre.

| Banc | Question |
|---|---|
| [`report-interaction/`](report-interaction/) | Reporter les scripts à la première interaction : gain au chargement, mesure d'audience perdue, gestes différés ou perdus (jQuery, GA4, Meta Pixel, WP Rocket Delay JS, chargeur AWP) |
| [`bridage-reseau-cdp/`](bridage-reseau-cdp/) | Bridage réseau du protocole DevTools (`emulateNetworkConditions`, `emulateNetworkConditionsByRule`) : la latence retarde-t-elle le TTFB, s'ajoute-t-elle au temps du serveur ? |
| [`no-vary-search-cache/`](no-vary-search-cache/) | `No-Vary-Search` : réutilisation du cache disque selon le `Cache-Control` du HTML, URL revalidée, syntaxes appliquées par Chrome et Firefox |
| [`lighthouse-13-6/`](lighthouse-13-6/) | Lighthouse 13.5.0 contre 13.6.0 sur un même relevé : écart de FCP, LCP et score, part de chaque changement de Lantern (modèle réseau et HTTP/3, `renderBlocking`, LCP texte, modules), audits `llms-txt`, `robots-txt`, `ard-schema`, ligne de commande en lot |
| [`reset-typographique/`](reset-typographique/) | Reset typographique CSS : `font-size-adjust: from-font` et bascule de police, réglages OpenType après `pyftsubset`, `text-box` sur le texte courant, jetons en `cqi`, `:heading`, `font-variation-settings` sur `*`, `font-variant-position`, limites de césure, `quotes` (Chrome, Firefox, WebKit) |
| [`images-de-fond-responsives/`](images-de-fond-responsives/) | Image de fond responsive : `image-set()`, media queries et préchargement, image téléchargée selon le DPR, une ou deux images selon la forme du préchargement, taille naturelle, requêtes de conteneur, propriétés personnalisées (Chrome, Firefox, WebKit) |
| [`composant-interactif-frameworks/`](composant-interactif-frameworks/) | Composant interactif (liste filtrable, favoris, tri) en Solid 2.0, Solid 1.9, Alpine 3.17 (rendu client et HTML serveur), React 19, Preact 11, Svelte 5, Vue 3.5 et Vapor (RC) : JavaScript livré, chargement, mémoire, durée des interactions (Chrome, processeur calibré) |
| [`dedoublonnage-declarations-css/`](dedoublonnage-declarations-css/) | Dédoublonner les déclarations CSS (UDJO, CSS Dedup) : gain après minification (Lightning CSS, cssnano, csso, clean-css), gzip et Brotli, sûreté de la cascade, règles appariées et tentatives d'appariement, recalcul de style et styles calculés d'une page Bootstrap (Chrome) |
| [`animations-thread-principal/`](animations-thread-principal/) | Une animation continue-t-elle pendant un blocage du thread principal ? CSS (`transform`, `left`, `@property`), Web Animations API, boucle `requestAnimationFrame`, GSAP 3.15 et Motion 14.14, position relevée image par image (Chrome) |
| [`minification-html-compression/`](minification-html-compression/) | Minification du HTML (projet Minifier Benchmarks, 127 pages réelles) : gain brut, après gzip 6 et Brotli 5 et 11, octets gagnés par page, éléments et texte perdus (icônes et liens vides retirés), part de `removeEmptyElements` et `removeUnusedCSS` |
| [`scripts-document-en-flux/`](scripts-document-en-flux/) | Document HTML envoyé en flux : un script `defer`, `async`, `type="module"` ou module `async` s'exécute-t-il avant la suite du document ? Report des scripts async par WebKit tant que la page n'a pas été peinte (Chrome, Firefox, WebKit) |

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
