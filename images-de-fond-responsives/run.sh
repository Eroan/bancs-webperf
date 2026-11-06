#!/usr/bin/env bash
# Série complète : relevés, banc, synthèse.  Usage : bash run.sh [passages=3]
# Pas de refus sous charge : le banc ne mesure aucune durée, voir PROTOCOLE.md.
set -euo pipefail
cd "$(dirname "$0")"
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"; mkdir -p "$OUT"
inactif() { top -l 2 -n 0 -s 2 | awk '/CPU usage/ {v=$7} END {print v+0}'; }
{ sw_vers; sysctl -n machdep.cpu.brand_string; "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version; /Applications/Firefox.app/Contents/MacOS/firefox --version; node -v; python3 --version
  echo "Chrome publié (macOS, stable) : $(curl -s 'https://versionhistory.googleapis.com/v1/chrome/platforms/mac/channels/stable/versions?pageSize=1' | python3 -c 'import json,sys;print(json.load(sys.stdin)["versions"][0]["version"])')"
  echo "Firefox publié : $(curl -s https://product-details.mozilla.org/1.0/firefox_versions.json | python3 -c 'import json,sys;print(json.load(sys.stdin)["LATEST_FIREFOX_VERSION"])')"; } > "$OUT/versions.txt" 2>&1
I=$(inactif); echo "départ $(date '+%F %T') ; processeur inactif : $I %" > "$OUT/machine.txt"
PASSAGES=${1:-3} SORTIE="$OUT" node banc.mjs
python3 -B synthese.py "$OUT" > RESULTATS.md && echo "RESULTATS.md écrit depuis $OUT"
