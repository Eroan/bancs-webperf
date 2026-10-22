#!/usr/bin/env bash
# Série complète, À FROID : garde, serveur sur port libre, banc, synthèse.
# Usage : bash run.sh [passages=10]
#   FORCE=1      ignore la garde (essai de mise au point seulement : chiffres non publiables)
#   IDLE_MIN=85  inactivité du processeur (%, top) en dessous de laquelle on refuse de démarrer
# Durée : ~30 s par passage.
set -euo pipefail
cd "$(dirname "$0")"
PASSAGES=${1:-10}
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"
mkdir -p "$OUT"

inactif() { top -l 2 -n 0 -s 2 | awk '/CPU usage/ {v=$7} END {print v+0}'; }
{ sw_vers; sysctl -n machdep.cpu.brand_string hw.ncpu hw.memsize; "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version; node -v; } > "$OUT/versions.txt" 2>&1
I=$(inactif)
echo "départ $(date '+%F %T') ; processeur inactif : $I %" > "$OUT/machine.txt"
if awk "BEGIN{exit !($I < ${IDLE_MIN:-85})}" && [ "${FORCE:-0}" != 1 ]; then
  echo "MACHINE CHARGÉE : processeur inactif à $I % < ${IDLE_MIN:-85} %. Relancer à froid (ou FORCE=1 pour un essai non publiable)."; exit 2
fi

node serveur.mjs > "$OUT/serveur.log" 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
for _ in $(seq 1 20); do grep -q '^port ' "$OUT/serveur.log" 2>/dev/null && break; sleep 0.2; done
PORT=$(awk '/^port /{print $2; exit}' "$OUT/serveur.log")
[ "$(curl -s "http://127.0.0.1:$PORT/__banc")" = "banc-bridage-reseau-cdp" ] || { echo "BANC ABSENT sur le port $PORT"; exit 1; }

PORT=$PORT PASSAGES=$PASSAGES SORTIE="$OUT" node banc.mjs
echo "fin $(date '+%F %T') ; processeur inactif : $(inactif) %" >> "$OUT/machine.txt"
python3 synthese.py "$OUT" > RESULTATS.md
echo "RESULTATS.md écrit depuis $OUT"
