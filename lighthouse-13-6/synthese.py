#!/usr/bin/env python3
"""Synthèse du banc Lighthouse 13.6 : lit mesures.json, audits.json, lot.json et imprime RESULTATS en Markdown.
Durées en ms, médiane [min, max]. Usage : python3 synthese.py <dossier> [> RESULTATS.md]"""
import json, os, statistics as st, sys
D = sys.argv[1]
J = json.load(open(os.path.join(D, 'mesures.json'), encoding='utf-8'))
M = J['mesures']
def sel(**k): return [m for m in M if all(m[a] == b for a, b in k.items())]
def f(v):
    return f"{round(st.median(v))} [{round(min(v))}, {round(max(v))}]"
chromes = sorted({m['chrome'] for m in M}); pages = list(J['pages'])
print("# Résultats : Lighthouse 13.5.0 contre 13.6.0\n")
print(f"Série `{os.path.basename(os.path.normpath(D))}` : Chrome {', '.join(chromes)}, mobile simulé, {J['passages']} relevés par page. Protocole : `PROTOCOLE.md`.\n")
print(open(os.path.join(D, 'machine.txt'), encoding='utf-8').read().strip().replace('\n', ' ; '), '\n')
print("## Même relevé, 13.5.0 et 13.6.0\n")
print("| Page | Élément LCP | Protocoles | FCP observé | Score 13.5.0 | Score 13.6.0 | FCP 13.5.0 | FCP 13.6.0 | LCP 13.5.0 | LCP 13.6.0 | SI 13.5.0 | SI 13.6.0 | TBT 13.5.0 | TBT 13.6.0 |")
print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
for p in pages:
    a, b = sel(serie='simule', page=p, variante='135'), sel(serie='simule', page=p, variante='136')
    if not a: continue
    types = sorted({str(m['lcpType']) for m in a}); pr = {}
    for m in b:
        for k, v in m['protocoles'].items(): pr[k] = pr.get(k, 0) + v
    prs = ', '.join(f"{k} {v}" for k, v in sorted(pr.items(), key=lambda x: -x[1]) if k not in ('data', '?'))
    print(f"| {p} | {'/'.join(types)} | {prs} | {f([m['ofcp'] for m in b])} | " + " | ".join(f([m[c] for m in x]) for c in ('score', 'fcp', 'lcp', 'si', 'tbt') for x in (a, b)) + " |")
print("\n## Écart relevé par relevé (13.6.0 moins 13.5.0)\n")
print("| Page | Score | FCP | LCP | Relevés où le score monte | Relevés où il baisse |"); print("|---|---|---|---|---|---|")
for p in pages:
    a, b = sel(serie='simule', page=p, variante='135'), sel(serie='simule', page=p, variante='136')
    if not a: continue
    par = {m['i']: m for m in a}; d = lambda c: [m[c] - par[m['i']][c] for m in b]
    print(f"| {p} | {f(d('score'))} | {f(d('fcp'))} | {f(d('lcp'))} | {sum(x > 0 for x in d('score'))}/{len(b)} | {sum(x < 0 for x in d('score'))}/{len(b)} |")
print("\n## Écart attribué : un seul groupe rétabli en 0.0.65 dans la 13.6.0 (3 premiers relevés)\n")
V = ['135', '136', '136-reseau65', '136-rendu65', '136-lcptexte65', '136-graphe65', '136-tout65', '135-h3-en-h2']
print("| Page | Métrique | " + " | ".join(V) + " |"); print("|---|---|" + "---|" * len(V))
for p in pages:
    for c in ('fcp', 'lcp'):
        cel = []
        for v in V:
            x = [m[c] for m in sel(serie='simule', page=p, variante=v) if m['i'] < 3]
            cel.append(str(round(st.median(x))) if x else '—')
        print(f"| {p} | {c.upper()} | " + " | ".join(cel) + " |")
print("\n## Témoins\n")
t = sel(serie='simule', variante='136bis'); ko = []
for m in t:
    o = [x for x in sel(serie='simule', page=m['page'], variante='136', i=m['i'])][0]
    if any(m[c] != o[c] for c in ('fcp', 'lcp', 'si', 'tbt', 'score')): ko.append(m['page'])
print(f"- Déterminisme : {len(t) - len(ko)}/{len(t)} doubles audits `136` identiques.")
n = e = 0
for m in sel(serie='simule', variante='136'):
    for v in sel(serie='simule', page=m['page'], i=m['i']):
        n += 1; e += (v['ofcp'] == m['ofcp'] and v['olcp'] == m['olcp'])
print(f"- Instrument : FCP et LCP observés identiques entre variantes d'un même relevé : {e}/{n}.")
n = e = 0
for m in sel(serie='simule', variante='135'):
    o = sel(serie='simule', page=m['page'], variante='136-tout65', i=m['i'])[0]; n += 1
    e += all(abs(m[c] - o[c]) < 1 for c in ('fcp', 'lcp', 'si'))
print(f"- Attribution : `136-tout65` égale `135` à moins de 1 ms près (FCP, LCP, SI) : {e}/{n} relevés.")
print("\nBridage réel (`--throttling-method=devtools`, 5 relevés) : Lantern n'intervient pas.\n")
print("| Page | FCP 13.5.0 | FCP 13.6.0 | LCP 13.5.0 | LCP 13.6.0 |"); print("|---|---|---|---|---|")
for p in pages:
    a, b = sel(serie='devtools', page=p, variante='135'), sel(serie='devtools', page=p, variante='136')
    if a: print(f"| {p} | {f([m['fcp'] for m in a])} | {f([m['fcp'] for m in b])} | {f([m['lcp'] for m in a])} | {f([m['lcp'] for m in b])} |")
print("\nCollecte : audit par la 13.5.0, relevé collecté par la 13.5.0 ou la 13.6.0 (5 premiers relevés).\n")
print("| Page | FCP, collecte 13.5.0 | FCP, collecte 13.6.0 | LCP, collecte 13.5.0 | LCP, collecte 13.6.0 |"); print("|---|---|---|---|---|")
for p in pages:
    a = sel(serie='collecte135', page=p, variante='135'); b = [m for m in sel(serie='simule', page=p, variante='135') if m['i'] < 5]
    if a: print(f"| {p} | {f([m['fcp'] for m in a])} | {f([m['fcp'] for m in b])} | {f([m['lcp'] for m in a])} | {f([m['lcp'] for m in b])} |")
print("\n## Audits selon la réponse du serveur\n")
A = json.load(open(os.path.join(D, 'audits.json'), encoding='utf-8'))
print("| Cas | 13.5.0 | 13.6.0 | Message 13.6.0 |"); print("|---|---|---|---|")
for c in dict.fromkeys(a['cas'] for a in A):
    x = {a['version']: a for a in A if a['cas'] == c}
    v = lambda a: 'non applicable' if a['mode'] == 'notApplicable' else f"score {a['score']}"
    msg = '; '.join(x['lh136']['details'] or ([x['lh136']['explication']] if x['lh136']['explication'] else [])).replace('|', '/')[:200]
    print(f"| {c} | {v(x['lh135'])} | {v(x['lh136'])} | {msg} |")
print("\n## Ligne de commande en lot (13.6.0)\n")
L = json.load(open(os.path.join(D, 'lot.json'), encoding='utf-8'))
for k, v in L.items():
    d = f"fichiers : {', '.join('`' + x + '`' for x in v['fichiers'])}" if 'fichiers' in v else f"message : {v['message']}"
    print(f"- {k} : code de sortie {v['code']} ; {d}")
