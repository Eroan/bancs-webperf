#!/usr/bin/env python3
"""Synthèse du banc « report à la première interaction » : lit les JSON bruts d'un dossier de série
(serie-cpu*.json de banc.mjs, lh-*.json de lh-banc.sh) et imprime RESULTATS en Markdown.
Chaque chiffre sort des données brutes ; chaque proportion porte son numérateur, son dénominateur et son critère.

Usage : python3 synthese.py <dossier>  [> RESULTATS.md]
"""
import glob, gzip, json, os, statistics, sys

DOSSIER = sys.argv[1] if len(sys.argv) > 1 else 'brut'
ORDRE = ['A', 'B', 'C', 'E', 'D']
NOMS = {'A': 'classique', 'B': 'defer', 'C': 'report-tiers (AWP)', 'E': 'report hors mesure (AWP)', 'D': 'tout reporter (WP Rocket)'}
SEUIL_IMMEDIAT = 200      # ms entre le relâchement du doigt et l'effet : au-delà, « différé » (seuil « bon » de l'INP)
TAP_MS = 60               # durée du tap synthétisé (banc.mjs, synthesizeTapGesture) : pointerup et click arrivent 60 ms après pointerdown
DEPARTS = [3000, 5000, 10000, 20000]


def mm(v, unite=''):
    v = [x for x in v if x is not None]
    if not v:
        return 'n/a'
    s = sorted(v)
    return f"{round(statistics.median(s))}{unite} [{round(s[0])}, {round(s[-1])}]"


def compte(n, N, critere):
    return f"{n}/{N}" + (f" ({critere})" if critere else '')


def hit(r, k):
    h = [x['t'] for x in r['hits'] if x['k'] == k]
    return min(h) if h else None


def blocage(r, fin=10000):
    """Somme des parts > 50 ms des tâches longues entre FCP et fin (observé, pas le TBT de Lighthouse)."""
    debut = r.get('fcp') or 0
    return sum(max(0, d - 50) for s, d in r['lt'] if debut <= s < fin)


def geste(r, cible, apres, avant=None, etat=None):
    """Premier pointerdown sur la cible après `apres` ; son effet, compté depuis le relâchement du doigt
    (pointerdown + TAP_MS) et cherché avant `avant` (geste suivant) ; durée Event Timing de l'interaction
    (entrées datées entre le pointerdown et 200 ms après). `etat` : pour le menu, état attendu après le geste."""
    p = next(((t, c) for t, c in r['ptr'] if c == cible and t >= apres - 50), None)
    if not p:
        return None
    t = p[0]
    fin = avant if avant is not None else 10 ** 9
    if cible == 'faq-q1':
        eff = r['effets'].get('faq')
        eff = eff if eff is not None and t <= eff < fin else None
    else:
        menu = r.get('menu') or ([[r['effets']['menu'], True]] if r['effets'].get('menu') is not None else [])   # sondes antérieures au suivi des bascules
        voulu = True if etat is None else etat
        eff = next((x[0] for x in menu if x[1] == voulu and t <= x[0] < fin), None)
    ids = {e[5] for e in r['ev'] if t - 10 <= e[1] <= t + 200}
    dur = max((e[2] for e in r['ev'] if e[5] in ids), default=None)
    return {'t': t, 'effet': eff, 'delai': (eff - t - TAP_MS) if eff is not None else None, 'et': dur}


def issue(g):
    if g is None:
        return 'non joué'
    if g['delai'] is None:
        return 'perdu'
    return 'immédiat' if g['delai'] <= SEUIL_IMMEDIAT else 'différé'


def series():
    out = {}
    for f in sorted(glob.glob(os.path.join(DOSSIER, 'serie-cpu*.json'))):
        d = json.load(open(f))
        cle = (d['cpu'], d['reseau'])
        out.setdefault(cle, {'meta': [], 'brut': []})
        out[cle]['meta'].append({k: d[k] for k in ('chrome', 'playwright', 'date', 'passages')} | {'fichier': os.path.basename(f)})
        out[cle]['brut'] += d['brut']
    return out


def section(cpu, reseau, S):
    B = S['brut']
    p = print
    p(f"\n## CPU ×{cpu}, réseau {reseau}\n")
    for m in S['meta']:
        p(f"- `{m['fichier']}` : Chrome {m['chrome']}, Playwright {m['playwright']}, {m['passages']} passage(s), {m['date']}")
    err = [r for r in B if r['erreurs']]
    p(f"- Passages lus : {len(B)} ; passages avec erreur JavaScript : {compte(len(err), len(B), '')}"
      + ('' if not err else ' : ' + '; '.join(sorted({e for r in err for e in r['erreurs']}))[:300]))
    ko = [r for r in B if any(not a.get('ok', True) for a in r['actions'])]
    p(f"- Passages dont un geste a échoué côté banc (écartés) : {compte(len(ko), len(B), '')}")
    retards = [a['retardMs'] for r in B for a in r['actions']]
    if retards:
        p(f"- Retard des gestes sur l'horaire prévu : {mm(retards, ' ms')}")
    B = [r for r in B if r not in ko]

    # témoin
    T = [r for r in B if r['scenario'] == 'temoin' and r['variante'] in ('A', 'B')]
    if T:
        proc = [e[4] for r in T for e in r['ev'] if e[0] == 'click' and e[6] == 'temoin']
        dur = [e[2] for r in T for e in r['ev'] if e[0] == 'click' and e[6] == 'temoin']
        ok = [x for x in proc if 95 <= x <= 130]
        p(f"- Témoin (gestionnaire de 100 ms, A et B) : traitement {mm(proc, ' ms')}, durée Event Timing {mm(dur, ' ms')} ; "
          f"{compte(len(ok), len(proc), 'traitement entre 95 et 130 ms')}")

    # chargement, visiteur passif
    P = [r for r in B if r['scenario'] == 'passif']
    if P:
        p("\n### Visiteur sans geste (20 s)\n")
        p("| Variante | FCP | LCP | Thème prêt (jQuery ready) | Blocage observé de FCP à 10 s | GA4 page_view | Meta PageView | Chat affiché |")
        p("|---|---|---|---|---|---|---|---|")
        for v in ORDRE:
            R = [r for r in P if r['variante'] == v]
            if not R:
                continue
            def pres(k):
                t = [hit(r, k) for r in R]
                n = sum(1 for x in t if x is not None)
                return f"{mm(t, ' ms')}, {n}/{len(R)} reçus"
            chat = [r['chat'][0]['t'] if r['chat'] else None for r in R]
            p(f"| {v} {NOMS[v]} | {mm([r['fcp'] for r in R], ' ms')} | {mm([r['lcp'][-1][0] if r['lcp'] else None for r in R], ' ms')} | "
              f"{mm([next((m[1] for m in r['marks'] if m[0] == 'theme-ready'), None) for r in R], ' ms')} | "
              f"{mm([blocage(r) for r in R], ' ms')} | {pres('ga:page_view')} | {pres('fb:PageView')} | "
              f"{mm(chat, ' ms')}, {sum(1 for x in chat if x is not None)}/{len(R)} |")
        p("\nMesure d'audience reçue si le visiteur part à l'instant t (GA4 page_view arrivé avant t ; passages sans geste) :\n")
        p("| Variante | " + " | ".join(f"départ à {d // 1000} s" for d in DEPARTS) + " |")
        p("|---|" + "---|" * len(DEPARTS))
        for v in ORDRE:
            R = [r for r in P if r['variante'] == v]
            if not R:
                continue
            cells = []
            for d in DEPARTS:
                n = sum(1 for r in R if (hit(r, 'ga:page_view') or 10 ** 9) < d)
                cells.append(f"{n}/{len(R)}")
            p(f"| {v} {NOMS[v]} | " + " | ".join(cells) + " |")

    # gestes
    for sc, titre in (('tap2', 'à 2 s'), ('tap4', 'à 4 s'), ('tap7', 'à 7 s')):
        R0 = [r for r in B if r['scenario'] == sc]
        if not R0:
            continue
        p(f"\n### Tap sur la FAQ {titre}, puis sur le menu 1,5 s plus tard\n")
        p(f"Issue : immédiat = effet visible ≤ {SEUIL_IMMEDIAT} ms après le relâchement du doigt ; différé = plus tard ; perdu = aucun effet en 20 s. "
          "« Event Timing » = durée de l'interaction telle que l'INP la verrait.\n")
        p("| Variante | Cible | Immédiat | Différé | Perdu | Délai jusqu'à l'effet | Event Timing |")
        p("|---|---|---|---|---|---|---|")
        for v in ORDRE:
            R = [r for r in R0 if r['variante'] == v]
            if not R:
                continue
            for cible, nom in (('faq-q1', 'FAQ'), ('burger', 'menu')):
                G = []
                for r in R:
                    t_prevu = {'tap2': 2000, 'tap4': 4000, 'tap7': 7000}[sc] + (0 if cible == 'faq-q1' else 1500)
                    G.append(geste(r, cible, t_prevu))
                iss = [issue(g) for g in G]
                p(f"| {v} {NOMS[v]} | {nom} | {iss.count('immédiat')}/{len(G)} | {iss.count('différé')}/{len(G)} | {iss.count('perdu')}/{len(G)} | "
                  f"{mm([g['delai'] for g in G if g], ' ms')} | {mm([g['et'] for g in G if g], ' ms')} |")

    R0 = [r for r in B if r['scenario'] == 'scrolltap']
    if R0:
        p("\n### Défilement à 1,5 s, menu tapé à 2,5 s puis retapé à 4 s\n")
        p("Attendu : menu ouvert au premier tap, visible, refermé au second. Effet d'un tap = bascule du menu avant le tap suivant "
          "(un effet survenu après le second tap n'est pas compté au premier). « Vu ouvert » = resté ouvert au moins 16 ms (une image).\n")
        p("| Variante | Tap 1 (ouvrir) : immédiat / différé / perdu | Délai du tap 1 | Tap 2 (fermer) : immédiat / différé / perdu | Vu ouvert | Fermé à la fin | Clics rejoués (non fiables) |")
        p("|---|---|---|---|---|---|---|")
        for v in ORDRE:
            R = [r for r in R0 if r['variante'] == v]
            if not R:
                continue
            G, G2 = [], []
            for r in R:
                t2 = next((t for t, c in r['ptr'] if c == 'burger' and t >= 3950), None)
                G.append(geste(r, 'burger', 2500, avant=t2))
                G2.append(geste(r, 'burger', 4000, etat=False))
            iss = [issue(g) for g in G]
            iss2 = [issue(g) for g in G2]
            vu = 0
            for r in R:
                m = r.get('menu', [])
                if any(m[i][1] and (i + 1 == len(m) or m[i + 1][0] - m[i][0] >= 16) for i in range(len(m))):
                    vu += 1
            ferme = sum(1 for r in R if not r['menuOuvert'])
            rejoues = [sum(1 for c in r.get('clics', []) if not c[1]) for r in R]
            p(f"| {v} {NOMS[v]} | {iss.count('immédiat')} / {iss.count('différé')} / {iss.count('perdu')} sur {len(G)} | {mm([g['delai'] for g in G if g], ' ms')} | "
              f"{iss2.count('immédiat')} / {iss2.count('différé')} / {iss2.count('perdu')} sur {len(G2)} | {vu}/{len(R)} | {ferme}/{len(R)} | {mm(rejoues)} |")


def lighthouse():
    F = sorted(glob.glob(os.path.join(DOSSIER, 'lh', 'lh-*.json')) + glob.glob(os.path.join(DOSSIER, 'lh', 'lh-*.json.gz')))   # rapports archivés en gzip
    if not F:
        return
    print("\n## Lighthouse 13.5.0, mobile, throttling simulé (aucun geste)\n")
    rows = {}
    for f in F:
        d = json.load(gzip.open(f, 'rt') if f.endswith('.gz') else open(f))
        n = os.path.basename(f)          # lh-cpu<m>-<V>-<k>.json[.gz]
        cpu, v = n.split('-')[1], n.split('-')[2]
        a = d['audits']
        rows.setdefault((cpu, v), []).append({
            'score': round(d['categories']['performance']['score'] * 100),
            'lcp': a['largest-contentful-paint']['numericValue'], 'tbt': a['total-blocking-time']['numericValue'],
            'fcp': a['first-contentful-paint']['numericValue'], 'bi': d['environment']['benchmarkIndex'],
            'mult': d['configSettings']['throttling']['cpuSlowdownMultiplier']})
    print("| Multiplicateur | Variante | Score | FCP | LCP | TBT | benchmarkIndex de l'hôte |")
    print("|---|---|---|---|---|---|---|")
    for (cpu, v) in sorted(rows, key=lambda k: (int(k[0][3:]), ORDRE.index(k[1]))):
        R = rows[(cpu, v)]
        print(f"| ×{R[0]['mult']} | {v} {NOMS[v]} | {mm([x['score'] for x in R])} | {mm([x['fcp'] for x in R], ' ms')} | "
              f"{mm([x['lcp'] for x in R], ' ms')} | {mm([x['tbt'] for x in R], ' ms')} | {mm([x['bi'] for x in R])} |")


S = series()
if not S and not glob.glob(os.path.join(DOSSIER, 'lh', 'lh-*.json*')):
    print(f"AUCUNE DONNÉE dans {DOSSIER}", file=sys.stderr)
    sys.exit(1)
print(f"# Résultats : report des scripts à la première interaction\n\nDossier lu : `{DOSSIER}`.")
cal = os.path.join(DOSSIER, 'calibrage.json')
if os.path.exists(cal):
    c = json.load(open(cal))
    taux = sorted({x['taux'] for x in c['res']})
    print("\nCalibrage (indice de Lighthouse calculé dans la page) : " + ", ".join(
        f"×{t} → {mm([x['bi'] for x in c['res'] if x['taux'] == t])}" for t in taux) + f" ; Chrome {c['chrome']}.")
for (cpu, reseau) in sorted(S):
    section(cpu, reseau, S[(cpu, reseau)])
lighthouse()
