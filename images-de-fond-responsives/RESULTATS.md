# Résultats : image de fond responsive

Série `serie-2026-11-06T15-29`, 3 passages, délai serveur de 120 ms par image, images en `max-age=3600`. départ 2026-11-06 15:29:11 ; processeur inactif : 67.72 %.
Moteurs : Chrome 156.0.8078.80, Firefox 158.0, WebKit 27.2 (Playwright). Tous les témoins du protocole sont passés (le banc sort en 1 sinon).

```text
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

## 1. Image demandée selon le DPR

Journal du serveur. Une ligne regroupe `image-set()`, `<img srcset>` et `<link rel=preload imagesrcset>` quand les trois moteurs et les trois techniques donnent le même fichier (`dN` = fichier de densité N).

Jeu `1x-2x` :

| DPR | Image demandée | Moteurs et techniques |
| --- | --- | --- |
| 1 | `d1.jpg` | 3 moteurs, 3 techniques : identique |
| 1,25 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 1,5 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 2 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 2,625 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 3 | `d2.jpg` | 3 moteurs, 3 techniques : identique |

Jeu `1x-1.5x-2x` :

| DPR | Image demandée | Moteurs et techniques |
| --- | --- | --- |
| 1 | `d1.jpg` | 3 moteurs, 3 techniques : identique |
| 1,25 | `d1.5.jpg` | 3 moteurs, 3 techniques : identique |
| 1,5 | `d1.5.jpg` | 3 moteurs, 3 techniques : identique |
| 2 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 2,625 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 3 | `d2.jpg` | 3 moteurs, 3 techniques : identique |

Jeu `1x-2x-3x` :

| DPR | Image demandée | Moteurs et techniques |
| --- | --- | --- |
| 1 | `d1.jpg` | 3 moteurs, 3 techniques : identique |
| 1,25 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 1,5 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 2 | `d2.jpg` | 3 moteurs, 3 techniques : identique |
| 2,625 | `d3.jpg` | 3 moteurs, 3 techniques : identique |
| 3 | `d3.jpg` | 3 moteurs, 3 techniques : identique |

## 2. Préchargement et fond CSS : une ou deux images

`FORME` : `sans-preload` (témoin, CSS en media queries) ; `densite` (`imagesrcset` en `x`, `image-set()`) ; `largeur-imagesizes` (`imagesrcset` en `w` + `imagesizes="100vw"`, CSS en media queries) ; `href-seul` (préchargement de l'image de bureau, CSS en media queries) ; `media` (un préchargement `href` + `media` par point de rupture, mêmes media queries) ; `media-densite` (`media` + `imagesrcset` en `x`, media queries + `image-set()`) ; `media-densite-type` (idem, AVIF, `type="image/avif"`, `image-set()` à `type()`).

`sans-preload` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@2 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@3 | `hero-800.jpg` | 1 | 3 moteurs |
| 412x915@2,625 | `hero-800.jpg` | 1 | 3 moteurs |
| 1400x900@1 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `hero-1600.jpg` | 1 | 3 moteurs |

`densite` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-1x.jpg` | 1 | 3 moteurs |
| 400x800@2 | `hero-2x.jpg` | 1 | 3 moteurs |
| 400x800@3 | `hero-2x.jpg` | 1 | 3 moteurs |
| 412x915@2,625 | `hero-2x.jpg` | 1 | 3 moteurs |
| 1400x900@1 | `hero-1x.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `hero-2x.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `hero-2x.jpg` | 1 | 3 moteurs |

`largeur-imagesizes` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@2 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@3 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 412x915@2,625 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 1400x900@1 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `hero-1600.jpg` | 1 | 3 moteurs |

`href-seul` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 400x800@2 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 400x800@3 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 412x915@2,625 | `hero-1600.jpg` + `hero-800.jpg` | 2 | 3 moteurs |
| 1400x900@1 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `hero-1600.jpg` | 1 | 3 moteurs |

`media` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@2 | `hero-800.jpg` | 1 | 3 moteurs |
| 400x800@3 | `hero-800.jpg` | 1 | 3 moteurs |
| 412x915@2,625 | `hero-800.jpg` | 1 | 3 moteurs |
| 1400x900@1 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `hero-1600.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `hero-1600.jpg` | 1 | 3 moteurs |

`media-densite` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `mob-1x.jpg` | 1 | 3 moteurs |
| 400x800@2 | `mob-2x.jpg` | 1 | 3 moteurs |
| 400x800@3 | `mob-2x.jpg` | 1 | 3 moteurs |
| 412x915@2,625 | `mob-2x.jpg` | 1 | 3 moteurs |
| 1400x900@1 | `bur-1x.jpg` | 1 | 3 moteurs |
| 1400x900@1,25 | `bur-2x.jpg` | 1 | 3 moteurs |
| 1400x900@2 | `bur-2x.jpg` | 1 | 3 moteurs |

`media-densite-type` :

| Fenêtre @ DPR | Requêtes | Nombre | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `mob-1x.avif` | 1 | 3 moteurs |
| 400x800@2 | `mob-2x.avif` | 1 | 3 moteurs |
| 400x800@3 | `mob-2x.avif` | 1 | 3 moteurs |
| 412x915@2,625 | `mob-2x.avif` | 1 | 3 moteurs |
| 1400x900@1 | `bur-1x.avif` | 1 | 3 moteurs |
| 1400x900@1,25 | `bur-2x.avif` | 1 | 3 moteurs |
| 1400x900@2 | `bur-2x.avif` | 1 | 3 moteurs |

### Blocs publiés (`extraits/bloc-recommande.*`, `extraits/bloc-variables.*`)

Fichiers servis tels quels, seul le préfixe `/img/` change. Le témoin exige une seule requête, en AVIF.

| Fenêtre @ DPR | `bloc-recommande` | `bloc-variables` | Moteurs |
| --- | --- | --- | --- |
| 400x800@1 | `hero-768.avif` | `article-768.avif` | 3 moteurs |
| 400x800@2 | `hero-1536.avif` | `article-1536.avif` | 3 moteurs |
| 400x800@3 | `hero-1536.avif` | `article-1536.avif` | 3 moteurs |
| 412x915@2,625 | `hero-1536.avif` | `article-1536.avif` | 3 moteurs |
| 1400x900@1 | `hero-1920.avif` | `article-1920.avif` | 3 moteurs |
| 1400x900@1,25 | `hero-2880.avif` | `article-2880.avif` | 3 moteurs |
| 1400x900@2 | `hero-2880.avif` | `article-2880.avif` | 3 moteurs |

## 3. Écritures de `image-set()`

Noms de fichier : `aN` AVIF, `jN` JPEG, de densité N. `tous-types-inconnus` : première déclaration `url(repli.jpg)`, seconde `image-set(url(x.xyz) type("image/x-inconnu"))`.

| Écriture | DPR 1 | DPR 2 | Moteurs |
| --- | --- | --- | --- |
| complet | `a1.avif` | `a2.avif` | 3 moteurs |
| jpeg-en-tete | `j.jpg` | `j.jpg` | 3 moteurs |
| avif-1x-seul | `a1.avif` | `j2.jpg` | 3 moteurs |
| type-sans-densite | `a.avif` | `a.avif` | 3 moteurs |
| type-inconnu | `j.jpg` | `j.jpg` | 3 moteurs |
| doublon-densite | `premier.jpg` | `premier.jpg` | 3 moteurs |
| ordre-inverse | `j1.jpg` | `j2.jpg` | 3 moteurs |
| seulement-2x | `j2.jpg` | `j2.jpg` | 3 moteurs |
| seulement-1x | `j1.jpg` | `j1.jpg` | 3 moteurs |
| dpi | `j1.jpg` | `j2.jpg` | 3 moteurs |
| dppx | `j1.jpg` | `j2.jpg` | 3 moteurs |
| chaine | `j1.jpg` | `j2.jpg` | 3 moteurs |
| degrade | aucune | `j2.jpg` | 3 moteurs |
| prefixe | `a.avif` | `a.avif` | 3 moteurs |
| tous-types-inconnus | aucune | aucune | 3 moteurs |

Valeur calculée de `background-image` pour `complet` à DPR 2, identique à DPR 1 :

- Chrome 156.0.8078.80 : `image-set(url("a1.avif") 1dppx type("image/avif"), url("a2.avif") 2dppx type("image/avif"), url("j1.jpg") 1dppx type("image/jpeg"), url("j2.jpg") 2dppx type("image/jpeg"))`
- Firefox 158.0 : `image-set(url("a1.avif") 1dppx type("image/avif"), url("a2.avif") 2dppx type("image/avif"), url("j1.jpg") 1dppx type("image/jpeg"), url("j2.jpg") 2dppx type("image/jpeg"))`
- WebKit 27.2 (Playwright) : `image-set(url("a1.avif") 1dppx type("image/avif"), url("a2.avif") 2dppx type("image/avif"), url("j1.jpg") 1dppx type("image/jpeg"), url("j2.jpg") 2dppx type("image/jpeg"))`

## 4. Largeur affichée d'un PNG de 1 000 × 500 px en `background-size: auto`

Pixels magenta de la première ligne de la capture, rapportés à l'échelle de la capture ; élément de 1 400 px de large, donc 1 400 = image coupée par l'élément (`0.5x` donnerait 2 000).

| Écriture | DPR 1 | DPR 2 | Moteurs |
| --- | --- | --- | --- |
| url | 1000 px | 1000 px | 3 moteurs |
| sans-densite | 1000 px | 1000 px | 3 moteurs |
| type-sans-densite | 1000 px | 1000 px | 3 moteurs |
| 1x | 1000 px | 1000 px | 3 moteurs |
| 2x | 500 px | 500 px | 3 moteurs |
| 0.5x | 1400 px | 1400 px | 3 moteurs |
| 2x-cover | 1400 px | 1400 px | 3 moteurs |

## 5. Media queries, conteneurs, éléments hors écran ou masqués

Fenêtre de 400 × 800 px, DPR 1, sauf mention. `Au chargement` = requêtes du premier affichage ; `À 1 400 px`, `Retour à 400 px` = requêtes ajoutées par le redimensionnement.

| Cas | Au chargement | À 1 400 px | Retour à 400 px | Moteur |
| --- | --- | --- | --- | --- |
| mq | `mob-1x.jpg` | `bur-1x.jpg` | aucune | 3 moteurs |
| ecrase | `mob-1x.jpg` | — | — | 3 moteurs |
| conteneur | `mob-1x.jpg` | `bur-1x.jpg` | aucune | chrome |
| conteneur | `bur-1x.jpg` + `mob-1x.jpg` | aucune | aucune | firefox |
| conteneur | `mob-1x.jpg` | `bur-1x.jpg` | aucune | webkit |
| conteneur-sans-base | `mob-1x.jpg` | `bur-1x.jpg` | aucune | 3 moteurs |
| conteneur-base-mobile-1400 | `bur-1x.jpg` | — | — | chrome |
| conteneur-base-mobile-1400 | `mob-1x.jpg` + `bur-1x.jpg` | — | — | firefox |
| conteneur-base-mobile-1400 | `bur-1x.jpg` | — | — | webkit |
| hors-ecran | `x-1x.jpg` | — | — | 3 moteurs |
| display-none | aucune | — | — | 3 moteurs |
| parent-none | aucune | — | — | 3 moteurs |
| visibility-hidden | `x-1x.jpg` | — | — | 3 moteurs |
| content-visibility | aucune | — | — | chrome |
| content-visibility | `x-1x.jpg` | — | — | firefox |
| content-visibility | `x-1x.jpg` | — | — | webkit |

## 6. DPR changé en cours de page, connexion lente

DPR de 1 à 2 par `Emulation.setDeviceMetricsOverride` (Chrome) ou `setViewport` (Firefox), sans API sous WebKit de Playwright. `Recalcul` : `background-position` modifié sur l'élément ; `Nouvel élément` : élément ajouté avec la même classe ; `Retour` : DPR rendu à 1.

| Moteur | Après passage à 2 | Recalcul | Nouvel élément | Retour |
| --- | --- | --- | --- | --- |
| Chrome 156.0.8078.80 | aucune | `j2.jpg` | aucune | aucune |
| Firefox 158.0 | aucune | `j2.jpg` | aucune | aucune |

Chrome, DPR 3, latence 2 500 ms : `navigator.connection.effectiveType` = `slow-2g`, image demandée `j3.jpg` sur `1x 2x 3x`.

## 7. Propriétés personnalisées

| Cas | DPR 1 | DPR 2 | Moteurs |
| --- | --- | --- | --- |
| options-en-variables | `a1.avif` | `a2.avif` | 3 moteurs |
| ensemble-en-variable | `a1.avif` | `a2.avif` | 3 moteurs |

URL relative dans une variable, page sous `/p/`, feuille qui utilise `var()` sous `/c/` (`--f: url(rel.jpg)`) :

| Variable posée dans | Requête reçue | Moteurs |
| --- | --- | --- |
| attribut `style` de l'élément | `/c/.../rel.jpg` | 3 moteurs |
| `<style>` de la page | `/c/.../rel.jpg` | 3 moteurs |
| la feuille elle-même (témoin) | `/c/.../rel.jpg` | 3 moteurs |

Repli. `fonction-inconnue` tient lieu de notation non prise en charge :

| Cas | Requêtes | Moteurs |
| --- | --- | --- |
| `url(repli.jpg)` puis `fonction-inconnue(url(a.jpg) 1x)` | `repli.jpg` | 3 moteurs |
| `url(repli.jpg)` puis `fonction-inconnue(var(--a) 1x)` | aucune | 3 moteurs |
| `url(repli.jpg)`, puis `image-set(var(--a) ...)` sous `@supports` d'une notation connue | `a.jpg` | 3 moteurs |
| `url(repli.jpg)`, puis `fonction-inconnue(var(--a))` sous `@supports` de cette notation | `repli.jpg` | 3 moteurs |

## 8. LCP, valeur calculée, extrait de console

| Moteur | DPR | API LCP | `url` de l'entrée | Balise | Surface | Resource Timing |
| --- | --- | --- | --- | --- | --- | --- |
| Chrome 156.0.8078.80 | 1 | oui | `hero-1x.png` | DIV | 1120000 | css `hero-1x.png` |
| Chrome 156.0.8078.80 | 2 | oui | `hero-2x.png` | DIV | 1120000 | css `hero-2x.png` |
| Firefox 158.0 | 1 | oui | `hero-1x.png` | DIV | 1120000 | css `hero-1x.png` |
| Firefox 158.0 | 2 | oui | `hero-2x.png` | DIV | 1120000 | css `hero-2x.png` |
| WebKit 27.2 (Playwright) | 1 | oui | `hero-1x.png` | DIV | 1120000 | css `hero-1x.png` |
| WebKit 27.2 (Playwright) | 2 | oui | `hero-2x.png` | DIV | 1120000 | css `hero-2x.png` |

`extraits/console-fonds.js` tel que publié, 1 400 × 900 px, DPR 2 :

| Cas | Images listées | Image LCP | Requêtes au serveur | Moteurs |
| --- | --- | --- | --- | --- |
| préchargement `1x, 2x`, même `image-set()` | link `hero-2x.png` | `hero-2x.png` (DIV) | `hero-2x.png` | 3 moteurs |
| préchargement `href` de l'image `1x`, même `image-set()` | link `hero-1x.png`, css `hero-2x.png` | `hero-2x.png` (DIV) | `hero-1x.png` + `hero-2x.png` | 3 moteurs |

## 9. `CSS.supports`

| Écriture | Chrome 156.0.8078.80 | Firefox 158.0 | WebKit 27.2 (Playwright) |
| --- | --- | --- | --- |
| complet | oui | oui | oui |
| jpeg-en-tete | oui | oui | oui |
| avif-1x-seul | oui | oui | oui |
| type-sans-densite | oui | oui | oui |
| type-inconnu | oui | oui | oui |
| doublon-densite | oui | oui | oui |
| ordre-inverse | oui | oui | oui |
| seulement-2x | oui | oui | oui |
| seulement-1x | oui | oui | oui |
| dpi | oui | oui | oui |
| dppx | oui | oui | oui |
| chaine | oui | oui | oui |
| degrade | oui | oui | oui |
| prefixe | oui | oui | oui |
| x-seul | oui | oui | oui |
| calc | oui | oui | oui |
| imbrique | non | non | non |
| largeur-w | non | non | non |

AVIF témoin décodé (`naturalWidth` attendu 16) : Chrome 156.0.8078.80 16, Firefox 158.0 16, WebKit 27.2 (Playwright) 16.
