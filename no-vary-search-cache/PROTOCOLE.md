# Protocole : No-Vary-Search et cache disque de Chrome selon le Cache-Control du HTML

Écrit le 2026-10-22, après trois essais exploratoires non publiés (mêmes cas, 3 passages), avant la série publiable.

## Question

Un HTML servi avec `No-Vary-Search: params=("utm_source")` : la navigation vers la même page avec une autre valeur
de `utm_source` réutilise-t-elle l'entrée du cache disque, selon le `Cache-Control` de la page ? Quand le cache
revalide l'entrée, quelle URL le serveur reçoit-il, et quelle URL la page voit-elle ?

## Banc

Serveur Node intégré (`banc.mjs`), port libre, HTTP/1.1. Chrome stable (`channel: 'chrome'`) piloté par
Playwright 1.64.1, sans interface, contexte neuf à chaque passage. Parcours : `goto('/p?utm_source=a')`, puis clic sur
un lien vers `/p?utm_source=b`. Le serveur journalise chaque requête et répond 304 à un `If-None-Match` qui égale son
`ETag`. Ordre des cas tourné à chaque passage ; 10 passages par cas. Aucune durée n'est mesurée (comptes de requêtes, type
de livraison, URL) : la charge du processeur est relevée dans `machine.txt` mais ne bloque pas le départ, à la
différence des bancs chronométrés du dépôt.

## Cas

Cinq `Cache-Control` avec l'en-tête (`max-age=600` ; aucun, avec `ETag` ; `no-cache` avec `ETag` ;
`max-age=0, must-revalidate` avec `ETag` ; `no-store` ; ni `Cache-Control` ni validateur, comme une page
WordPress sans extension de cache, cas ajouté le 2026-10-22 après relevé des en-têtes de WordPress 7.1.3), plus un témoin `max-age=600` sans `No-Vary-Search`.

## Mesures

Requêtes reçues par le serveur pour la seconde page (aucune, revalidation, ou requête complète) et URL demandée ;
Navigation Timing de la seconde page (`deliveryType`, `transferSize`) ; `location.search` lu dans la seconde page.

## Témoins

- Négatif : sans `No-Vary-Search`, la seconde page est redemandée en entier.
- Positif : avec `max-age=600`, la seconde page ne fait aucune requête.

## Syntaxe (`syntaxe.mjs`)

Ajouté le 2026-10-22 après lecture du brouillon IETF d'octobre 2026, qui déclare invalides `params` seul (booléen)
et la présence simultanée de `params` et `except`, et donne `except=()` et `except=("x")` comme formes valides. Six
valeurs de l'en-tête (`params`, `except=()`, `params, except=("page")`, `except=("page")`, `params=("utm_source")`,
absent), HTML en `max-age=600`, chacune sous un chemin propre (`/c<n>/p`). Deux parcours par valeur : seul
`utm_source` change, ou seul `page` change ; la seconde page est-elle servie sans requête ? Chrome stable par
Playwright 1.64.1 et Firefox installé par puppeteer-core (WebDriver BiDi), 5 passages, contexte neuf à chaque parcours.
