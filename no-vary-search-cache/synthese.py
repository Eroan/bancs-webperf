#!/usr/bin/env python3
"""Synthèse du banc « No-Vary-Search et cache disque » : lit <dossier>/mesures.json et imprime RESULTATS en Markdown.
Proportions en n/N avec leur critère. Usage : python3 synthese.py <dossier> [> RESULTATS.md]"""
import json, os, sys
D = json.load(open(os.path.join(sys.argv[1], 'mesures.json'), encoding='utf-8'))
M = D['mesures']
serie = os.path.basename(os.path.normpath(sys.argv[1]))
print("# Résultats : No-Vary-Search et cache disque de Chrome\n")
print(f"Série `{serie}` : Chrome {D['chrome']}, Playwright {D['playwright']}, {D['passages']} passages par cas. "
      "Parcours : chargement de `/p?utm_source=a`, puis clic vers `/p?utm_source=b`, contexte neuf à chaque passage. "
      "Protocole : `PROTOCOLE.md`.\n")
print("| Cas (en-têtes du HTML) | 2e page sans requête au serveur | 2e page par revalidation (304) | URL redemandée à la revalidation | 2e page redemandée en entier | `deliveryType` de la 2e page | `transferSize` | `location.search` côté page |")
print("|---|---|---|---|---|---|---|---|")
for cas in D['cas']:
    s = [m for m in M if m['cas'] == cas]
    N = len(s)
    second = [[r for r in m['requetes'][1:]] for m in s]
    aucune = sum(1 for r in second if not r)
    reval = [r for r in second if r and r[0]['revalidation']]
    urls = sorted({r[0]['url'] for r in reval})
    plein = sum(1 for r in second if r and not r[0]['revalidation'])
    dt = sorted({m['deliveryType'] or '""' for m in s}); ts = sorted({m['transferSize'] for m in s}); loc = sorted({m['locationSearch'] for m in s})
    print(f"| {cas} | {aucune}/{N} | {len(reval)}/{N} | {', '.join('`'+u+'`' for u in urls) or '—'} | {plein}/{N} | {', '.join('`'+x+'`' for x in dt)} | {', '.join(map(str, ts))} | {', '.join('`'+x+'`' for x in loc)} |")
print("\n## En-têtes servis par cas\n")
for cas, h in D['cas'].items():
    print(f"- {cas} : " + ' ; '.join(f"`{k}: {v}`" for k, v in h.items()))

S = os.path.join(sys.argv[1], 'syntaxe.json')
if os.path.exists(S):
    X = json.load(open(S, encoding='utf-8'))
    print("\n## Syntaxe : valeurs appliquées par chaque moteur\n")
    print(f"Moteurs : {', '.join(X['moteurs'])} (Firefox par puppeteer-core en WebDriver BiDi) ; {X['passages']} passages. "
          "HTML en `Cache-Control: max-age=600`. Parcours : `?utm_source=a&page=1`, puis clic vers la même page où seul "
          "`utm_source` change (`?utm_source=b&page=1`) ou seul `page` change (`?utm_source=a&page=2`). "
          "« cache » : aucune requête au serveur pour la seconde page.\n")
    print("| Moteur | `No-Vary-Search` | seul `utm_source` change | seul `page` change |")
    print("|---|---|---|---|")
    vals = []
    for m in X['mesures']:
        if m['valeur'] not in vals: vals.append(m['valeur'])
    for mo in X['moteurs']:
        for v in vals:
            cell = []
            for ch in ('utm_source', 'page'):
                s_ = [m for m in X['mesures'] if m['moteur'] == mo and m['valeur'] == v and m['change'] == ch]
                n = sum(1 for m in s_ if not m['redemandee'])
                cell.append(f"cache {n}/{len(s_)}")
            print(f"| {mo} | {'`'+v+'`' if v else '(absent)'} | {cell[0]} | {cell[1]} |")
