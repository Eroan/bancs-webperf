#!/usr/bin/env python3
"""Synthèse du banc dedoublonnage-declarations-css : lit brut/*.json, écrit RESULTATS.md (chaque chiffre cité ailleurs en vient)."""
import glob
import json
import os
import re
import statistics
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(ICI, "brut")
lire = lambda n: json.load(open(os.path.join(B, n), encoding="utf-8"))

T = lire("tailles.json")
D = lire("dedoublonnage.json")
C = lire("conservation.json")
W = lire("temoins.json")
M = open(os.path.join(B, "machine.txt"), encoding="utf-8").read().strip()
RS = lire("rendu-structure.json")
series = sorted(glob.glob(os.path.join(B, "rendu-t*.json")), key=lambda f: re.search(r"-(\d{12})", f).group(1))
if not series:
    sys.exit("aucune série chronométrée dans brut/ (rendu-t*.json)")
RT = json.load(open(series[-1], encoding="utf-8"))

FICHIERS = list(dict.fromkeys(m["fichier"] for m in T))
MODES = ["f", "fs", "fa", "fas"]
LIB_MODE = {"aucun": "aucun", "f": "`-f`", "fs": "`-f -s`", "fa": "`-f -a`", "fas": "`-f -a -s`"}
MINIFS = ["aucune", "lightningcss", "cssnano", "csso", "cleancss1", "cleancss2"]
LIB_MIN = {"aucune": "aucune", "lightningcss": "Lightning CSS", "cssnano": "cssnano", "csso": "csso",
           "cleancss1": "clean-css niv. 1", "cleancss2": "clean-css niv. 2"}
idx = {(m["fichier"], m["mode"], m["minif"]): m for m in T}
dd = {(d["fichier"], d["mode"]): d for d in D}
assert len(T) == len(FICHIERS) * 31, f"{len(T)} mesures"

def nb(n):
    return f"{n:,}".replace(",", " ")

def delta(v, base):
    d = v - base
    return f"{'+' if d > 0 else ''}{nb(d)} ({'+' if d > 0 else ''}{d / base * 100:.1f} %)".replace(".", ",")

def pct(v, base):
    d = (v - base) / base * 100
    return f"{'+' if d > 0 else ''}{d:.1f} %".replace(".", ",")

out = []
w = out.append
w("# Résultats : dédoublonner les déclarations CSS (UDJO), poids, compression et rendu\n")
w("Produit par `synthese.py` depuis `brut/` ; protocole dans `PROTOCOLE.md`. Tout chiffre cité ailleurs vient de ce fichier.\n")
w("```\n" + M + "\n```\n")

# 1. structure
w("## 1. Corpus, constats et structure\n")
w("Constats = groupes signalés par l'analyse (`analyze()`, mode par défaut). Sélecteurs = listes dépliées, comptés par PostCSS.\n")
w("| Feuille | Octets | Constats | Règles | Sélecteurs | Sélecteurs `-f` | `-f -s` | `-f -a` | `-f -a -s` |")
w("|---|---|---|---|---|---|---|---|---|")
for f in FICHIERS:
    s0 = dd[(f, "aucun")]["structure"]
    cells = [pct(dd[(f, m)]["structure"]["selecteurs"], s0["selecteurs"]) for m in MODES]
    w(f"| `{f}` | {nb(idx[(f, 'aucun', 'aucune')]['brut'])} | {dd[(f, 'aucun')]['constats']} | {nb(s0['regles'])} | {nb(s0['selecteurs'])} | " + " | ".join(cells) + " |")
w("")
w("Fusions appliquées / groupes ignorés comme non sûrs / fusions retenues par `-s` :\n")
w("| Feuille | `-f` | `-f -s` | `-f -a` | `-f -a -s` |")
w("|---|---|---|---|---|")
for f in FICHIERS:
    w(f"| `{f}` | " + " | ".join(f"{dd[(f, m)]['appliques']} / {dd[(f, m)]['ignores']} / {dd[(f, m)]['retenus']}" for m in MODES) + " |")
w("")

# 2. brut sans minification (le tableau du billet)
w("## 2. Taille brute, sans minification (forme du tableau du billet)\n")
w("| Feuille | `-f` | `-f -s` | `-f -a` | `-f -a -s` |")
w("|---|---|---|---|---|")
for f in FICHIERS:
    b = idx[(f, "aucun", "aucune")]["brut"]
    w(f"| `{f}` | " + " | ".join(delta(idx[(f, m, 'aucune')]['brut'], b) for m in MODES) + " |")
n_f_grossit = sum(idx[(f, "f", "aucune")]["brut"] > idx[(f, "aucun", "aucune")]["brut"] for f in FICHIERS)
n_fs_reduit = sum(idx[(f, "fs", "aucune")]["brut"] < idx[(f, "aucun", "aucune")]["brut"] for f in FICHIERS)
w(f"\n`-f` grossit {n_f_grossit} feuilles sur {len(FICHIERS)} ; `-f -s` en réduit {n_fs_reduit} sur {len(FICHIERS)}.\n")

# 3. chaîne complète par feuille
w("## 3. Après minification et compression, par feuille\n")
w("Écart de chaque mode à la même minification sans dédoublonnage : octets bruts, gzip 6, Brotli 5, Brotli 11.\n")
for f in FICHIERS:
    w(f"### `{f}`\n")
    w("| Minification | Base brut / br11 | `-f` brut, gz6, br5, br11 | `-f -s` | `-f -a -s` |")
    w("|---|---|---|---|---|")
    for mi in MINIFS:
        b = idx[(f, "aucun", mi)]
        cells = []
        for m in ["f", "fs", "fas"]:
            x = idx[(f, m, mi)]
            cells.append(", ".join(f"{'+' if x[k] - b[k] > 0 else ''}{nb(x[k] - b[k])}" for k in ["brut", "gzip6", "br5", "br11"]))
        w(f"| {LIB_MIN[mi]} | {nb(b['brut'])} / {nb(b['br11'])} | " + " | ".join(cells) + " |")
    inv = idx[(f, "lightningcss+fs", "inverse")]
    bl = idx[(f, "aucun", "lightningcss")]
    w(f"\nVariante inverse (Lightning CSS puis `-f -s`, {inv['appliques']} fusion(s)) : " + ", ".join(
        f"{k} {'+' if inv[k] - bl[k] > 0 else ''}{nb(inv[k] - bl[k])}" for k in ["brut", "gzip6", "br5", "br11"]) + ".\n")

# 4. agrégats
w("## 4. Agrégats sur les 8 feuilles et les 6 minifications (48 couples)\n")
w("| Mode | brut réduit | gzip 6 réduit | Brotli 5 réduit | Brotli 11 réduit | Brotli 11 : écart médian [min, max] |")
w("|---|---|---|---|---|---|")
for m in MODES:
    paires = [(idx[(f, m, mi)], idx[(f, "aucun", mi)]) for f in FICHIERS for mi in MINIFS]
    cnt = lambda k: sum(x[k] < b[k] for x, b in paires)
    ecarts = [(x["br11"] - b["br11"]) / b["br11"] * 100 for x, b in paires]
    w(f"| {LIB_MODE[m]} | {cnt('brut')}/48 | {cnt('gzip6')}/48 | {cnt('br5')}/48 | {cnt('br11')}/48 | "
      f"{statistics.median(ecarts):+.2f} % [{min(ecarts):+.2f}, {max(ecarts):+.2f}] |".replace(".", ","))
w("")
w("Minification seule contre dédoublonnage seul (octets bruts, écart à la feuille d'origine) :\n")
w("| Feuille | Lightning CSS seul | cssnano seul | `-f -a -s` seul | `-f -a -s` puis Lightning CSS |")
w("|---|---|---|---|---|")
for f in FICHIERS:
    b = idx[(f, "aucun", "aucune")]["brut"]
    w(f"| `{f}` | {pct(idx[(f, 'aucun', 'lightningcss')]['brut'], b)} | {pct(idx[(f, 'aucun', 'cssnano')]['brut'], b)} | "
      f"{pct(idx[(f, 'fas', 'aucune')]['brut'], b)} | {pct(idx[(f, 'fas', 'lightningcss')]['brut'], b)} |")
w("")

# 5. conservation
ALIAS = {"word-wrap": "overflow-wrap", "grid-gap": "gap", "grid-row-gap": "row-gap", "grid-column-gap": "column-gap"}
def canon(prop, v):
    v = v.strip().lower()
    v = re.sub(r"(?<![\w.])0(?:px|rem|em|%|vh|vw|svh|cqw)(?![\w])", "0", v)
    v = re.sub(r"\b(0)( 0)+\b", "0", v)
    if "font-weight" in prop:
        v = {"bold": "700", "normal": "400"}.get(v, v)
    if re.match(r"^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?( !important)?$", prop):
        v = {"none": "0"}.get(v, v)
    return v
w("## 5. Conservation des déclarations (feuilles réelles)\n")
w("Couple perdu = (portée, sélecteur, propriété, valeur) présent avant et absent après. « Équivalent » : la sortie porte, pour ce "
  "sélecteur et cette propriété (ou son alias), une valeur de même forme canonique (`bold`/`700`, `normal`/`400`, `none`/`0` "
  "sur une bordure, zéro sans unité, valeur répétée).\n")
w("| Feuille | Mode | Couples perdus | dont équivalents | non expliqués |")
w("|---|---|---|---|---|")
non_expliques = 0
for c in C:
    if not c["perdus"]:
        continue
    eq = 0
    for v in c["voisins"]:
        k, val = v["perdu"].rsplit(" = ", 1)
        prop = k.split(" | ")[2]
        if any(canon(prop, s.rsplit(" = ", 1)[1]) == canon(prop, val) or prop.split(" ")[0] in ALIAS for s in v["sortie"]):
            eq += 1
    non_expliques += c["perdus"] - eq
    w(f"| `{c['fichier']}` | {LIB_MODE[c['mode']]} | {c['perdus']} | {eq} | {c['perdus'] - eq} |")
sans = len(C) - sum(1 for c in C if c["perdus"])
w(f"\n{sans} sorties sur {len(C)} sans aucun couple perdu ; couples perdus non expliqués : {non_expliques}.\n")

# 6. témoins de cascade
w("## 6. Témoins de cascade (Chrome)\n")
w("| Cas | Référence | Fusion naïve | `-f` | `-f -a` | `-f` sans liste d'exclusion |")
w("|---|---|---|---|---|---|")
col = lambda r: ", ".join(f"{k} {v}" for k, v in r.items())
for t in W:
    cells = []
    for v in ["f", "fa", "f-sans-liste"]:
        x = t["variantes"][v]
        etat = "fusionné" if x["appliques"] else "non fusionné"
        cells.append(f"{etat}, {'**rendu changé**' if x['change'] else 'rendu inchangé'}")
    w(f"| `{t['cas']}` | {col(t['reference'])} | {'**rendu changé**' if t['naif_change'] else 'rendu inchangé'} | " + " | ".join(cells) + " |")
w("")
for t in W:
    for v in ["f", "fa", "f-sans-liste"]:
        x = t["variantes"][v]
        if x["ignores"]:
            w(f"- `{t['cas']}`, {v} : raison donnée par l'outil : « {x['ignores'][0]} »")
w("")

# 7. rendu : structure et équivalence
w(f"## 7. Rendu d'une page réelle : règles appariées et styles calculés (Bootstrap 5.3.8, Chrome {RS['chrome']})\n")
w("Variantes minifiées par Lightning CSS. Règles appariées : somme sur les éléments (pseudo-éléments compris) des règles "
  "d'auteur appariées. Écarts : éléments (ou pseudo-éléments) dont au moins un style calculé diffère de l'origine.\n")
w("| Page | Variante | Octets de la feuille | Éléments | Règles appariées | Écart | Max par élément | Écarts de style calculé |")
w("|---|---|---|---|---|---|---|---|")
for x in RS["structure"]:
    o = next(y for y in RS["structure"] if y["page"] == x["page"] and y["variante"] == "origine")
    w(f"| {x['page']} | {x['variante']} | {nb(RT['octets'][x['variante']])} | {nb(x['elements'])} | {nb(x['regles_appariees'])} | "
      f"{pct(x['regles_appariees'], o['regles_appariees'])} | {x['max_par_element']} | {x['ecarts_rendu']['n']} |")
w("")
w("Statistiques de sélecteurs de Chrome sur un recalcul complet forcé (feuilles d'auteur ; durée sous trace, indicative) :\n")
w("| Page | Variante | Éléments recalculés | Tentatives | Écart | Correspondances | Rejets rapides | µs sous trace |")
w("|---|---|---|---|---|---|---|---|")
for x in RS["structure"]:
    o = next(y for y in RS["structure"] if y["page"] == x["page"] and y["variante"] == "origine")["selecteurs_chrome"]
    s_ = x["selecteurs_chrome"]
    w(f"| {x['page']} | {x['variante']} | {nb(s_['elements_recalcules'])} | {nb(s_['tentatives'])} | {pct(s_['tentatives'], o['tentatives'])} | "
      f"{nb(s_['correspondances'])} | {nb(s_['rejets_rapides'])} | {nb(s_['us'])} |")
w("")
for x in RS["structure"]:
    if x["ecarts_rendu"]["n"] and x["variante"] != "origine":
        w(f"Exemples d'écarts, {x['page']} / {x['variante']} :\n")
        for e in x["ecarts_rendu"]["exemples"][:4]:
            w(f"- `{e['element']}` ({e['cible']}) : " + " ; ".join(f"`{p}`" for p in e["proprietes"][:4]))
        w("")

# 8. rendu : durées
w(f"## 8. Durée du recalcul de style (série `{os.path.basename(series[-1])}`)\n")
w(f"{RT['passages']} passages par variante et par page, ordre tourné, échauffement jeté. Médiane [min, max] en ms par recalcul ; "
  f"écart des médianes à l'origine. Départ : {RT['idle']}.\n")
w("- « display » : `body` en `display: none` puis rendu, " + str(RT["boucle"]) + " fois (arbre de rendu reconstruit) ;")
w("- « classe » : classe basculée sur `html`, " + str(2 * RT["boucle"]) + " fois, règle `html.banc-bascule *` injectée hors de la feuille testée.\n")
w("Témoin de durée (plus courte mesure de `double` au-dessus de la plus longue de l'origine) :\n")
w("| Niveau | Page | Déclencheur | Origine, max | Double, min | Témoin |")
w("|---|---|---|---|---|---|")
for t in RT["temoin"]:
    w(f"| ×{t['taux']} | {t['page']} | {'display' if t['mesure'] == 'recalc_ms' else 'classe'} | {t['origine_max']:.3f} | {t['double_min']:.3f} | {'passé' if t['ok'] else '**échoué**'} |".replace(".", ","))
pub = RT.get("mesures_publiables", {})
w(f"\nMesures publiables comme écart (témoin passé partout) : {', '.join(m for m, ok in pub.items() if ok) or 'aucune'}. "
  "Sans témoin passé partout, les médianes ci-dessous ne se citent que comme borne.\n")
for taux, lignes in RT["series"].items():
    w(f"### Processeur ×{taux}\n")
    w("| Page | Variante | « display » | Écart | « classe » | Écart | Recalcul au chargement | Écart |")
    w("|---|---|---|---|---|---|---|---|")
    pages = list(dict.fromkeys(l["page"] for l in lignes))
    variantes = list(dict.fromkeys(l["variante"] for l in lignes))
    ordre = ["origine", "f", "fs", "fa", "fas", "double"]
    for p in pages:
        base = {}
        for v in sorted(variantes, key=ordre.index):
            cells = []
            for k in ["recalc_ms", "classe_ms", "chargement_recalc_ms"]:
                x = [l[k] for l in lignes if l["page"] == p and l["variante"] == v]
                m = statistics.median(x)
                if v == "origine":
                    base[k] = (m, min(x), max(x))
                    cells += [f"{m:.2f} [{min(x):.2f}, {max(x):.2f}]", "—"]
                else:
                    recouvre = not (min(x) > base[k][2] or max(x) < base[k][1])
                    cells += [f"{m:.2f} [{min(x):.2f}, {max(x):.2f}]", f"{(m - base[k][0]) / base[k][0] * 100:+.1f} %{' (recouvrantes)' if recouvre else ''}"]
            w((f"| {p} | {v} | " + " | ".join(cells) + " |").replace(".", ","))
    w("")

open(os.path.join(ICI, "RESULTATS.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print(f"RESULTATS.md écrit : {len(T)} mesures de taille, {len(C)} contrôles de conservation, {len(W)} témoins, "
      f"{len(RS['structure'])} rendus, série {os.path.basename(series[-1])}")
