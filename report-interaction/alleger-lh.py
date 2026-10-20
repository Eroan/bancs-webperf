#!/usr/bin/env python3
"""Archive des rapports Lighthouse d'une série : retire les captures d'écran (base64 : ~95 % du poids,
inutiles au banc) et compresse en gzip. Les métriques, audits et réglages restent entiers.
Usage : python3 alleger-lh.py <dossier lh>   (lit lh-*.json et lh-*.json.gz, écrit lh-*.json.gz)
"""
import glob, gzip, json, os, sys

D = sys.argv[1]
F = sorted(glob.glob(os.path.join(D, 'lh-*.json')) + glob.glob(os.path.join(D, 'lh-*.json.gz')))
if not F:
    sys.exit(f"AUCUN RAPPORT dans {D}")
for f in F:
    d = json.load(gzip.open(f, 'rt') if f.endswith('.gz') else open(f))
    for k in ('screenshot-thumbnails', 'final-screenshot'):
        d.get('audits', {}).pop(k, None)
    d.pop('fullPageScreenshot', None)
    sortie = f if f.endswith('.gz') else f + '.gz'
    with gzip.open(sortie, 'wt', compresslevel=9) as o:
        json.dump(d, o)
    if sortie != f:
        os.remove(f)
print(f"{len(F)} rapport(s) allégé(s) dans {D}")
