#!/usr/bin/env python3
"""Synthèse : lit la dernière série complète (brut/series-*-p5.json) et écrit RESULTATS.md.
Pour chaque blocage : images reçues et amplitude du déplacement dans [début + 50 ms, fin - 50 ms] ; même relevé au
repos qui suit. « Bouge » si l'amplitude atteint SEUIL px. Chaque nombre cité ailleurs est imprimé ici."""
import glob, json, statistics, sys

SEUIL = 20
fichiers = [sys.argv[1]] if len(sys.argv) > 1 else sorted(glob.glob('brut/series-*-p5.json'))
if not fichiers:
    sys.exit('aucune série complète dans brut/')
f = fichiers[-1]
s = json.load(open(f))

ORDRE = ['css-transform', 'css-var-billet', 'css-left', 'css-property', 'waapi-transform', 'raf-transform', 'gsap-x', 'motion-transform', 'motion-x']
LIB = {
    'css-transform': 'CSS `@keyframes`, `transform`',
    'css-var-billet': 'CSS `@keyframes`, `transform` avec `var()` dans l\'image clé (recette du billet)',
    'css-left': 'CSS `@keyframes`, `left`',
    'css-property': 'CSS, propriété `@property` animée, appliquée à `transform`',
    'waapi-transform': 'Web Animations API, `element.animate()` sur `transform`',
    'raf-transform': 'boucle `requestAnimationFrame` qui écrit `style.transform`',
    'gsap-x': f'GSAP {s["gsap"]}, `gsap.to(el, {{ x }})`',
    'motion-transform': f'Motion {s["motion"]}, `animate(el, {{ transform }})`',
    'motion-x': f'Motion {s["motion"]}, `animate(el, {{ x }})`',
}

def amp(l):
    return (max(i['x'] for i in l) - min(i['x'] for i in l)) if l else 0

res = {}
for p in s['passages']:
    blocs, imgs = p['blocs'], [i for i in p['images'] if i['x'] is not None]
    for k, (a, b) in enumerate(blocs):
        dans = [i for i in imgs if a + 50 <= i['t'] <= b - 50]
        fin = blocs[k + 1][0] - 50 if k + 1 < len(blocs) else b + s['REPOS'] - 50
        apres = [i for i in imgs if b + 100 <= i['t'] <= fin]
        res.setdefault(p['variante'], []).append({'duree': b - a, 'nb': len(dans), 'amp': amp(dans), 'nbR': len(apres), 'ampR': amp(apres)})

L = []
L.append('# Résultats : animations pendant un blocage du thread principal\n')
import re
page = open('page/index.html', encoding='utf-8').read()
dist = abs(int(re.search(r'DIST = (-?\d+)', page).group(1))); duree = int(re.search(r'DUREE = (\d+)', page).group(1))
majeure = s["chrome"].split('.')[0]
bloc = "par l'extrait de console `extrait-console.js` (1 000 ms)" if 'extrait' in f else f'de {s["BLOC"]} ms'
L.append(f'Série `{f}` : Chrome {majeure} ({s["chrome"]}), boîte de 40 × 40 px en aller-retour sur {dist} px en {duree} ms, Playwright {s["playwright"]}, {s["PASSAGES"]} passages × {s["CYCLES"]} blocages '
         f'{bloc}, repos {s["REPOS"]} ms, relevé du {s["date"][:10]}. « Bouge » : amplitude ≥ {SEUIL} px dans la fenêtre '
         'du blocage (bornes réduites de 50 ms de chaque côté).\n')
L.append('| Variante | Blocages où la boîte bouge | Images reçues pendant un blocage, médiane [min, max] | Amplitude pendant un blocage (px), médiane [min, max] | Repos où la boîte bouge |')
L.append('|---|---|---|---|---|')
echec = False
for v in ORDRE:
    r = res.get(v, [])
    if not r:
        L.append(f'| {LIB[v]} | absente | | | |'); echec = True; continue
    n = len(r)
    bouge = sum(1 for x in r if x['amp'] >= SEUIL)
    repos = sum(1 for x in r if x['ampR'] >= SEUIL)
    if repos < n:
        echec = True
    nb = [x['nb'] for x in r]; am = [x['amp'] for x in r]
    L.append(f'| {LIB[v]} | {bouge}/{n} | {statistics.median(nb):g} [{min(nb)}, {max(nb)}] | {statistics.median(am):g} [{min(am):g}, {max(am):g}] | {repos}/{n} |')
dur = [x['duree'] for r in res.values() for x in r]
L.append(f'\nDurée réelle des blocages : {min(dur):.0f} à {max(dur):.0f} ms.\n')
t = res.get('css-transform', []); r = res.get('raf-transform', [])
tem_pos = bool(t) and all(x['amp'] >= SEUIL for x in t)
tem_neg = bool(r) and all(x['amp'] < SEUIL for x in r)
L.append('## Témoins\n')
L.append(f'- Témoin positif (`css-transform` bouge pendant chaque blocage) : {"OK" if tem_pos else "ÉCHEC"}.')
L.append(f'- Témoin négatif (`raf-transform` ne bouge pendant aucun blocage) : {"OK" if tem_neg else "ÉCHEC"}.')
L.append(f'- Chaque variante anime pendant chaque repos : {"OK" if not echec else "ÉCHEC"}.')
if len(sys.argv) > 2:
    open(sys.argv[2], 'w').write('\n'.join(L) + '\n')
elif len(sys.argv) == 1:
    open('RESULTATS.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
if not (tem_pos and tem_neg) or echec:
    sys.exit(1)
