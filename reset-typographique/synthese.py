#!/usr/bin/env python3
"""Synthèse du banc « reset typographique » : lit <dossier>/mesures.json et polices.json, imprime RESULTATS en Markdown.
Une valeur qui varie d'un passage à l'autre s'imprime en plage. Usage : python3 synthese.py <dossier> [> RESULTATS.md]"""
import json, os, sys

D = json.load(open(os.path.join(sys.argv[1], "mesures.json"), encoding="utf-8"))
P = json.load(open(os.path.join(sys.argv[1], "polices.json"), encoding="utf-8"))
V = open(os.path.join(sys.argv[1], "versions.txt"), encoding="utf-8").read()
M, VERS = D["mesures"], D["versions"]
MOTEURS = ["chrome", "firefox", "webkit"]
NOMS = {"chrome": f"Chrome {VERS['chrome']}", "firefox": f"Firefox {VERS['firefox']}", "webkit": f"WebKit {VERS['webkit']} (Playwright)"}
serie = os.path.basename(os.path.normpath(sys.argv[1]))


def lire(moteur, *chemin):
    """Valeurs d'un même champ sur tous les passages."""
    sortie = []
    for passage in M[moteur]:
        v = passage
        for c in chemin:
            v = v[c]
        sortie.append(v)
    return sortie


def fmt(valeurs):
    if all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in valeurs):
        a, b = min(valeurs), max(valeurs)
        return f"{a:g}" if a == b else f"{a:g} à {b:g}"
    u = []
    for v in valeurs:
        s = {True: "oui", False: "non", None: "—"}.get(v, str(v)) if isinstance(v, (bool, type(None))) else str(v)
        if s not in u:
            u.append(s)
    return " ; ".join(u)


def cell(moteur, *chemin):
    return fmt(lire(moteur, *chemin))


def tableau(titres, lignes):
    print("| " + " | ".join(titres) + " |")
    print("|" + "---|" * len(titres))
    for l in lignes:
        print("| " + " | ".join(str(x) for x in l) + " |")
    print()


def par_moteur(libelles):
    """libelles : [(texte, (chemin…))] ; une colonne par moteur."""
    tableau(["Mesure"] + [NOMS[m] for m in MOTEURS], [[t] + [cell(m, *c) for m in MOTEURS] for t, c in libelles])


print("# Résultats : reset typographique CSS\n")
print(f"Série `{serie}` : {D['passages']} passages, moteurs ci-dessous, Playwright 1.64.1, puppeteer-core 25.15.0, fonttools {P['fonttools']}. "
      "Protocole : `PROTOCOLE.md`. Une plage signale une valeur qui a varié d'un passage à l'autre.\n")
print("```\n" + V.strip() + "\n```\n")

print("## Bascule de police : `font-size-adjust`\n")
print("Verdana servie à 1,5 s, repli Times New Roman, `font-display: swap`. Témoin : `document.fonts.status` à `loading` pendant, `loaded` après.\n")
lignes = []
for v in ["none", "from-font", "0.545"]:
    lignes += [
        (f"`{v}` : nombre calculé, pendant puis après", None, v, "nombre"),
        (f"`{v}` : largeur de la ligne, pendant puis après (px)", None, v, "largeur"),
        (f"`{v}` : hauteur du paragraphe, pendant puis après (px)", None, v, "hauteur"),
    ]
tableau(["Mesure"] + [NOMS[m] for m in MOTEURS],
        [[t] + [cell(m, "bascule", v, "pendant", c) + " → " + cell(m, "bascule", v, "apres", c) for m in MOTEURS] for t, _, v, c in lignes])

print("## Héritage du nombre calculé par `from-font`\n")
print("`body` en Verdana 16 px, `code` en Courier New, `h2` en Georgia 32 px.\n")
par_moteur([
    ("`code`, `none` : largeur (px)", ("heritage", "none", "c", "largeur")),
    ("`code`, `from-font` : largeur (px)", ("heritage", "from-font", "c", "largeur")),
    ("`code`, `from-font` : nombre calculé", ("heritage", "from-font", "c", "nombre")),
    ("`h2`, `none` : largeur (px)", ("heritage", "none", "g", "largeur")),
    ("`h2`, `from-font` : largeur (px)", ("heritage", "from-font", "g", "largeur")),
    ("`h2`, `from-font` : nombre calculé", ("heritage", "from-font", "g", "nombre")),
    ("texte courant, `from-font` : largeur (px)", ("heritage", "from-font", "a", "largeur")),
    ("texte courant, `none` : largeur (px)", ("heritage", "none", "a", "largeur")),
])

print("## Sous-ensembles d'Inter : fonctionnalités et réglages CSS\n")
print(f"Inter au commit `{P['commit_inter']}` de `google/fonts`, plage « occidentale large », woff2. Liste : `{P['liste']}`.\n")
tableau(["Fichier", "Octets", "Écart à `liste`", "`tnum`", "`subs`, `sups`", "Axes"],
        [[f"`{k}`", v["octets"],
          f"{v['octets'] - P['fichiers']['liste']['octets']:+d} ({(v['octets'] / P['fichiers']['liste']['octets'] - 1) * 100:+.1f} %)",
          "oui" if "tnum" in v["gsub"] else "non",
          "oui" if "subs" in v["gsub"] else "non",
          ", ".join(v["axes"])] for k, v in P["fichiers"].items()])
print("Inter à 64 px, largeurs en px. `1111` et `0000` égaux avec `tabular-nums` = réglage actif. Mot témoin `Hamburgefonstiv` : `auto` et `none` différents = axe optique actif.\n")
for m in MOTEURS:
    print(f"**{NOMS[m]}**\n")
    tableau(["Fichier", "`1111` / `0000`", "avec `tabular-nums`", "`font-optical-sizing: auto`", "`font-optical-sizing: none`"],
            [[f"`{f}`", cell(m, "opentype", f, "p1") + " / " + cell(m, "opentype", f, "p0"), cell(m, "opentype", f, "t1") + " / " + cell(m, "opentype", f, "t0"),
              cell(m, "opentype", f, "opszAuto"), cell(m, "opentype", f, "opszNone")] for f in P["fichiers"]])

print("## `text-box: trim-both cap alphabetic` sur `p`, `li`, `h2`\n")
print("Georgia 16 px, `line-height: 1.6`, marges de paragraphe de 1em. Captures : `textbox-sans`, `textbox-avec` (titre en `overflow: hidden`).\n")
par_moteur([
    ("Paragraphe de 3 lignes, sans : hauteur (px)", ("textbox", "sans", "hauteurP")),
    ("Paragraphe de 3 lignes, avec : hauteur (px)", ("textbox", "avec", "hauteurP")),
    ("Pas entre deux paragraphes, sans (px)", ("textbox", "sans", "pas")),
    ("Pas entre deux paragraphes, avec (px)", ("textbox", "avec", "pas")),
    ("`li` d'une ligne, sans : hauteur (px)", ("textbox", "sans", "hauteurLi")),
    ("`li` d'une ligne, avec : hauteur (px)", ("textbox", "avec", "hauteurLi")),
])
print("Écart du pas entre deux paragraphes : " + " ; ".join(
    f"{NOMS[m]} {min(lire(m, 'textbox', 'avec', 'pas')) - max(lire(m, 'textbox', 'sans', 'pas')):+.1f} px" for m in MOTEURS) + ".\n")

print("## Feuille finale du billet appliquée telle quelle\n")
print("`vendor/tidy-typography.css` (empreinte dans `SHA256SUMS`), fenêtre de 1400 px. Capture : `feuille-liste`.\n")
par_moteur([(f"`{k}` : taille (px)", ("feuille", k)) for k in ["h1", "h3", "h6", "p", "blockquote", "figcaption"]] + [
    ("`li` : taille (px)", ("feuille", "tailleLi")),
    ("`li` d'une ligne : hauteur (px)", ("feuille", "hauteurLi")),
    ("Pas entre deux `li` (px)", ("feuille", "pasLi")),
    ("Lien de menu : hauteur (px)", ("feuille", "hauteurLien")),
])

print("## Sélecteur `:heading`\n")
par_moteur([
    ("`CSS.supports('selector(:heading)')`", ("selecteurs", "supports")),
    ("`:heading, #liste` : règle appliquée à `#liste`", ("selecteurs", "listeSimple")),
    ("`:is(:heading, h3), #pardonnant` : règle appliquée", ("selecteurs", "listePardonnante")),
    ("… et à `h3`", ("selecteurs", "h3DansIs")),
    ("`@supports selector(:heading)` : bloc appliqué", ("selecteurs", "garde")),
    ("`h2` correspond à `:heading`", ("selecteurs", "h2")),
    ("`role=\"heading\"` correspond à `:heading`", ("selecteurs", "role")),
])

print("## `font-variation-settings` sur `*`\n")
print("Inter, enfant d'un parent réglé. Largeur de l'enfant en px à 20 px.\n")
cas = ["parent wght, sans *", "parent wght, avec *", "parent wght, règle sur body", "parent font-weight, avec *"]
par_moteur([(f"{c} : réglage calculé de l'enfant", ("variation", c, "enfant")) for c in cas] +
           [(f"{c} : largeur (px)", ("variation", c, "largeur")) for c in cas] +
           [("`\"FILL\" 1` sur le parent, avec `*` : réglage calculé de l'enfant", ("variation", "parent wght, avec *", "icone")),
            ("`\"FILL\" 1` sur le parent, sans `*` : réglage calculé de l'enfant", ("variation", "parent wght, sans *", "icone"))])

print("## `font-variant-position` sur `sub` et `sup`\n")
print("Règle `@supports` du billet. Largeur d'un `2` à 36 px en px : courant, puis en `sub`. Indice égal au chiffre courant = à plat, ni réduit ni déplacé (voir captures `position-regle`). Défaut : sans la règle.\n")
lignes = []
for pol in ["Arial", "STIX Two Text", "Inter tout", "Inter liste"]:
    lignes.append([pol, *[cell(m, "position", "defaut", pol, "courant") + " / " + cell(m, "position", "defaut", pol, "indice") + " / " + cell(m, "position", "regle", pol, "indice") for m in MOTEURS]])
tableau(["Police (courant / indice par défaut / indice avec la règle)"] + [NOMS[m] for m in MOTEURS], lignes)

print("## Jetons `clamp()` en `cqi`\n")
print("Conteneur de 300 px, fenêtre de 1400 px. `--step-0: clamp(1rem, .9rem + 1cqi, 1.125rem)`, `--step-3: clamp(2rem, 1.6rem + 3cqi, 2.75rem)`. Tailles calculées en px.\n")
par_moteur([
    ("Titre en `var(--step-3)`, hors conteneur", ("cqi", "hors")),
    ("Titre en `var(--step-3)`, dans le conteneur", ("cqi", "dans")),
    ("Paragraphe hors conteneur, `body` en `var(--step-0)`", ("cqi", "pb")),
    ("Paragraphe dans le conteneur, taille héritée de `body`", ("cqi", "pd")),
    ("Paragraphe dans le conteneur, redéclare `var(--step-0)`", ("cqi", "pl")),
    ("Jeton enregistré par `@property`, dans le conteneur", ("cqi", "reg")),
    ("Le conteneur lui-même en `var(--step-3)`", ("cqi", "auto")),
])

print("## `quotes`\n")
print("Rendu : captures `quotes-defaut`, `quotes-billet`, `quotes-corrige`. La ligne française du billet écrit `\\\\00202F` : une barre oblique inverse échappée, suivie du texte `00202F`.\n")
par_moteur([
    ("Défaut : valeur calculée (fr)", ("quotes", "defaut", "f", "quotes")),
    ("Billet : valeur calculée (fr)", ("quotes", "billet", "f", "quotes")),
    ("Corrigé : valeur calculée (fr)", ("quotes", "corrige", "f", "quotes")),
    ("Corrigé : valeur calculée (en)", ("quotes", "corrige", "e", "quotes")),
    ("Défaut : largeur du `q` français (px)", ("quotes", "defaut", "f", "largeur")),
    ("Billet : largeur du `q` français (px)", ("quotes", "billet", "f", "largeur")),
    ("Corrigé : largeur du `q` français (px)", ("quotes", "corrige", "f", "largeur")),
])

print("## Césure\n")
print("Boîte de 130 px, Georgia 16 px, `scrollWidth` en px : 130 = pas de débordement.\n")
par_moteur([(f"{k}", ("cesure", "debordement", k)) for k in M["chrome"][0]["cesure"]["debordement"]] + [
    ("Cellule de tableau dans 40 px, `break-word` : largeur (px)", ("cesure", "celluleBreakWord")),
    ("Cellule de tableau dans 40 px, `anywhere` : largeur (px)", ("cesure", "celluleAnywhere")),
])

print("## Prise en charge déclarée (`CSS.supports`)\n")
par_moteur([(f"`{k}`", ("support", "s", k)) for k in M["chrome"][0]["support"]["s"]])
print("Valeurs calculées sans aucune règle :\n")
par_moteur([(f"`{k}`", ("support", "initiales", k)) for k in M["chrome"][0]["support"]["initiales"]])

print("## `text-rendering` et `font-kerning`\n")
print("Times New Roman 16 px, `AVAVAV To Ty We fi fl office`, largeur en px.\n")
par_moteur([(k, ("rendu", k)) for k in M["chrome"][0]["rendu"]])

print("## Texte publié : `extraits/bloc-recommande.css`\n")
print("Page `lang=\"fr-FR\"`. Capture : `bloc`.\n")
par_moteur([
    ("Titre : `text-wrap-style`", ("bloc", "hStyle")),
    ("Titre : `hyphens`", ("bloc", "hHyphens")),
    ("Paragraphe d'article : `text-wrap-style`", ("bloc", "pStyle")),
    ("Paragraphe d'article : `hyphens`", ("bloc", "pHyphens")),
    ("Paragraphe d'article : `hyphenate-limit-chars`", ("bloc", "pLimite")),
    ("Paragraphe d'article : `overflow-wrap`", ("bloc", "pOverflow")),
    ("Paragraphe de 130 px à mot long : `scrollWidth` (px)", ("bloc", "debordementP")),
    ("`li` d'article : `hyphens`", ("bloc", "liHyphens")),
    ("`code` dans un paragraphe d'article : `hyphens`", ("bloc", "codeHyphens")),
    ("Texte voisin du `code` : `hyphens`", ("bloc", "voisinHyphens")),
    ("Paragraphe avec une classe seule (`hyphens: none`)", ("bloc", "classeHyphens")),
    ("Paragraphe hors article : `hyphens`", ("bloc", "horsHyphens")),
    ("Tableau : `font-variant-numeric`", ("bloc", "tableau")),
    ("`q` français : `quotes`", ("bloc", "qFr")),
    ("`q` anglais dans la page française : `quotes`", ("bloc", "qEn")),
])

print("## Texte publié : `extraits/console-support.js`\n")
print("Vrai = pris en charge par le navigateur ouvert.\n")
cles = [c[0] for c in M["chrome"][0]["bloc"]["console"]]
tableau(["Déclaration"] + [NOMS[m] for m in MOTEURS],
        [[f"`{cles[i]}`"] + [fmt([p["bloc"]["console"][i][1] for p in M[m]]) for m in MOTEURS] for i in range(len(cles))])
