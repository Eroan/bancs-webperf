#!/usr/bin/env python3
"""Synthèse du banc scripts-document-en-flux : imprime RESULTATS.md depuis une série brute."""
import json, sys, statistics, glob, os

src = sys.argv[1] if len(sys.argv) > 1 else sorted(glob.glob('brut/serie-*.json'))[-1]
out = sys.argv[2] if len(sys.argv) > 2 else 'RESULTATS.md'
d = json.load(open(src))
M = d['mesures']
pause = d['pause_ms']

def med(v):
    v = [x for x in v if x is not None]
    return f"{statistics.median(v):.0f} [{min(v):.0f}, {max(v):.0f}]" if v else "-"

# Témoins : chaque chargement a reçu la coquille tôt (flux réel), la suite après la pause,
# une seule exécution, aucune erreur ; defer et module classiques après la suite partout.
temoins = []
def temoin(nom, ok):
    temoins.append((nom, ok))
temoin('coquille analysée avant 500 ms dans chaque chargement (document reçu en flux)', all(m['t_coquille'] < 500 for m in M))
temoin(f'suite analysée après la pause ({pause} ms) dans chaque chargement', all(m['t_fin'] >= pause for m in M))
temoin('une seule exécution du script et aucune erreur dans chaque chargement', all(len(m['exec']) == 1 and not m['erreurs'] for m in M))
temoin('témoin négatif : defer et module exécutés après la suite, chaque moteur', all(m['exec'][0]['fin'] for m in M if m['variante'].split('/')[0] in ('defer', 'module')))
temoin('témoin positif : async-lent sur coquille longue exécuté avant la suite, chaque moteur',
       all(not m['exec'][0]['fin'] for m in M if m['variante'] == 'async-lent/longue'))
temoin('script complet : 1 requête de script par chargement au journal du serveur', d['requetes_scripts'] == len(M))

L = []
L.append('# Résultats : instant d\'exécution d\'un script externe dans un document HTML envoyé en flux\n')
L.append(f"Série `{os.path.basename(src)}` du {d['date'][:10]} : {d['passages']} passages, pause de {pause} ms entre les deux parties "
         f"du document, Playwright {d['playwright']}. Moteurs lancés : " + ', '.join(f"{k} {v}" for k, v in d['moteurs'].items()) + '.\n')
L.append('Fichier produit par `synthese.py` ; chaque nombre cité ailleurs vient de ce fichier.\n')
L.append('## Témoins\n')
for nom, ok in temoins:
    L.append(f"- {'OK' if ok else 'ÉCHEC'} : {nom}")
L.append('')
L.append('## Exécution avant la suite du document\n')
L.append('« Avant la suite » : le script s\'exécute alors que la seconde partie du document n\'est pas encore analysée '
         '(`#fin` absent du DOM). Durées en ms depuis le début de la navigation, médiane [min, max].\n')
L.append('| Moteur | Variante | Coquille | Avant la suite | Exécution | Script reçu | Premier rendu (FCP) | Suite analysée |')
L.append('|---|---|---|---|---|---|---|---|')
for moteur in d['moteurs']:
    ordre = ['defer', 'async', 'module', 'module-async', 'async-lent', 'module-async-lent']
    for v in sorted(dict.fromkeys(m['variante'] for m in M), key=lambda x: (ordre.index(x.split('/')[0]), x.split('/')[1])):
        S = [m for m in M if m['moteur'] == moteur and m['variante'] == v]
        avant = sum(1 for m in S if not m['exec'][0]['fin'])
        var, coq = v.split('/')
        L.append(f"| {moteur} | `{var}` | {coq} | {avant}/{len(S)} | {med([m['exec'][0]['t'] for m in S])} | "
                 f"{med([(m['ressource'][0]['responseEnd'] if m['ressource'] else None) for m in S])} | "
                 f"{med([m['fcp'] if m['fcp'] >= 0 else None for m in S])} | {med([m['t_fin'] for m in S])} |")
L.append('')
open(out, 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
sys.exit(0 if all(ok for _, ok in temoins) else 1)
