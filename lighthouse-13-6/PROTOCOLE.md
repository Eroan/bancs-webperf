# Protocole : Lighthouse 13.5.0 contre 13.6.0

Écrit le 2026-11-04, avant la série publiable, après un banc jetable qui a montré deux défauts à ne pas reproduire :
passages séparés et alternés (écart de page attribué au modèle, FCP observé 2,3 s ou 0,2 s selon le passage sur une
démo), et Chrome Canary pris par chrome-launcher à la place de Chrome stable.

## Questions

1. Sur un même relevé, combien FCP, LCP, TBT, Speed Index et le score changent-ils entre les deux versions ?
2. Quel changement de Lantern (`trace_engine` 0.0.65 contre 0.0.67) produit l'écart ?
3. Un relevé collecté par la 13.6.0 biaise-t-il l'audit par la 13.5.0 ?
4. Audits `llms-txt`, `robots-txt`, `ard-schema` et ligne de commande en lot : que font réellement les deux versions ?

## Banc Lantern (`banc.mjs`)

Une collecte (`-G`) par Lighthouse 13.6.0, Chrome stable imposé par `CHROME_PATH`, version lue dans chaque rapport,
mobile simulé par défaut. Chaque relevé est audité (`-A`) par :

- `135` : Lighthouse 13.5.0 complet ;
- `136` : Lighthouse 13.6.0 complet ;
- `136-reseau65` : 13.6.0 avec le modèle réseau 0.0.65 (`core/NetworkAnalyzer`, `simulation/Simulator`, `ConnectionPool`,
  `TCPConnection`) ;
- `136-rendu65` : 13.6.0 avec `graph/NetworkNode` 0.0.65 (priorité au lieu de `renderBlocking`) ;
- `136-lcptexte65` : 13.6.0 avec `metrics/LargestContentfulPaint` 0.0.65 ;
- `136-graphe65` : 13.6.0 avec `graph/PageDependencyGraph` et `CPUNode` 0.0.65 (évaluation des modules) ;
- `136-tout65` : les quatre groupes rétablis ensemble.

Le rétablissement se fait au chargement des modules (`variante.mjs`, crochet `resolve`), sans toucher `node_modules`.
Un écart qui disparaît quand un groupe est rétabli vient de ce groupe. Le processeur reste celui de la simulation de
Lighthouse : le banc compare deux modèles sur une entrée figée, il ne prétend pas reproduire un mobile.

- `135-h3-en-h2` : Lighthouse 13.5.0 sur le même relevé, `h3` réécrit en `h2` dans le journal réseau (`devtoolslog.json`) : part du
  traitement de HTTP/3 dans l'écart.

10 relevés par page, ordre des pages tourné à chaque passage, lanceur refusé sous 85 % d'inactivité du processeur. Le
calcul étant déterministe sur un relevé, les variantes à un seul groupe rétabli ne passent que sur les 3 premiers relevés.

Ajouts du 2026-11-04 après un passage exploratoire (non publié) : `136-tout65` y égale exactement `135` sur les 7 pages,
le gain des LCP d'image y disparaît avec `136-reseau65`, et le module de `module-tete`, évalué avant le FCP observé, reste
compté en 13.6.0. D'où la page `module-flux` et la variante `135-h3-en-h2`.

### Pages

Locales (`serveur.mjs`, HTTP/1.1, port libre, sans compression) :

- `texte-preload` : LCP texte, peint avec le FCP, image et script préchargés non utilisés ;
- `module-tete` : script `type=module` de 300 Ko en tête, texte seul ;
- `module-flux` : même module, document envoyé en deux temps (fin 400 ms après le texte) : peinture avant la fin de
  l'analyse, module téléchargé mais évalué après le FCP, cas décrit par le billet de Harry Roberts ;
- `css-bloquante` : feuille bloquante de 300 Ko, témoin : le blocage réel doit rester compté ;
- `image-locale` : LCP image en HTTP/1.1, témoin : ni règle de texte ni multiplexage.

Réelles, en HTTP/3 ou HTTP/2, parce que le multiplexage ne se reproduit pas sur le serveur local (exception assumée à
« rien ne sort de la machine », aucun tiers intercepté) : accueil et article de agencewebperformance.fr, démo publique
du thème Shopify Horizon. Protocoles relevés dans chaque rapport.

### Témoins

- Déterminisme : deux audits `136` du même relevé donnent les mêmes valeurs.
- Instrument : FCP et LCP observés identiques entre versions sur un même relevé.
- Blocage réel : FCP de `css-bloquante` proche entre versions.
- Bridage réel : `texte-preload`, `module-tete` et `module-flux` collectés avec `--throttling-method=devtools`, 5 relevés : même FCP et LCP
  dans les deux versions (Lantern n'intervient pas).
- Collecte : pages locales et article collectés par la 13.5.0 et audités par la 13.5.0 (5 relevés), comparés à la collecte 13.6.0.
- Attribution : `136-tout65` égale `135` : les quatre groupes expliquent tout l'écart de Lantern.

## Audits (`audits.mjs`)

Un serveur local par cas, audits `llms-txt`, `robots-txt`, `ard-schema` par les deux versions, réponses HTTP imposées
(`/llms.txt` et `/robots.txt` en 200, 404, 429, 500 ; manifeste ARD aux emplacements nouveaux et anciens).

## Ligne de commande (`lot.mjs`)

Lighthouse 13.6.0 sur un fichier d'URL (commentaire, ligne vide, URL en échec) : noms de fichiers, code de sortie,
`--fail-fast`, `--output-path` qui n'est pas un dossier, `-G` en lot.
