#!/usr/bin/env bash
# Lighthouse 13.5.0 (mobile, throttling simulé, performance seule) sur les cinq variantes, aucun geste.
# Usage : bash lh-banc.sh <dossier-sortie> "<multiplicateurs>" [passages=3]
# Variantes alternées à chaque passage, un passage d'échauffement jeté par multiplicateur.
# Envois vers Google et Meta bloqués (--blocked-url-patterns) : rien ne sort de la machine ; écart au banc
# Playwright : la configuration du Pixel (signals/config, 28 Ko) n'est pas servie ici.
set -euo pipefail
cd "$(dirname "$0")"
OUT=${1:?dossier de sortie}; MULTS=${2:?multiplicateurs}; N=${3:-3}
mkdir -p "$OUT"
export CHROME_PATH=${CHROME_PATH:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
LH=node_modules/.bin/lighthouse
node site.mjs 8711 8712 > "$OUT/serveur.log" 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -sf http://127.0.0.1:8711/__banc >/dev/null && break; sleep 0.1; done
curl -sf http://127.0.0.1:8711/__banc | grep -q banc-report || { echo "BANC ABSENT"; exit 1; }
run() {   # $1 multiplicateur, $2 variante, $3 fichier
  "$LH" "http://site.localhost:8711/$2.html" --quiet --only-categories=performance --output=json --output-path="$3" \
    --throttling.cpuSlowdownMultiplier="$1" --chrome-flags="--headless=new" \
    --blocked-url-patterns='*google-analytics.com*' --blocked-url-patterns='*doubleclick.net*' \
    --blocked-url-patterns='*googletagmanager.com*' --blocked-url-patterns='*facebook.com*' --blocked-url-patterns='*facebook.net*'
}
VARS=(A B C E D)
for M in $MULTS; do
  run "$M" A "$OUT/echauffement-cpu$M.json"; rm -f "$OUT/echauffement-cpu$M.json"
  for k in $(seq 1 "$N"); do
    for i in 0 1 2 3 4; do
      V=${VARS[$(( (i + k - 1) % 5 ))]}
      run "$M" "$V" "$OUT/lh-cpu$M-$V-$k.json"
      echo "lighthouse ×$M $V passage $k"
    done
  done
done
