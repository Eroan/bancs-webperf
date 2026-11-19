#!/bin/bash
# Rejoue le banc. Prérequis : Node 26, Chrome stable installé, npm i.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p brut
{ date; top -l 2 -n 0 -s 1 | grep 'CPU usage' | tail -1; } > brut/machine.txt
PASSAGES=5 node banc.mjs
python3 synthese.py
EXTRAIT=extrait-console.js PASSAGES=1 node banc.mjs
python3 synthese.py "$(ls brut/series-*-p1-extrait.json | tail -1)" RESULTATS-extrait-console.md
