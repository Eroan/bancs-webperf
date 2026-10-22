#!/usr/bin/env python3
"""Synthèse du banc « bridage réseau CDP » : lit <dossier>/mesures.json (banc.mjs) et imprime RESULTATS en Markdown.
Chaque chiffre sort des données brutes ; durées en médiane [min, max] ; proportions en n/N avec leur critère.

Usage : python3 synthese.py <dossier>  [> RESULTATS.md]
"""
import json, os, statistics, sys

DOSSIER = sys.argv[1]
D = json.load(open(os.path.join(DOSSIER, 'mesures.json'), encoding='utf-8'))
M = D['mesures']
CODES = ['aucun', 'L40', 'L562', 'S4G', 'R562']
NOMS = {'aucun': 'aucune émulation', 'L40': 'emulateNetworkConditions, 40 ms',
        'L562': 'emulateNetworkConditions, 562,5 ms', 'S4G': 'emulateNetworkConditions, Slow 4G',
        'R562': 'emulateNetworkConditionsByRule, 562,5 ms'}
DELAIS = [0, 300, 800]
TAILLES = [2048, 102400]


def f(x):
    return f"{x:.1f}".replace('.', ',') if abs(x) < 10 else f"{round(x)}"


def mm(v):
    v = sorted(x for x in v if x is not None)
    if not v:
        return 'n/a'
    return f"{f(statistics.median(v))} [{f(v[0])}, {f(v[-1])}]"


def med(v):
    v = [x for x in v if x is not None]
    return statistics.median(v) if v else None


def sel(code, delai, taille):
    return [m for m in M if m['code'] == code and m['delai'] == delai and m['taille'] == taille]


serie = os.path.basename(os.path.normpath(DOSSIER))
print(f"# Résultats : bridage réseau CDP\n")
print(f"Série `{serie}` : Chrome {D['chrome']}, Playwright {D['playwright']}, {D['passages']} passages, "
      f"{len(M)} chargements. Protocole : `PROTOCOLE.md`. Durées en ms, médiane [min, max] sur {D['passages']} chargements, "
      "relatives au début de la navigation sauf mention.\n")

print("## Témoins\n")
pos = sel('L562', 0, 2048) + sel('L562', 0, 102400)
n = sum(1 for m in pos if m['cdp']['recu'] is not None and m['cdp']['recu'] >= 562)
print(f"- Positif (l'émulation s'applique) : sous `L562`, délai serveur 0, `Network.responseReceived` arrive "
      f"{mm([m['cdp']['recu'] for m in pos])} ms après `requestWillBeSent` ; {n}/{len(pos)} chargements à 562 ms ou plus.")
neg = [m for m in M if m['code'] == 'aucun']
ecarts = [abs((m['responseStart'] - m['requestStart']) - m['serveur']['entetes']) for m in neg if m['serveur']]
n = sum(1 for e in ecarts if e <= 5)
print(f"- Négatif (l'instrument lit le temps du serveur) : sans émulation, `responseStart − requestStart` s'écarte de "
      f"l'instant d'envoi des en-têtes par le serveur de {mm(ecarts)} ms ; {n}/{len(ecarts)} chargements à 5 ms ou moins.\n")

for taille in TAILLES:
    print(f"## Document de {taille // 1024} Ko\n")
    print("| Condition | Délai serveur | `responseStart` | `responseEnd` | `domInteractive` | en-têtes livrés (CDP `responseReceived`) | `receiveHeadersStart` (CDP) |")
    print("|---|---|---|---|---|---|---|")
    for code in CODES:
        for delai in DELAIS:
            s = sel(code, delai, taille)
            print(f"| `{code}` | {delai} | {mm([m['responseStart'] for m in s])} | {mm([m['responseEnd'] for m in s])} | "
                  f"{mm([m['domInteractive'] for m in s])} | {mm([m['cdp']['recu'] for m in s])} | "
                  f"{mm([m['cdp']['receiveHeadersStart'] for m in s])} |")
    print()

print("## Ce que la condition ajoute, par rapport à « aucun » (écart des médianes)\n")
print("| Condition | Taille | Délai serveur | sur `responseStart` | sur `responseEnd` | sur l'image (`responseEnd − requestStart`) |")
print("|---|---|---|---|---|---|")
for code in CODES[1:]:
    for taille in TAILLES:
        for delai in DELAIS:
            a, s = sel('aucun', delai, taille), sel(code, delai, taille)
            d = lambda k: med([m[k] for m in s]) - med([m[k] for m in a])
            img = lambda xs: med([m['img']['responseEnd'] - m['img']['requestStart'] for m in xs if m['img']])
            print(f"| `{code}` | {taille // 1024} Ko | {delai} | {f(d('responseStart'))} | {f(d('responseEnd'))} | {f(img(s) - img(a))} |")
print()

print("## Conditions\n")
for code in CODES:
    c = D['conditions'][code]
    print(f"- `{code}` ({NOMS[code]}) : " + ('aucune' if c is None else f"`{c['m']}` `{json.dumps(c['p'], ensure_ascii=False)}`"))
