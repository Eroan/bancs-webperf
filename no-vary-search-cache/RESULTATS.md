# Résultats : No-Vary-Search et cache disque de Chrome

Série `serie-2026-10-22T15-20` : Chrome 155.0.8059.85, Playwright 1.64.1, 10 passages par cas. Parcours : chargement de `/p?utm_source=a`, puis clic vers `/p?utm_source=b`, contexte neuf à chaque passage. Protocole : `PROTOCOLE.md`.

| Cas (en-têtes du HTML) | 2e page sans requête au serveur | 2e page par revalidation (304) | URL redemandée à la revalidation | 2e page redemandée en entier | `deliveryType` de la 2e page | `transferSize` | `location.search` côté page |
|---|---|---|---|---|---|---|---|
| max-age=600 | 10/10 | 0/10 | — | 0/10 | `cache` | 0 | `?utm_source=b` |
| sans Cache-Control, ETag | 0/10 | 10/10 | `/p?utm_source=a` | 0/10 | `cache` | 300 | `?utm_source=b` |
| no-cache, ETag | 0/10 | 10/10 | `/p?utm_source=a` | 0/10 | `cache` | 300 | `?utm_source=b` |
| max-age=0, must-revalidate, ETag | 0/10 | 10/10 | `/p?utm_source=a` | 0/10 | `cache` | 300 | `?utm_source=b` |
| no-store | 0/10 | 0/10 | — | 10/10 | `""` | 394 | `?utm_source=b` |
| sans Cache-Control ni validateur (WordPress par défaut) | 0/10 | 0/10 | — | 10/10 | `""` | 394 | `?utm_source=b` |
| témoin : max-age=600 sans No-Vary-Search | 0/10 | 0/10 | — | 10/10 | `""` | 394 | `?utm_source=b` |

## En-têtes servis par cas

- max-age=600 : `Cache-Control: max-age=600` ; `No-Vary-Search: params=("utm_source")`
- sans Cache-Control, ETag : `ETag: "v1"` ; `No-Vary-Search: params=("utm_source")`
- no-cache, ETag : `Cache-Control: no-cache` ; `ETag: "v1"` ; `No-Vary-Search: params=("utm_source")`
- max-age=0, must-revalidate, ETag : `Cache-Control: max-age=0, must-revalidate` ; `ETag: "v1"` ; `No-Vary-Search: params=("utm_source")`
- no-store : `Cache-Control: no-store` ; `No-Vary-Search: params=("utm_source")`
- sans Cache-Control ni validateur (WordPress par défaut) : `No-Vary-Search: params=("utm_source")`
- témoin : max-age=600 sans No-Vary-Search : `Cache-Control: max-age=600`

## Syntaxe : valeurs appliquées par chaque moteur

Moteurs : Chrome 155.0.8059.85, Firefox 158.0 (Firefox par puppeteer-core en WebDriver BiDi) ; 5 passages. HTML en `Cache-Control: max-age=600`. Parcours : `?utm_source=a&page=1`, puis clic vers la même page où seul `utm_source` change (`?utm_source=b&page=1`) ou seul `page` change (`?utm_source=a&page=2`). « cache » : aucune requête au serveur pour la seconde page.

| Moteur | `No-Vary-Search` | seul `utm_source` change | seul `page` change |
|---|---|---|---|
| Chrome 155.0.8059.85 | `params` | cache 5/5 | cache 5/5 |
| Chrome 155.0.8059.85 | `except=()` | cache 0/5 | cache 0/5 |
| Chrome 155.0.8059.85 | `params, except=("page")` | cache 5/5 | cache 0/5 |
| Chrome 155.0.8059.85 | `except=("page")` | cache 0/5 | cache 0/5 |
| Chrome 155.0.8059.85 | `params=("utm_source")` | cache 5/5 | cache 0/5 |
| Chrome 155.0.8059.85 | (absent) | cache 0/5 | cache 0/5 |
| Firefox 158.0 | `params` | cache 5/5 | cache 5/5 |
| Firefox 158.0 | `except=()` | cache 0/5 | cache 0/5 |
| Firefox 158.0 | `params, except=("page")` | cache 5/5 | cache 0/5 |
| Firefox 158.0 | `except=("page")` | cache 0/5 | cache 0/5 |
| Firefox 158.0 | `params=("utm_source")` | cache 5/5 | cache 0/5 |
| Firefox 158.0 | (absent) | cache 0/5 | cache 0/5 |
