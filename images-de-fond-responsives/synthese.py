#!/usr/bin/env python3
"""Synthèse du banc « image de fond responsive » : lit <dossier>/mesures.json, imprime RESULTATS en Markdown.
Une liste de requêtes qui varie d'un passage à l'autre s'imprime avec « ; ». Usage : python3 synthese.py <dossier> [> RESULTATS.md]"""
import json, os, sys

D = json.load(open(os.path.join(sys.argv[1], "mesures.json"), encoding="utf-8"))
V = open(os.path.join(sys.argv[1], "versions.txt"), encoding="utf-8").read()
MA = open(os.path.join(sys.argv[1], "machine.txt"), encoding="utf-8").read().strip()
M, VERS = D["mesures"], D["versions"]
E = ["chrome", "firefox", "webkit"]
NOMS = {"chrome": f"Chrome {VERS['chrome']}", "firefox": f"Firefox {VERS['firefox']}", "webkit": f"WebKit {VERS['webkit']} (Playwright)"}
serie = os.path.basename(os.path.normpath(sys.argv[1]))
P = D["passages"]


def lire(e, *chemin):
    """Valeurs d'un même champ sur tous les passages."""
    out = []
    for p in M[e]:
        v = p
        for c in chemin:
            v = v[c]
        out.append(v)
    return out


def fmt_req(v):
    return " + ".join(f"`{x}`" for x in v) if v else "aucune"


def cell(valeurs, f=fmt_req):
    u = []
    for v in valeurs:
        s = f(v)
        if s not in u:
            u.append(s)
    return " ; ".join(u)


def identiques(cellules):
    return len(set(cellules)) == 1


def ligne(*c):
    print("| " + " | ".join(str(x) for x in c) + " |")


def entete(*c):
    ligne(*c)
    ligne(*["---"] * len(c))


print(f"# Résultats : image de fond responsive\n")
print(f"Série `{serie}`, {P} passages, délai serveur de {D['delai_image_ms']} ms par image, images en `max-age=3600`. {MA}.")
print(f"Moteurs : {', '.join(NOMS[e] for e in E)}. Tous les témoins du protocole sont passés (le banc sort en 1 sinon).\n")
print("```text\n" + V.strip() + "\n```\n")

print("## 1. Image demandée selon le DPR\n")
print("Journal du serveur. Une ligne regroupe `image-set()`, `<img srcset>` et `<link rel=preload imagesrcset>` quand les trois moteurs et les trois techniques donnent le même fichier (`dN` = fichier de densité N).\n")
for jeu in ("1x-2x", "1x-1.5x-2x", "1x-2x-3x"):
    print(f"Jeu `{jeu}` :\n")
    entete("DPR", "Image demandée", "Moteurs et techniques")
    for dpr in ("1", "1.25", "1.5", "2", "2.625", "3"):
        cs = {}
        for e in E:
            for t in ("image-set", "srcset", "preload"):
                cs[(e, t)] = cell(lire(e, "selection", f"{dpr}|{jeu}|{t}"))
        if identiques(cs.values()):
            ligne(dpr.replace(".", ","), next(iter(cs.values())), "3 moteurs, 3 techniques : identique")
        else:
            for k, v in cs.items():
                ligne(dpr.replace(".", ","), v, f"{k[0]} {k[1]}")
    print()

print("## 2. Préchargement et fond CSS : une ou deux images\n")
print("`FORME` : `sans-preload` (témoin, CSS en media queries) ; `densite` (`imagesrcset` en `x`, `image-set()`) ; `largeur-imagesizes` (`imagesrcset` en `w` + `imagesizes=\"100vw\"`, CSS en media queries) ; `href-seul` (préchargement de l'image de bureau, CSS en media queries) ; `media` (un préchargement `href` + `media` par point de rupture, mêmes media queries) ; `media-densite` (`media` + `imagesrcset` en `x`, media queries + `image-set()`) ; `media-densite-type` (idem, AVIF, `type=\"image/avif\"`, `image-set()` à `type()`).\n")
formes = ["sans-preload", "densite", "largeur-imagesizes", "href-seul", "media", "media-densite", "media-densite-type"]
configs = ["400x800@1", "400x800@2", "400x800@3", "412x915@2.625", "1400x900@1", "1400x900@1.25", "1400x900@2"]
for f in formes:
    print(f"`{f}` :\n")
    entete("Fenêtre @ DPR", "Requêtes", "Nombre", "Moteurs")
    for c in configs:
        cs = {e: cell(lire(e, "doublon", f"{c}|{f}")) for e in E}
        ns = {e: sorted(set(len(x) for x in lire(e, "doublon", f"{c}|{f}"))) for e in E}
        if identiques(cs.values()):
            ligne(c.replace(".", ","), cs["chrome"], "/".join(map(str, ns["chrome"])), "3 moteurs")
        else:
            for e in E:
                ligne(c.replace(".", ","), cs[e], "/".join(map(str, ns[e])), e)
    print()

print("### Blocs publiés (`extraits/bloc-recommande.*`, `extraits/bloc-variables.*`)\n")
print("Fichiers servis tels quels, seul le préfixe `/img/` change. Le témoin exige une seule requête, en AVIF.\n")
entete("Fenêtre @ DPR", "`bloc-recommande`", "`bloc-variables`", "Moteurs")
for c in configs:
    cs = {e: (cell(lire(e, "publie", f"{c}|bloc-recommande")), cell(lire(e, "publie", f"{c}|bloc-variables"))) for e in E}
    if identiques(cs.values()):
        ligne(c.replace(".", ","), *cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(c.replace(".", ","), *cs[e], e)
print()

print("## 3. Écritures de `image-set()`\n")
print("Noms de fichier : `aN` AVIF, `jN` JPEG, de densité N. `tous-types-inconnus` : première déclaration `url(repli.jpg)`, seconde `image-set(url(x.xyz) type(\"image/x-inconnu\"))`.\n")
ecr = ["complet", "jpeg-en-tete", "avif-1x-seul", "type-sans-densite", "type-inconnu", "doublon-densite", "ordre-inverse", "seulement-2x", "seulement-1x", "dpi", "dppx", "chaine", "degrade", "prefixe", "tous-types-inconnus"]
entete("Écriture", "DPR 1", "DPR 2", "Moteurs")
for k in ecr:
    cs = {e: (cell([x["req"] for x in lire(e, "combinaisons", f"1|{k}")]), cell([x["req"] for x in lire(e, "combinaisons", f"2|{k}")])) for e in E}
    if identiques(cs.values()):
        ligne(k, *cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(k, *cs[e], e)
print()
print("Valeur calculée de `background-image` pour `complet` à DPR 2, identique à DPR 1 :\n")
for e in E:
    print(f"- {NOMS[e]} : `{lire(e, 'combinaisons', '2|complet')[0]['calcule']}`")
print()

print("## 4. Largeur affichée d'un PNG de 1 000 × 500 px en `background-size: auto`\n")
print("Pixels magenta de la première ligne de la capture, rapportés à l'échelle de la capture ; élément de 1 400 px de large, donc 1 400 = image coupée par l'élément (`0.5x` donnerait 2 000).\n")
entete("Écriture", "DPR 1", "DPR 2", "Moteurs")
for k in ["url", "sans-densite", "type-sans-densite", "1x", "2x", "0.5x", "2x-cover"]:
    f = lambda v: f"{v['css']} px"
    cs = {e: (cell(lire(e, "taille", f"1|{k}"), f), cell(lire(e, "taille", f"2|{k}"), f)) for e in E}
    if identiques(cs.values()):
        ligne(k, *cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(k, *cs[e], e)
print()

print("## 5. Media queries, conteneurs, éléments hors écran ou masqués\n")
print("Fenêtre de 400 × 800 px, DPR 1, sauf mention. `Au chargement` = requêtes du premier affichage ; `À 1 400 px`, `Retour à 400 px` = requêtes ajoutées par le redimensionnement.\n")
entete("Cas", "Au chargement", "À 1 400 px", "Retour à 400 px", "Moteur")
for k in ["mq", "ecrase", "conteneur", "conteneur-sans-base", "conteneur-base-mobile-1400", "hors-ecran", "display-none", "parent-none", "visibility-hidden", "content-visibility"]:
    lignes = {}
    for e in E:
        vals = lire(e, "media", k)
        def premier(v):
            ajout = list(v.get("grand", [])) + list(v.get("retour", []))
            r = list(v["req"])
            for x in ajout:
                r.remove(x)
            return r
        a = cell([premier(v) for v in vals])
        g = cell([v["grand"] for v in vals]) if "grand" in vals[0] else "—"
        re_ = cell([v["retour"] for v in vals]) if "retour" in vals[0] else "—"
        lignes[e] = (a, g, re_)
    if identiques(lignes.values()):
        ligne(k, *lignes["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(k, *lignes[e], e)
print()

print("## 6. DPR changé en cours de page, connexion lente\n")
print("DPR de 1 à 2 par `Emulation.setDeviceMetricsOverride` (Chrome) ou `setViewport` (Firefox), sans API sous WebKit de Playwright. `Recalcul` : `background-position` modifié sur l'élément ; `Nouvel élément` : élément ajouté avec la même classe ; `Retour` : DPR rendu à 1.\n")
entete("Moteur", "Après passage à 2", "Recalcul", "Nouvel élément", "Retour")
for e in ("chrome", "firefox"):
    v = lire(e, "changement", "parcours")
    ligne(NOMS[e], cell([x["vers2"] for x in v]), cell([x["recalcul"] for x in v]), cell([x["nouvel_element"] for x in v]), cell([x["retour1"] for x in v]))
print()
r = lire("chrome", "reseau")
print(f"Chrome, DPR 3, latence 2 500 ms : `navigator.connection.effectiveType` = {cell([x['et'] for x in r], lambda v: '`' + v + '`')}, image demandée {cell([x['req'] for x in r])} sur `1x 2x 3x`.\n")

print("## 7. Propriétés personnalisées\n")
entete("Cas", "DPR 1", "DPR 2", "Moteurs")
for k in ["options-en-variables", "ensemble-en-variable"]:
    cs = {e: (cell([x["req"] for x in lire(e, "variables", f"1|{k}")]), cell([x["req"] for x in lire(e, "variables", f"2|{k}")])) for e in E}
    if identiques(cs.values()):
        ligne(k, *cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(k, *cs[e], e)
print()
print("URL relative dans une variable, page sous `/p/`, feuille qui utilise `var()` sous `/c/` (`--f: url(rel.jpg)`) :\n")
entete("Variable posée dans", "Requête reçue", "Moteurs")
for k, lib in [("relative-attribut-style", "attribut `style` de l'élément"), ("relative-style-html", "`<style>` de la page"), ("relative-feuille", "la feuille elle-même (témoin)")]:
    cs = {e: cell([x["chemins"] for x in lire(e, "variables", k)]) for e in E}
    if identiques(cs.values()):
        ligne(lib, cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(lib, cs[e], e)
print()
print("Repli. `fonction-inconnue` tient lieu de notation non prise en charge :\n")
entete("Cas", "Requêtes", "Moteurs")
for k, lib in [("repli-sans-var", "`url(repli.jpg)` puis `fonction-inconnue(url(a.jpg) 1x)`"), ("repli-avec-var", "`url(repli.jpg)` puis `fonction-inconnue(var(--a) 1x)`"), ("supports-connu", "`url(repli.jpg)`, puis `image-set(var(--a) ...)` sous `@supports` d'une notation connue"), ("supports-inconnu", "`url(repli.jpg)`, puis `fonction-inconnue(var(--a))` sous `@supports` de cette notation")]:
    cs = {e: cell([x["req"] for x in lire(e, "variables", k)]) for e in E}
    if identiques(cs.values()):
        ligne(lib, cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(lib, cs[e], e)
print()

print("## 8. LCP, valeur calculée, extrait de console\n")
entete("Moteur", "DPR", "API LCP", "`url` de l'entrée", "Balise", "Surface", "Resource Timing")
for e in E:
    for dpr in ("1", "2"):
        v = lire(e, "lcp", dpr)
        ligne(NOMS[e], dpr, cell([x["pris"] for x in v], lambda b: "oui" if b else "non"), cell([x["url"] for x in v], lambda u: f"`{u}`"), cell([x["balise"] for x in v], str), cell([x["surface"] for x in v], str), cell([x["rt"] for x in v], lambda l: ", ".join(f"{a['type']} `{a['nom']}`" for a in l)))
print()
print("`extraits/console-fonds.js` tel que publié, 1 400 × 900 px, DPR 2 :\n")
entete("Cas", "Images listées", "Image LCP", "Requêtes au serveur", "Moteurs")
for k, lib in [("console-sans-doublon", "préchargement `1x, 2x`, même `image-set()`"), ("console-doublon", "préchargement `href` de l'image `1x`, même `image-set()`")]:
    cs = {}
    for e in E:
        v = lire(e, "lcp", k)
        cs[e] = (cell([x["sortie"]["images"] for x in v], lambda l: ", ".join(f"{a['origine']} `{a['nom']}`" for a in l)), cell([x["sortie"]["lcp"] for x in v], lambda d: f"`{d['nom']}` ({d['balise']})"), cell([x["req"] for x in v]))
    if identiques(cs.values()):
        ligne(lib, *cs["chrome"], "3 moteurs")
    else:
        for e in E:
            ligne(lib, *cs[e], e)
print()

print("## 9. `CSS.supports`\n")
cles = [k for k in lire("chrome", "syntaxe")[0] if not k.startswith("__")]
entete("Écriture", *[NOMS[e] for e in E])
for k in cles:
    ligne(k, *[cell(lire(e, "syntaxe", k), lambda b: "oui" if b else "non") for e in E])
print()
print("AVIF témoin décodé (`naturalWidth` attendu 16) : " + ", ".join(f"{NOMS[e]} {cell(lire(e, 'syntaxe', '__avif'), str)}" for e in E) + ".")
