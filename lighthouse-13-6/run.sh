#!/usr/bin/env bash
# Série complète. Usage : bash run.sh [passages=10]
set -euo pipefail
cd "$(dirname "$0")"
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"; mkdir -p "$OUT"; export SORTIE="$OUT"
inactif() { top -l 2 -n 0 -s 2 | awk '/CPU usage/ {v=$7} END {print v+0}'; }
I=$(inactif); awk -v i="$I" 'BEGIN { exit !(i >= 85) }' || { echo "REFUS : processeur inactif à $I %, 85 % requis"; exit 3; }
{ sw_vers; sysctl -n machdep.cpu.brand_string; "$CHROME_PATH" --version; node -v; echo "départ $(date '+%F %T') ; processeur inactif : $I %"; } > "$OUT/machine.txt"
node audits.mjs
node lot.mjs
PASSAGES=${1:-10} node banc.mjs
echo "fin $(date '+%F %T') ; processeur inactif : $(inactif) %" >> "$OUT/machine.txt"
python3 synthese.py "$OUT" > RESULTATS.md && echo "RESULTATS.md écrit depuis $OUT"
