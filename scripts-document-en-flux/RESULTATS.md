# Résultats : instant d'exécution d'un script externe dans un document HTML envoyé en flux

Série `serie-p5-pause2000.json` du 2026-11-19 : 5 passages, pause de 2000 ms entre les deux parties du document, Playwright 1.65.0. Moteurs lancés : chrome 158.0.8127.37, firefox 159.0, webkit 27.2.

Fichier produit par `synthese.py` ; chaque nombre cité ailleurs vient de ce fichier.

## Témoins

- OK : coquille analysée avant 500 ms dans chaque chargement (document reçu en flux)
- OK : suite analysée après la pause (2000 ms) dans chaque chargement
- OK : une seule exécution du script et aucune erreur dans chaque chargement
- OK : témoin négatif : defer et module exécutés après la suite, chaque moteur
- OK : témoin positif : async-lent sur coquille longue exécuté avant la suite, chaque moteur
- OK : script complet : 1 requête de script par chargement au journal du serveur

## Exécution avant la suite du document

« Avant la suite » : le script s'exécute alors que la seconde partie du document n'est pas encore analysée (`#fin` absent du DOM). Durées en ms depuis le début de la navigation, médiane [min, max].

| Moteur | Variante | Coquille | Avant la suite | Exécution | Script reçu | Premier rendu (FCP) | Suite analysée |
|---|---|---|---|---|---|---|---|
| chrome | `defer` | courte | 0/5 | 2005 [2004, 2007] | 5 [5, 5] | 60 [48, 60] | 2004 [2002, 2005] |
| chrome | `defer` | longue | 0/5 | 2003 [2002, 2006] | 5 [5, 10] | 48 [36, 60] | 2002 [2002, 2004] |
| chrome | `async` | courte | 5/5 | 39 [22, 46] | 5 [5, 9] | 52 [24, 60] | 2004 [2004, 2004] |
| chrome | `async` | longue | 5/5 | 40 [37, 42] | 5 [5, 5] | 48 [44, 60] | 2004 [2003, 2004] |
| chrome | `module` | courte | 0/5 | 2005 [2003, 2007] | 5 [5, 5] | 60 [48, 60] | 2003 [2003, 2005] |
| chrome | `module` | longue | 0/5 | 2006 [2005, 2011] | 5 [5, 5] | 48 [44, 60] | 2004 [2004, 2010] |
| chrome | `module-async` | courte | 5/5 | 41 [38, 44] | 5 [5, 5] | 48 [40, 60] | 2002 [2002, 2004] |
| chrome | `module-async` | longue | 5/5 | 42 [41, 44] | 5 [5, 5] | 60 [44, 60] | 2004 [2003, 2005] |
| chrome | `async-lent` | courte | 5/5 | 309 [307, 310] | 308 [306, 308] | 52 [48, 60] | 2003 [2003, 2005] |
| chrome | `async-lent` | longue | 5/5 | 309 [308, 311] | 307 [307, 309] | 60 [48, 60] | 2003 [2003, 2004] |
| chrome | `module-async-lent` | courte | 5/5 | 308 [307, 309] | 307 [306, 307] | 56 [44, 60] | 2004 [2002, 2005] |
| chrome | `module-async-lent` | longue | 5/5 | 309 [308, 310] | 307 [306, 308] | 56 [44, 60] | 2003 [2002, 2004] |
| firefox | `defer` | courte | 0/5 | 2004 [2002, 2004] | 7 [6, 8] | 19 [14, 27] | 2004 [2002, 2004] |
| firefox | `defer` | longue | 0/5 | 2005 [2003, 2007] | 8 [7, 70] | 22 [19, 48] | 2004 [2002, 2007] |
| firefox | `async` | courte | 5/5 | 9 [7, 11] | 9 [7, 10] | 22 [15, 30] | 2004 [2003, 2006] |
| firefox | `async` | longue | 5/5 | 8 [7, 9] | 8 [7, 8] | 20 [13, 23] | 2005 [2001, 2006] |
| firefox | `module` | courte | 0/5 | 2005 [2003, 2013] | 7 [6, 9] | 20 [16, 23] | 2004 [2003, 2013] |
| firefox | `module` | longue | 0/5 | 2004 [2003, 2005] | 7 [6, 9] | 25 [20, 27] | 2004 [2003, 2005] |
| firefox | `module-async` | courte | 5/5 | 8 [7, 10] | 8 [7, 9] | 19 [17, 21] | 2004 [2003, 2019] |
| firefox | `module-async` | longue | 5/5 | 10 [7, 10] | 9 [7, 9] | 23 [11, 24] | 2002 [2002, 2006] |
| firefox | `async-lent` | courte | 5/5 | 314 [313, 319] | 311 [308, 311] | 23 [21, 27] | 2004 [2003, 2006] |
| firefox | `async-lent` | longue | 5/5 | 311 [308, 312] | 309 [307, 309] | 23 [21, 25] | 2005 [2001, 2005] |
| firefox | `module-async-lent` | courte | 5/5 | 313 [312, 314] | 311 [309, 312] | 20 [19, 28] | 2004 [2003, 2005] |
| firefox | `module-async-lent` | longue | 5/5 | 315 [312, 318] | 312 [308, 313] | 23 [22, 28] | 2003 [2001, 2005] |
| webkit | `defer` | courte | 0/5 | 2004 [2002, 2005] | 3 [3, 3] | 2007 [2004, 2007] | 2003 [2002, 2004] |
| webkit | `defer` | longue | 0/5 | 2005 [2005, 2009] | 3 [3, 27] | 16 [9, 133] | 2004 [2004, 2008] |
| webkit | `async` | courte | 0/5 | 2006 [2005, 2007] | 3 [3, 3] | 2008 [2007, 2009] | 2005 [2003, 2005] |
| webkit | `async` | longue | 0/5 | 2006 [2005, 2007] | 3 [3, 3] | 10 [9, 17] | 2004 [2003, 2005] |
| webkit | `module` | courte | 0/5 | 2005 [2003, 2007] | 3 [3, 3] | 2008 [2007, 2010] | 2004 [2003, 2006] |
| webkit | `module` | longue | 0/5 | 2006 [2005, 2006] | 3 [3, 4] | 19 [14, 23] | 2005 [2004, 2005] |
| webkit | `module-async` | courte | 0/5 | 2006 [2004, 2006] | 3 [3, 3] | 2008 [2006, 2009] | 2004 [2003, 2005] |
| webkit | `module-async` | longue | 0/5 | 2007 [2003, 2008] | 3 [3, 3] | 12 [9, 15] | 2005 [2002, 2006] |
| webkit | `async-lent` | courte | 0/5 | 2005 [2003, 2006] | 305 [305, 306] | 2008 [2004, 2009] | 2003 [2002, 2005] |
| webkit | `async-lent` | longue | 5/5 | 308 [307, 310] | 305 [304, 306] | 23 [15, 24] | 2003 [2002, 2006] |
| webkit | `module-async-lent` | courte | 0/5 | 2005 [2004, 2007] | 306 [305, 307] | 2007 [2006, 2011] | 2004 [2003, 2005] |
| webkit | `module-async-lent` | longue | 5/5 | 308 [306, 312] | 306 [305, 307] | 14 [8, 23] | 2003 [2002, 2005] |

