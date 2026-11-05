# Protocole : reset typographique CSS, ce qui agit et ce qui reste inerte

Écrit le 2026-11-05, après un banc de tri non publié (`font-size-adjust`, `text-box`, `:heading`, `quotes`, césure), avant la
série publiable. Point de départ : la feuille `tidy-typography.css` du billet « Taming Typography with a Modern CSS Reset »
(Stu Robson, CSS-Tricks, 5 novembre 2026), présentée comme se dégradant sans dommage là où une déclaration n'est pas prise en charge.

## Questions

1. `font-size-adjust: from-font` réduit-il le saut de la bascule de police, et que change-t-il aux autres familles ?
2. `tabular-nums`, `font-variant-position` et `font-optical-sizing` survivent-ils à un sous-ensemble produit par `pyftsubset` ?
3. `text-box: trim-both cap alphabetic` sur `p` et `li` est-il neutre pour la mise en page ?
4. Un jeton `clamp()` en `cqi` suit-il le conteneur dans tous les cas ?
5. Le reste de la feuille : sélecteur `:heading`, `font-variation-settings` sur `*`, `font-variant-position` sur `sub` et `sup`,
   limites de césure, `quotes`, valeurs déjà initiales.

## Banc

Serveur Node intégré (`banc.mjs`), port libre, HTTP/1.1, polices en `no-store`. Trois moteurs : Chrome stable installé (Playwright,
`channel: 'chrome'`), Firefox stable installé (puppeteer-core, WebDriver BiDi), WebKit de Playwright. WebKit de Playwright n'est pas
Safari publié : son résultat se lit avec les données de compatibilité et le code. Fenêtre de 1400 × 900 px, sans interface. Trois
passages, ordre des moteurs et des variantes tourné, navigateur relancé pour chaque groupe et, pour la bascule de police, pour chaque
variante, avec une URL de police unique : un même Firefox garde la police d'une variante à l'autre malgré `no-store`.

Aucune durée n'est mesurée (largeurs, hauteurs, valeurs calculées, prise en charge) : la charge du processeur est relevée dans
`machine.txt` mais ne bloque pas le départ, à la différence des bancs chronométrés du dépôt. Une valeur qui varie d'un passage à
l'autre s'imprime en plage dans `RESULTATS.md`.

## Polices

Polices système de macOS lues par chemin, jamais copiées : Verdana, Times New Roman, Georgia, Courier New, Arial, STIX Two Text.
Inter (`Inter[opsz,wght].ttf`, licence OFL, dépôt `google/fonts` au commit épinglé dans `polices.py`) téléchargée et contrôlée par
empreinte. Sous-ensembles produits par `polices.py` (plage « occidentale large », `pyftsubset`, woff2) : tout (`*`), liste par défaut,
liste `kern,liga,clig,calt,rlig,frac,ccmp,locl,rvrn,mark`, la même plus `tnum`, la même plus `subs,sups`, et la même avec `opsz` figé
à 14. Le fichier produit n'est pas commité (`polices/`) ; ses octets et ses fonctionnalités sont dans `brut/`.

La feuille du billet n'est pas redistribuée : `recuperer-feuille.mjs` la lit sur la page et compare son empreinte à `SHA256SUMS`.

## Groupes et témoins

| Groupe | Mesure | Témoin (le banc échoue sinon) |
|---|---|---|
| `bascule` | Verdana servie à 1,5 s, repli Times New Roman ; `none`, `from-font`, `0.545` : largeur d'une ligne, hauteur d'un paragraphe de 500 px, nombre calculé, pendant puis après | `document.fonts.status` à `loading` pendant, `loaded` après ; `none` change de largeur |
| `heritage` | `body` en Verdana, `code` en Courier New, `h2` en Georgia ; `none` contre `from-font` | `none` calculé `none` sur `code` |
| `opentype` | Inter à 64 px : `1111` et `0000` avec et sans `tabular-nums` ; mot témoin avec `font-optical-sizing: auto` et `none` | police chargée ; `*` aligne les chiffres |
| `textbox` | Georgia 16 px / 1.6 : hauteur et pas des paragraphes, hauteur d'un `li` ; capture d'un titre en `overflow: hidden` | `text-box-trim` calculé `trim-both` avec la règle, `none` sans |
| `feuille` | Feuille du billet : tailles calculées, pas entre deux `li` d'une ligne, hauteur d'un lien de menu | empreinte de la feuille |
| `selecteurs` | `:heading, p`, `:is(:heading, h2), p`, `@supports selector(:heading)`, `role="heading"` | règle `p` seule appliquée |
| `variation` | Inter : parent en `font-variation-settings: "wght" 900`, avec et sans `*`, sur `body` ; parent en `font-weight: 900` avec `*` | sans `*`, l'enfant garde `"wght" 900` |
| `position` | Règle `@supports` du billet : largeur d'un `2` en `sub` contre un `2` courant, Arial, STIX Two Text, Inter tout, Inter liste | indice du navigateur plus étroit que le chiffre courant |
| `cqi` | Conteneur de 300 px : titre, paragraphe hérité, paragraphe qui redéclare, jeton enregistré, conteneur lui-même | hors conteneur différent de dans le conteneur |
| `quotes` | Défaut, lignes du billet, règle corrigée : valeur calculée, largeur, capture | `q` français et anglais présents |
| `cesure` | `anticonstitutionnellement` dans 130 px : `scrollWidth` selon `hyphens`, `lang`, majuscule, `hyphenate-limit-chars`, `overflow-wrap` ; largeur d'une cellule de tableau | `hyphens: manual` déborde |
| `support` | `CSS.supports` des déclarations de la feuille ; valeurs initiales | `display: block` pris en charge |
| `rendu` | Times New Roman 16 px : largeur selon `text-rendering` et `font-kerning` | `font-kerning: none` plus large |
| `bloc` | Texte publié (`extraits/bloc-recommande.css`, `extraits/console-support.js`) sur une page `lang="fr-FR"` | une classe seule l'emporte sur le bloc |

## Limites

Un seul poste (macOS), peu de polices. Safari publié, Chrome sur Android et Safari sur iOS ne sont pas testés. Le découpage visuel
(`overflow: hidden`, guillemets) se lit sur les captures de `brut/`.
