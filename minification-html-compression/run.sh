#!/bin/bash
# Rejoue le banc. Prérequis : Node 26, npm ci. Le corpus (pages de tiers) n'est pas commité : recuperer.mjs le
# récupère le jour du rejeu, si bien que les chiffres ne se retrouvent à l'identique que sur le relevé d'origine
# (empreintes dans brut/corpus.tsv, contrôle par node recuperer.mjs --verifier).
set -euo pipefail
cd "$(dirname "$0")"
node recuperer.mjs
node banc.mjs > brut/banc.log 2>&1
python3 synthese.py
