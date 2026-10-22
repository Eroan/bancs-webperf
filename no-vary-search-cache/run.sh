#!/usr/bin/env bash
# Série complète : relevé de charge, banc, synthèse.  Usage : bash run.sh [passages=10]
# Pas de refus sous charge : le banc ne mesure aucune durée (comptes de requêtes, type de livraison), voir PROTOCOLE.md.
set -euo pipefail
cd "$(dirname "$0")"
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"; mkdir -p "$OUT"
inactif() { top -l 2 -n 0 -s 2 | awk '/CPU usage/ {v=$7} END {print v+0}'; }
{ sw_vers; sysctl -n machdep.cpu.brand_string; "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version; /Applications/Firefox.app/Contents/MacOS/firefox --version; node -v; } > "$OUT/versions.txt" 2>&1
I=$(inactif); echo "départ $(date '+%F %T') ; processeur inactif : $I %" > "$OUT/machine.txt"
PASSAGES=${1:-10} SORTIE="$OUT" node banc.mjs
PASSAGES=5 SORTIE="$OUT" node syntaxe.mjs
python3 synthese.py "$OUT" > RESULTATS.md && echo "RESULTATS.md écrit depuis $OUT"
