#!/usr/bin/env python3
"""Synthèse : lit brut/mesures.tsv, brut/echecs.tsv et brut/corpus-releve.txt, écrit RESULTATS.md.
Un échec de minification compte la page comme non minifiée (règle du projet j9t/minifier-benchmarks).
Chaque nombre cité ailleurs est imprimé ici."""
import csv, statistics, sys

rows = list(csv.DictReader(open('brut/mesures.tsv'), delimiter='\t'))
BAL = ['a', 'img', 'source', 'picture', 'script_src', 'link', 'meta', 'iframe', 'video', 'svg', 'use', 'input', 'button', 'form']
for r in rows:
    for k in ['brut', 'gz6', 'br5', 'br11', 'texte', *BAL, 'i_vide', 'span_vide']:
        r[k] = int(r[k])
orig = {r['fichier']: r for r in rows if r['minificateur'] == 'aucune'}
N = len(orig)
releve = open('brut/corpus-releve.txt').read().strip()
NOMS = {'swchtml': '@swc/html 1.16.22', 'minifier': 'HTML Minifier 5.2.0', 'htmlnano': 'htmlnano 3.6.1', 'minifyhtml': 'minify-html 0.18.1',
        'minify': 'minify (tdewolff) 2.24.8', 'minimize': 'Minimize 2.2.0',
        'minifier-sans-vides': 'HTML Minifier 5.2.0 sans `removeEmptyElements` (variante du banc)',
        'minifier-sans-css-inutilise': 'HTML Minifier 5.2.0 sans `removeUnusedCSS` (variante du banc)'}
MODES = {'html': 'HTML seul', 'max': 'maximal (CSS, JS, JSON, SVG en ligne compris)'}
couples = [(m, n) for m in MODES for n in NOMS if any(r['mode'] == m and r['minificateur'] == n for r in rows)]
pct = lambda a, b: 100 * (a - b) / a if a else 0
ko = lambda o: o / 1024

L = ['# Résultats : minification du HTML et compression de transfert\n',
     f'Corpus : {N} pages ({releve}). Compression : zlib de Node (gzip niveau 6, Brotli mode texte qualités 5 et 11). '
     'Un échec compte la page non minifiée.\n']

# --- témoins ---
L.append('## Témoins\n')
ident = all(r['brut'] == orig[r['fichier']]['brut'] for r in rows if r['minificateur'] == 'aucune')
mt = [r for r in rows if r['fichier'].startswith('001-') and r['mode'] == 'html' and r['minificateur'] == 'minifier']
mt_gain = pct(orig[mt[0]['fichier']]['brut'], mt[0]['brut']) if mt else 0
L.append(f'- Témoin positif : page « Minifier Test », HTML Minifier, mode HTML seul : {mt_gain:.1f} % en brut (attendu > 10 % ; relevé publié 19,9 %) : {"OK" if mt_gain > 10 else "ÉCHEC"}.')
L.append(f'- Témoin d\'identité : ligne « aucune » = page d\'origine : {"OK" if ident else "ÉCHEC"}.\n')

# --- tailles ---
L.append('## Gain de taille, total du corpus\n')
L.append('Somme des octets de toutes les pages, avant et après minification.\n')
L.append('| Mode | Minificateur | Pages minifiées | Brut | gzip 6 | Brotli 5 | Brotli 11 |')
L.append('|---|---|---|---|---|---|---|')
tot = {k: sum(o[k] for o in orig.values()) for k in ['brut', 'gz6', 'br5', 'br11']}
L.append(f'| | aucune (total du corpus) | {N} | {ko(tot["brut"]):,.0f} Kio | {ko(tot["gz6"]):,.0f} Kio | {ko(tot["br5"]):,.0f} Kio | {ko(tot["br11"]):,.0f} Kio |'.replace(',', ' '))
par_couple = {}
for m, n in couples:
    rs = [r for r in rows if r['mode'] == m and r['minificateur'] == n]
    ok = sum(1 for r in rs if r['statut'] == 'ok')
    s = {k: sum(r[k] for r in rs) for k in ['brut', 'gz6', 'br5', 'br11']}
    g = {k: pct(tot[k], s[k]) for k in s}
    par_couple[(m, n)] = rs
    L.append(f'| {MODES[m].split(" (")[0]} | {NOMS[n]} | {ok}/{N} | −{g["brut"]:.1f} % | −{g["gz6"]:.1f} % | −{g["br5"]:.1f} % | −{g["br11"]:.1f} % |')

L.append('\n## Gain par page, médiane [P10, P90]\n')
L.append('| Mode | Minificateur | Brut (%) | Brotli 5 (%) | Brotli 11 (%) | Brotli 5, octets gagnés (Kio) | Brotli 11, octets gagnés (Kio) |')
L.append('|---|---|---|---|---|---|---|')
def q(v):
    v = sorted(v); c = statistics.quantiles(v, n=10)
    return statistics.median(v), c[0], c[-1]
for (m, n), rs in par_couple.items():
    pb = [pct(orig[r['fichier']]['brut'], r['brut']) for r in rs]
    p5 = [pct(orig[r['fichier']]['br5'], r['br5']) for r in rs]
    p11 = [pct(orig[r['fichier']]['br11'], r['br11']) for r in rs]
    a5 = [ko(orig[r['fichier']]['br5'] - r['br5']) for r in rs]
    a11 = [ko(orig[r['fichier']]['br11'] - r['br11']) for r in rs]
    f = lambda t, d=1: f'{t[0]:.{d}f} [{t[1]:.{d}f}, {t[2]:.{d}f}]'
    L.append(f'| {MODES[m].split(" (")[0]} | {NOMS[n]} | {f(q(pb))} | {f(q(p5))} | {f(q(p11))} | {f(q(a5))} | {f(q(a11))} |')

ob5 = [ko(o['br5']) for o in orig.values()]
L.append(f'\nPage d\'origine après Brotli 5 : médiane {statistics.median(ob5):.1f} Kio [P10 {statistics.quantiles(ob5, n=10)[0]:.1f}, P90 {statistics.quantiles(ob5, n=10)[-1]:.1f}].\n')

# --- conservation ---
L.append('## Conservation du contenu\n')
L.append('Pages où la sortie diffère de l\'origine (sorties réussies seulement). Texte : texte visible (hors `script`, `style`, `template`, `noscript`), entités décodées, sans aucun blanc, différent de celui de l\'origine.\n')
L.append('| Mode | Minificateur | Texte | Moins de `a` | Moins de `img` | Moins de `script` à `src` | Moins de `link` | Moins de `use` | `i` vides retirés (pages, éléments) | `span` vides retirés (pages, éléments) |')
L.append('|---|---|---|---|---|---|---|---|---|---|')
for (m, n), rs in par_couple.items():
    rs = [r for r in rs if r['statut'] == 'ok']
    def moins(k):
        return sum(1 for r in rs if r[k] < orig[r['fichier']][k])
    tx = sum(1 for r in rs if r['texte_sha'] != orig[r['fichier']]['texte_sha'])
    iv = [orig[r['fichier']]['i_vide'] - r['i_vide'] for r in rs]
    sv = [orig[r['fichier']]['span_vide'] - r['span_vide'] for r in rs]
    L.append(f'| {MODES[m].split(" (")[0]} | {NOMS[n]} | {tx} | {moins("a")} | {moins("img")} | {moins("script_src")} | {moins("link")} | {moins("use")} | '
             f'{sum(1 for x in iv if x > 0)}, {sum(x for x in iv if x > 0)} | {sum(1 for x in sv if x > 0)}, {sum(x for x in sv if x > 0)} |')
pi = sum(1 for o in orig.values() if o['i_vide'] > 0); ps = sum(1 for o in orig.values() if o['span_vide'] > 0)
L.append(f'\nPages d\'origine qui ont au moins un `i` vide : {pi}/{N} ; au moins un `span` vide : {ps}/{N}.\n')

ech = list(csv.DictReader(open('brut/echecs.tsv'), delimiter='\t'))
L.append(f'## Échecs\n\n{len(ech)} échec(s) de minification, détail dans `brut/echecs.tsv`.')
for e in ech[:40]:
    L.append(f'- {e["mode"]}, {NOMS.get(e["minificateur"], e["minificateur"])}, {e["fichier"]} : {e["message"]}')
open('RESULTATS.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
if mt_gain <= 10 or not ident:
    sys.exit(1)
