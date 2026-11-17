#!/usr/bin/env python3
"""Synthèse du banc composant-interactif-frameworks : chaque chiffre repris ailleurs est imprimé ici.

Usage : python3 synthese.py <dossier de série>  > <dossier>/RESULTATS.md
Lit poids.json, calibrage.json, versions.txt, vapor-gabarit.txt et passages-*.jsonl du dossier.
Passages refusés (témoin, complétude) exclus des statistiques, comptés et listés.
"""
import glob
import json
import os
import statistics
import sys

D = sys.argv[1]
ORDRE = ['vanilla', 'alpine', 'alpine-ssr', 'solid', 'solid-1', 'react', 'preact', 'svelte', 'vue', 'vue-vapor']
GESTES = ['favori', 'tri1', 'tri2', 'focus', 'touche-l', 'touche-a', 'retour1', 'retour2']


def med(v):
    v = [x for x in v if x is not None]
    if not v:
        return '—'
    m = statistics.median(v)
    return f"{m:.0f} [{min(v):.0f}, {max(v):.0f}]"


def ko(o):
    return f"{o / 1024:.1f}".replace('.', ',')


passages = []
for f in sorted(glob.glob(os.path.join(D, 'passages-*.jsonl'))):
    with open(f, encoding='utf-8') as fh:
        passages += [json.loads(l) for l in fh if l.strip()]
if not passages:
    print('AUCUN PASSAGE LU'); sys.exit(1)
poids = json.load(open(os.path.join(D, 'poids.json'), encoding='utf-8'))
calib = json.load(open(os.path.join(D, 'calibrage.json'), encoding='utf-8')) if os.path.exists(os.path.join(D, 'calibrage.json')) else None
taux = sorted({p['taux'] for p in passages})
chrome = sorted({p.get('chrome') for p in passages if p.get('chrome')})
tailles = sorted({p['n'] for p in passages})

print('# Résultats : composant interactif, Solid 2.0 face à Alpine, React, Preact, Svelte et Vue\n')
print(f"Série `{os.path.basename(D.rstrip('/'))}` ; Chrome {', '.join(chrome)} ; processeur bridé à ×{', ×'.join(str(t) for t in taux)}", end='')
if calib:
    tv = [r['bi'] for r in calib['res'] if r['taux'] in taux]
    print(f" (indice de Lighthouse dans la page : médiane {statistics.median(tv):.0f} [{min(tv):.0f}, {max(tv):.0f}] à ce taux)", end='')
print('.\n')
if os.path.exists(os.path.join(D, 'versions.txt')):
    print('Poste et versions :\n\n```\n' + open(os.path.join(D, 'versions.txt'), encoding='utf-8').read().strip() + '\n```\n')

# 1. Poids
print('## 1. JavaScript livré (fichier unique de la variante)\n')
print('| Variante | Brut (octets) | gzip -9 (octets) | Brotli 11 (octets) | Brotli (Ko) | × vanilla (Brotli) |')
print('|---|---:|---:|---:|---:|---:|')
for v in ORDRE:
    if v in poids:
        x = poids[v]
        print(f"| {v} | {x['brut']} | {x['gzip']} | {x['brotli']} | {ko(x['brotli'])} | {x['brotli'] / poids['vanilla']['brotli']:.1f} |")
if 'solid' in poids and 'solid-1' in poids:
    print(f"\nSolid 2.0.0 / Solid 1.9.19 (Brotli) : {poids['solid']['brotli'] / poids['solid-1']['brotli']:.2f}.")
gab = os.path.join(D, 'vapor-gabarit.txt')
if os.path.exists(gab):
    l = open(gab).read().split()
    print(f"\nContrôle du mode Vapor : gabarit HTML `<li class=ligne` trouvé {l[0]} fois dans `vue-vapor`, {l[1]} fois dans `vue` (attendu : 1 et 0).")

# HTML transféré (médiane par variante et taille)
print('\n### Document HTML transféré (octets, médiane)\n')
print('| Variante | ' + ' | '.join(f'N = {n}' for n in tailles) + ' |')
print('|---|' + '---:|' * len(tailles))
for v in ORDRE:
    cell = []
    for n in tailles:
        h = [p['octets']['html'] for p in passages if p['v'] == v and p['n'] == n and p.get('octets')]
        cell.append(f"{statistics.median(h):.0f}" if h else '—')
    if any(c != '—' for c in cell):
        print(f"| {v} | " + ' | '.join(cell) + ' |')

valides = {}
print('\n## Passages retenus\n')
print('| Variante | ' + ' | '.join(f'N = {n}' for n in tailles) + ' |')
print('|---|' + '---:|' * len(tailles))
for v in ORDRE:
    cell = []
    for n in tailles:
        tous = [p for p in passages if p['v'] == v and p['n'] == n]
        ok = [p for p in tous if not p['refus']]
        valides[(v, n)] = ok
        cell.append(f"{len(ok)}/{len(tous)}" if tous else '—')
    if any(c != '—' for c in cell):
        print(f"| {v} | " + ' | '.join(cell) + ' |')
refus = [p for p in passages if p['refus']]
if refus:
    print('\nRefus :\n')
    for p in refus:
        print(f"- p{p['passage']} {p['v']} N={p['n']} : {' ; '.join(p['refus'])}")

# 2. Chargement
for n in tailles:
    print(f'\n## 2. Chargement, N = {n} (médiane [min, max], ms sauf mention)\n')
    print('| Variante | Prêt (ms depuis la navigation) | ScriptDuration | TaskDuration | Layout + style | Tâches longues : somme au-delà de 50 ms | Tâches longues : nombre | Plus longue tâche | Tas JS après GC (Ko) | Nœuds DOM |')
    print('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    for v in ORDRE:
        ok = valides.get((v, n), [])
        if not ok:
            continue
        m = [p['metriques'] for p in ok]
        print('| ' + ' | '.join([
            v,
            med([p['pret']['t'] for p in ok]),
            med([x['ScriptDuration'] * 1000 for x in m]),
            med([x['TaskDuration'] * 1000 for x in m]),
            med([(x['LayoutDuration'] + x['RecalcStyleDuration']) * 1000 for x in m]),
            med([sum(max(0, d - 50) for d in p['longues']) for p in ok]),
            med([len(p['longues']) for p in ok]),
            med([max(p['longues'], default=0) for p in ok]),
            med([x['JSHeapUsedSize'] / 1024 for x in m]),
            med([x['Nodes'] for x in m]),
        ]) + ' |')

# 3. Interactions
for n in tailles:
    print(f'\n## 3. Interactions, N = {n} : durée Event Timing (ms, médiane [min, max] ; « — » sans objet)\n')
    print('| Variante | Pire interaction du passage (hors témoin) | ' + ' | '.join(GESTES) + ' |')
    print('|---|---:|' + '---:|' * len(GESTES))
    for v in ORDRE:
        ok = valides.get((v, n), [])
        if not ok:
            continue
        pire = [max((g['duree'] or 0) for g in p['gestes'] if g['nom'] != 'temoin') for p in ok]
        cols = []
        for gn in GESTES:
            vals = [g['duree'] for p in ok for g in p['gestes'] if g['nom'] == gn]
            cols.append(med([x if x is not None else 0 for x in vals]) if vals else '—')
        print(f"| {v} | {med(pire)} | " + ' | '.join(cols) + ' |')
    print('\nDurée nulle (0) : toutes les entrées de l\'interaction sous le seuil de 16 ms de l\'observateur.')

# Lignes visibles après chaque geste (lues dans la page, passages retenus)
print('\n## Lignes visibles après chaque geste\n')
for n in tailles:
    ok = [p for p in passages if p['n'] == n and not p['refus'] and p['v'] == 'solid']
    if ok:
        print(f"N = {n} : " + ', '.join(f"{g['nom']} {g['lu']['vis']}" for g in ok[0]['gestes']) + '.')

# Témoin
print('\n## Témoin (gestionnaire de 100 ms)\n')
tt = [g for p in passages if not p['refus'] for g in p['gestes'] if g['nom'] == 'temoin']
print(f"Traitement du clic : {med([g['traitement'] for g in tt])} ms ; durée Event Timing : {med([g['duree'] for g in tt])} ms ({len(tt)} passages retenus).")
