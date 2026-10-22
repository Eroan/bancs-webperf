# Protocole : ce que retarde le bridage réseau du protocole DevTools

Écrit le 2026-10-22, avant la série publiable. Méthode : article « Banc comparatif
reproductible » du wiki technique interne de l'agence (`banc-comparatif-reproductible-mesurer-des-variantes`).

## Question

Un banc qui bride le réseau par le protocole DevTools (`Network.emulateNetworkConditions`,
obsolète, ou `Network.emulateNetworkConditionsByRule`, qui le remplace) : quelles grandeurs
la latence et le débit demandés retardent-ils réellement ?

1. Le TTFB de Navigation Timing (`responseStart`) inclut-il la latence demandée ?
2. La latence s'ajoute-t-elle au temps du serveur, ou n'est-elle qu'un **minimum** compté
   depuis l'envoi de la requête (« Minimum latency from request sent to response headers
   received », description du protocole de Chrome 155) ?
3. Les deux méthodes donnent-elles le même résultat ?

Hypothèse tirée du code de Chromium 155.0.8059.85 (`services/network/throttling/`) :
`ThrottlingNetworkTransaction` retient la livraison des en-têtes jusqu'à `send_end` + latence,
mais `GetLoadTimingInfo` renvoie les horodatages de la transaction réelle. `responseStart`
garderait donc l'arrivée réelle des en-têtes, et la latence ne retarderait rien quand le
serveur répond plus lentement qu'elle.

## Page

Serveur local Node (`serveur.mjs`), HTTP/1.1 sans compression, `Cache-Control: no-store`,
port libre choisi à l'exécution. Document HTML de 2 Ko ou de 100 Ko (variable `taille`),
dont les en-têtes partent après un délai serveur fixe (variable `delai` : 0, 300 ou 800 ms),
et qui charge une image de 2 Ko servie sans délai.

## Conditions (une seule variable à la fois)

| Code | Méthode | Latence | Débit descendant / montant |
|---|---|---|---|
| `aucun` | aucune émulation | | |
| `L40` | `emulateNetworkConditions` | 40 ms | illimité |
| `L562` | `emulateNetworkConditions` | 562,5 ms | illimité |
| `S4G` | `emulateNetworkConditions` | 562,5 ms | Slow 4G de Lighthouse : 1 474,56 / 675 kbit/s |
| `R562` | `emulateNetworkConditionsByRule`, règle globale (`urlPattern` vide) | 562,5 ms | illimité |

Croisées avec `delai` ∈ {0, 300, 800} ms et `taille` ∈ {2, 100} Ko.

## Fixe

- Chrome stable (`channel: 'chrome'`) piloté par Playwright 1.64.1, sans interface, contexte
  neuf à chaque chargement, session CDP ouverte sur la page avant la navigation,
  `Network.enable` puis la condition, puis `page.goto(…, { waitUntil: 'load' })`.
- Ordre des conditions tourné à chaque passage ; 10 passages.
- Machine au repos : le lanceur refuse de démarrer si le processeur est inactif à moins de 85 %.

## Mesures (par chargement)

- Navigation Timing du document : `requestStart`, `responseStart`, `responseEnd`, `domInteractive`.
- Resource Timing de l'image : `requestStart`, `responseStart`, `responseEnd`.
- CDP, document : `Network.responseReceived` (horodatage de l'événement, et
  `timing.receiveHeadersStart`), relatif à `Network.requestWillBeSent`.
- Serveur : instant d'envoi des en-têtes, relatif à la réception de la requête.

## Témoins

- Positif : sous `L562` et `delai` 0, l'événement `responseReceived` doit arriver au moins
  562 ms après `requestWillBeSent` (l'émulation s'applique).
- Négatif : sous `aucun`, `responseStart − requestStart` doit rejoindre le délai serveur
  (à quelques ms près) : l'instrument lit le temps du serveur.

## Sortie

`brut/serie-<date>/mesures.json`, versions et état de la machine à côté ; `synthese.py`
imprime chaque chiffre repris dans `RESULTATS.md` (médiane [min, max] sur 10 chargements).
