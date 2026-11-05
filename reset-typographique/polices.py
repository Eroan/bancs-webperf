#!/usr/bin/env python3
"""Télécharge Inter (commit épinglé, empreinte contrôlée), produit les sous-ensembles et écrit leur inventaire.
Usage : python3 polices.py <fichier json de sortie>"""
import hashlib, json, os, subprocess, sys, urllib.request
from fontTools.ttLib import TTFont
import fontTools

COMMIT = "e1d6480102fed30739fead0faee463101f892c8f"
URL = f"https://raw.githubusercontent.com/google/fonts/{COMMIT}/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
SHA = "29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031"
UNICODES = ("U+0020-007E,U+00A0-00FF,U+20AC,U+2010,U+2013,U+2014,U+2018,U+2019,U+201A,U+201C,U+201D,U+201E,"
            "U+2039,U+203A,U+2026,U+2022,U+0153,U+0152")
LISTE = "kern,liga,clig,calt,rlig,frac,ccmp,locl,rvrn,mark"

os.makedirs("polices", exist_ok=True); os.makedirs("vendor", exist_ok=True)
src = "vendor/Inter-opsz-wght.ttf"
if not os.path.exists(src):
    urllib.request.urlretrieve(URL, src)
if hashlib.sha256(open(src, "rb").read()).hexdigest() != SHA:
    sys.exit("EMPREINTE d'Inter différente : " + src)
fige = "vendor/Inter-opsz14.ttf"
subprocess.run(["fonttools", "varLib.instancer", src, "opsz=14", "--no-recalc-timestamp", "-o", fige, "-q"], check=True)
VARIANTES = {
    "tout": (src, "--layout-features=*"),
    "defaut": (src, None),
    "liste": (src, f"--layout-features={LISTE}"),
    "liste-tnum": (src, f"--layout-features={LISTE},tnum"),
    "liste-subs-sups": (src, f"--layout-features={LISTE},subs,sups"),
    "liste-opsz14": (fige, f"--layout-features={LISTE}"),
}
sortie = {"fonttools": fontTools.version, "commit_inter": COMMIT, "liste": LISTE, "unicodes": UNICODES, "fichiers": {}}
for nom, (f, opt) in VARIANTES.items():
    dest = f"polices/inter-{nom}.woff2"
    cmd = ["pyftsubset", f, f"--unicodes={UNICODES}", "--flavor=woff2", f"--output-file={dest}"] + ([opt] if opt else [])
    subprocess.run(cmd, check=True)
    t = TTFont(dest)
    gsub = sorted({r.FeatureTag for r in t["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in t else []
    axes = [a.axisTag for a in t["fvar"].axes] if "fvar" in t else []
    sortie["fichiers"][nom] = {"octets": os.path.getsize(dest), "gsub": gsub, "axes": axes}
json.dump(sortie, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("polices :", {k: v["octets"] for k, v in sortie["fichiers"].items()})
