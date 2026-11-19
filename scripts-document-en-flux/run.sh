#!/bin/bash
# Rejoue le banc. Prérequis : Node 26, Chrome stable installé, npm i, npx playwright install firefox webkit.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p brut
# Garde « machine au repos » : médiane de quatre relevés d'une seconde, premier relevé de top jeté.
top -l 5 -s 1 -n 0 | awk '/CPU usage/ {sub("%","",$7); print $7}' | tail -4 | sort -n \
  | awk '{v[NR]=$1} END {if (NR < 4) {print "GARDE : moins de 4 relevés"; exit 2}; m = (v[2]+v[3])/2; printf "inactivité médiane %.1f %%\n", m; exit (m < 85)}' \
  | tee brut/machine.txt
PASSAGES="${PASSAGES:-5}" node banc.mjs
python3 synthese.py
