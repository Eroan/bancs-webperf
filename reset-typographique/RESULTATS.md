# Résultats : reset typographique CSS

Série `serie-2026-11-05T20-43` : 3 passages, moteurs ci-dessous, Playwright 1.64.1, puppeteer-core 25.15.0, fonttools 4.65.0. Protocole : `PROTOCOLE.md`. Une plage signale une valeur qui a varié d'un passage à l'autre.

```
ProductName:		macOS
ProductVersion:		26.5.1
BuildVersion:		25F80
Apple M4 Max
Google Chrome 156.0.8078.80 
Mozilla Firefox 158.0
v25.9.0
Python 3.14.4
Chrome publié (macOS, stable) : 158.0.8127.18
Firefox publié : 159.0.1
```

## Bascule de police : `font-size-adjust`

Verdana servie à 1,5 s, repli Times New Roman, `font-display: swap`. Témoin : `document.fonts.status` à `loading` pendant, `loaded` après.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `none` : nombre calculé, pendant puis après | none → none | none → none | none → none |
| `none` : largeur de la ligne, pendant puis après (px) | 942.5 → 1202.7 | 942.7 → 1203 | 942.5 → 1202.7 |
| `none` : hauteur du paragraphe, pendant puis après (px) | 48 → 72 | 48 → 72 | 48 → 72 |
| `from-font` : nombre calculé, pendant puis après | 0.447266 → 0.54541 | 0.446875 → 0.545833 | 0.447266 → 0.54541 |
| `from-font` : largeur de la ligne, pendant puis après (px) | 942.5 → 1202.7 | 942.7 → 1203 | 942.5 → 1202.7 |
| `from-font` : hauteur du paragraphe, pendant puis après (px) | 48 → 72 | 48 → 72 | 48 → 72 |
| `0.545` : nombre calculé, pendant puis après | 0.545 → 0.545 | 0.545 → 0.545 | 0.545 → 0.545 |
| `0.545` : largeur de la ligne, pendant puis après (px) | 1148.1 → 1201.2 | 1119.4 → 1203 | 1148.5 → 1201.8 |
| `0.545` : hauteur du paragraphe, pendant puis après (px) | 72 → 72 | 72 → 72 | 72 → 72 |

## Héritage du nombre calculé par `from-font`

`body` en Verdana 16 px, `code` en Courier New, `h2` en Georgia 32 px.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `code`, `none` : largeur (px) | 124.8 | 124.8 | 124.8 |
| `code`, `from-font` : largeur (px) | 161 | 163.8 | 124.8 |
| `code`, `from-font` : nombre calculé | 0.54541 | 0.545833 | 0.422852 |
| `h2`, `none` : largeur (px) | 267.4 | 267.5 | 267.4 |
| `h2`, `from-font` : largeur (px) | 301.1 | 300.9 | 267.4 |
| `h2`, `from-font` : nombre calculé | 0.54541 | 0.545833 | 0.484375 |
| texte courant, `from-font` : largeur (px) | 109.4 | 109.4 | 109.4 |
| texte courant, `none` : largeur (px) | 109.4 | 109.4 | 109.4 |

## Sous-ensembles d'Inter : fonctionnalités et réglages CSS

Inter au commit `e1d6480102fed30739fead0faee463101f892c8f` de `google/fonts`, plage « occidentale large », woff2. Liste : `kern,liga,clig,calt,rlig,frac,ccmp,locl,rvrn,mark`.

| Fichier | Octets | Écart à `liste` | `tnum` | `subs`, `sups` | Axes |
|---|---|---|---|---|---|
| `tout` | 90768 | +33192 (+57.6 %) | oui | oui | opsz, wght |
| `defaut` | 58168 | +592 (+1.0 %) | non | non | opsz, wght |
| `liste` | 57576 | +0 (+0.0 %) | non | non | opsz, wght |
| `liste-tnum` | 59732 | +2156 (+3.7 %) | oui | non | opsz, wght |
| `liste-subs-sups` | 70160 | +12584 (+21.9 %) | non | oui | opsz, wght |
| `liste-opsz14` | 36892 | -20684 (-35.9 %) | non | non | wght |

Inter à 64 px, largeurs en px. `1111` et `0000` égaux avec `tabular-nums` = réglage actif. Mot témoin `Hamburgefonstiv` : `auto` et `none` différents = axe optique actif.

**Chrome 156.0.8078.80**

| Fichier | `1111` / `0000` | avec `tabular-nums` | `font-optical-sizing: auto` | `font-optical-sizing: none` |
|---|---|---|---|---|
| `tout` | 92.8 / 157 | 165 / 165 | 479.8 | 520.4 |
| `defaut` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste-tnum` | 92.8 / 157 | 165 / 165 | 479.8 | 520.4 |
| `liste-subs-sups` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste-opsz14` | 104.1 / 161.5 | 104.1 / 161.5 | 520.4 | 520.4 |

**Firefox 158.0**

| Fichier | `1111` / `0000` | avec `tabular-nums` | `font-optical-sizing: auto` | `font-optical-sizing: none` |
|---|---|---|---|---|
| `tout` | 92.7 / 157 | 165 / 165 | 479.8 | 520.4 |
| `defaut` | 92.7 / 157 | 92.7 / 157 | 479.8 | 520.4 |
| `liste` | 92.7 / 157 | 92.7 / 157 | 479.8 | 520.4 |
| `liste-tnum` | 92.7 / 157 | 165 / 165 | 479.8 | 520.4 |
| `liste-subs-sups` | 92.7 / 157 | 92.7 / 157 | 479.8 | 520.4 |
| `liste-opsz14` | 104.1 / 161.5 | 104.1 / 161.5 | 520.4 | 520.4 |

**WebKit 27.2 (Playwright)**

| Fichier | `1111` / `0000` | avec `tabular-nums` | `font-optical-sizing: auto` | `font-optical-sizing: none` |
|---|---|---|---|---|
| `tout` | 92.8 / 157 | 165 / 165 | 479.8 | 520.4 |
| `defaut` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste-tnum` | 92.8 / 157 | 165 / 165 | 479.8 | 520.4 |
| `liste-subs-sups` | 92.8 / 157 | 92.8 / 157 | 479.8 | 520.4 |
| `liste-opsz14` | 104.1 / 161.5 | 104.1 / 161.5 | 520.4 | 520.4 |

## `text-box: trim-both cap alphabetic` sur `p`, `li`, `h2`

Georgia 16 px, `line-height: 1.6`, marges de paragraphe de 1em. Captures : `textbox-sans`, `textbox-avec` (titre en `overflow: hidden`).

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| Paragraphe de 3 lignes, sans : hauteur (px) | 76.8 | 76.8 | 76.8 |
| Paragraphe de 3 lignes, avec : hauteur (px) | 62.3 | 62.3 | 62.3 |
| Pas entre deux paragraphes, sans (px) | 92.8 | 92.8 | 92.8 |
| Pas entre deux paragraphes, avec (px) | 78.3 | 78.3 | 78.3 |
| `li` d'une ligne, sans : hauteur (px) | 25.6 | 26.1 | 25.6 |
| `li` d'une ligne, avec : hauteur (px) | 11.1 | 11.1 | 11.1 |

Écart du pas entre deux paragraphes : Chrome 156.0.8078.80 -14.5 px ; Firefox 158.0 -14.5 px ; WebKit 27.2 (Playwright) -14.5 px.

## Feuille finale du billet appliquée telle quelle

`vendor/tidy-typography.css` (empreinte dans `SHA256SUMS`), fenêtre de 1400 px. Capture : `feuille-liste`.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `h1` : taille (px) | 64 | 64 | 64 |
| `h3` : taille (px) | 44 | 44 | 44 |
| `h6` : taille (px) | 44 | 44 | 44 |
| `p` : taille (px) | 18 | 18 | 18 |
| `blockquote` : taille (px) | 44 | 44 | 44 |
| `figcaption` : taille (px) | 44 | 44 | 44 |
| `li` : taille (px) | 18 | 18 | 18 |
| `li` d'une ligne : hauteur (px) | 12.5 | 12.5 | 12.5 |
| Pas entre deux `li` (px) | 12.5 | 12.5 | 12.5 |
| Lien de menu : hauteur (px) | 21 | 21 | 20.5 |

## Sélecteur `:heading`

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `CSS.supports('selector(:heading)')` | non | non | oui |
| `:heading, #liste` : règle appliquée à `#liste` | non | non | oui |
| `:is(:heading, h3), #pardonnant` : règle appliquée | oui | oui | oui |
| … et à `h3` | oui | oui | oui |
| `@supports selector(:heading)` : bloc appliqué | non | non | oui |
| `h2` correspond à `:heading` | SyntaxError | SyntaxError | oui |
| `role="heading"` correspond à `:heading` | SyntaxError | SyntaxError | non |

## `font-variation-settings` sur `*`

Inter, enfant d'un parent réglé. Largeur de l'enfant en px à 20 px.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| parent wght, sans * : réglage calculé de l'enfant | "wght" 900 | "wght" 900 | "wght" 900 |
| parent wght, avec * : réglage calculé de l'enfant | "GRAD" 0 | "GRAD" 0 | "GRAD" 0 |
| parent wght, règle sur body : réglage calculé de l'enfant | "wght" 900 | "wght" 900 | "wght" 900 |
| parent font-weight, avec * : réglage calculé de l'enfant | "GRAD" 0 | "GRAD" 0 | "GRAD" 0 |
| parent wght, sans * : largeur (px) | 219.2 | 219.2 | 219.2 |
| parent wght, avec * : largeur (px) | 203.5 | 203.5 | 203.5 |
| parent wght, règle sur body : largeur (px) | 219.2 | 219.2 | 219.2 |
| parent font-weight, avec * : largeur (px) | 219.2 | 219.2 | 219.2 |
| `"FILL" 1` sur le parent, avec `*` : réglage calculé de l'enfant | "GRAD" 0 | "GRAD" 0 | "GRAD" 0 |
| `"FILL" 1` sur le parent, sans `*` : réglage calculé de l'enfant | "FILL" 1 | "FILL" 1 | "FILL" 1 |

## `font-variant-position` sur `sub` et `sup`

Règle `@supports` du billet. Largeur d'un `2` à 36 px en px : courant, puis en `sub`. Indice égal au chiffre courant = à plat, ni réduit ni déplacé (voir captures `position-regle`). Défaut : sans la règle.

| Police (courant / indice par défaut / indice avec la règle) | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| Arial | 20.03 / 16.69 / 20.03 | 20.02 / 16.68 / 14.45 | 20.02 / 16.68 / 20.02 |
| STIX Two Text | 17.83 / 14.86 / 13.44 | 17.82 / 14.85 / 13.43 | 17.82 / 14.85 / 13.43 |
| Inter tout | 20.2 / 17 / 13.88 | 20.2 / 17 / 13.87 | 20.2 / 16.99 / 13.87 |
| Inter liste | 20.2 / 17 / 20.2 | 20.2 / 17 / 14.58 | 20.2 / 16.99 / 20.2 |

## Jetons `clamp()` en `cqi`

Conteneur de 300 px, fenêtre de 1400 px. `--step-0: clamp(1rem, .9rem + 1cqi, 1.125rem)`, `--step-3: clamp(2rem, 1.6rem + 3cqi, 2.75rem)`. Tailles calculées en px.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| Titre en `var(--step-3)`, hors conteneur | 44 | 44 | 44 |
| Titre en `var(--step-3)`, dans le conteneur | 34.6 | 34.6 | 34.6 |
| Paragraphe hors conteneur, `body` en `var(--step-0)` | 18 | 18 | 18 |
| Paragraphe dans le conteneur, taille héritée de `body` | 18 | 18 | 18 |
| Paragraphe dans le conteneur, redéclare `var(--step-0)` | 17.4 | 17.4 | 17.4 |
| Jeton enregistré par `@property`, dans le conteneur | 44 | 44 | 44 |
| Le conteneur lui-même en `var(--step-3)` | 44 | 44 | 44 |

## `quotes`

Rendu : captures `quotes-defaut`, `quotes-billet`, `quotes-corrige`. La ligne française du billet écrit `\\00202F` : une barre oblique inverse échappée, suivie du texte `00202F`.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| Défaut : valeur calculée (fr) | auto | auto | auto |
| Billet : valeur calculée (fr) | "«\\00202F" "\\00202F»" "\"" "\"" | "«\\00202F" "\\00202F»" "\"" "\"" | "«\\00202F" "\\00202F»" "\"" "\"" |
| Corrigé : valeur calculée (fr) | "« " " »" "“" "”" | "« " " »" "“" "”" | "« " " »" "“" "”" |
| Corrigé : valeur calculée (en) | auto | auto | auto |
| Défaut : largeur du `q` français (px) | 293.2 | 293.1 | 293.1 |
| Billet : largeur du `q` français (px) | 509.1 | 509.1 | 509.1 |
| Corrigé : largeur du `q` français (px) | 290.3 | 294.7 | 294.7 |

## Césure

Boîte de 130 px, Georgia 16 px, `scrollWidth` en px : 130 = pas de débordement.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| manual, lang=fr | 184 | 184 | 184 |
| auto, lang=fr | 130 | 130 | 130 |
| auto, lang=fr, majuscule | 130 | 187 | 130 |
| auto, lang=de, majuscule | 130 | 130 | 130 |
| auto, sans lang | 184 | 184 | 184 |
| auto, lang=fr, hyphenate-limit-chars: 30 | 184 | 184 | 184 |
| auto, lang=fr, majuscule, break-word | 130 | 130 | 130 |
| auto, lang=fr, majuscule, anywhere | 130 | 130 | 130 |
| Cellule de tableau dans 40 px, `break-word` : largeur (px) | 167.1 | 167.1 | 167.1 |
| Cellule de tableau dans 40 px, `anywhere` : largeur (px) | 36 | 36 | 36 |

## Prise en charge déclarée (`CSS.supports`)

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `display: block` | oui | oui | oui |
| `hyphenate-limit-chars: 6 3 3` | oui | oui | oui |
| `hyphenate-character: "x"` | oui | oui | oui |
| `hyphenate-limit-lines: 2` | non | non | oui |
| `hyphenate-limit-zone: 8%` | non | non | non |
| `hyphenate-limit-last: always` | non | non | non |
| `-webkit-hyphenate-limit-before: 4` | non | non | oui |
| `-webkit-hyphenate-limit-lines: 2` | non | non | oui |
| `hanging-punctuation: first allow-end last` | non | non | oui |
| `text-wrap: pretty` | oui | non | oui |
| `text-wrap: stable` | oui | oui | oui |
| `text-box: trim-both cap alphabetic` | oui | oui | oui |
| `font-variant-emoji: text` | oui | oui | non |
| `font-variant-position: sub` | oui | oui | oui |
| `font-size-adjust: from-font` | oui | oui | oui |
| `text-size-adjust: none` | oui | non | non |
| `-webkit-text-size-adjust: none` | oui | oui | non |
| `-webkit-font-smoothing: antialiased` | oui | oui | oui |

Valeurs calculées sans aucune règle :

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `font-optical-sizing` | auto | auto | auto |
| `font-kerning` | auto | auto | auto |
| `font-variant-ligatures` | normal | normal | normal |
| `text-decoration-skip-ink` | auto | auto | auto |
| `text-rendering` | auto | auto | auto |

## `text-rendering` et `font-kerning`

Times New Roman 16 px, `AVAVAV To Ty We fi fl office`, largeur en px.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| defaut | 192.66 | 193.85 | 193.52 |
| optimizeLegibility | 192.66 | 193.85 | 193.52 |
| font-kerning: normal | 192.66 | 192.72 | 193.52 |
| font-kerning: none | 207.94 | 207.92 | 207.93 |

## Texte publié : `extraits/bloc-recommande.css`

Page `lang="fr-FR"`. Capture : `bloc`.

| Mesure | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| Titre : `text-wrap-style` | balance | balance | balance |
| Titre : `hyphens` | manual | manual | manual |
| Paragraphe d'article : `text-wrap-style` | pretty | auto | pretty |
| Paragraphe d'article : `hyphens` | auto | auto | auto |
| Paragraphe d'article : `hyphenate-limit-chars` | 6 3 3 | 6 3 | 6 3 |
| Paragraphe d'article : `overflow-wrap` | break-word | break-word | break-word |
| Paragraphe de 130 px à mot long : `scrollWidth` (px) | 130 | 130 | 130 |
| `li` d'article : `hyphens` | auto | auto | auto |
| `code` dans un paragraphe d'article : `hyphens` | manual | manual | manual |
| Texte voisin du `code` : `hyphens` | auto | auto | auto |
| Paragraphe avec une classe seule (`hyphens: none`) | none | none | none |
| Paragraphe hors article : `hyphens` | manual | manual | manual |
| Tableau : `font-variant-numeric` | tabular-nums | tabular-nums | tabular-nums |
| `q` français : `quotes` | "« " " »" "“" "”" | "« " " »" "“" "”" | "« " " »" "“" "”" |
| `q` anglais dans la page française : `quotes` | auto | auto | auto |

## Texte publié : `extraits/console-support.js`

Vrai = pris en charge par le navigateur ouvert.

| Déclaration | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
|---|---|---|---|
| `hyphenate-limit-chars: 6 3 3` | oui | oui | oui |
| `hyphenate-limit-lines: 2` | non | non | oui |
| `hyphenate-limit-zone: 8%` | non | non | non |
| `hyphenate-limit-last: always` | non | non | non |
| `hanging-punctuation: first` | non | non | oui |
| `text-wrap: pretty` | oui | non | oui |
| `text-box: trim-both cap alphabetic` | oui | oui | oui |
| `font-variant-emoji: text` | oui | oui | non |
| `:heading` | non | non | oui |

