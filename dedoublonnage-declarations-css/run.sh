#!/bin/bash
# Rejoue le banc entier. Prérequis : Node 26, Chrome stable installé, npm i.
set -euo pipefail
cd "$(dirname "$0")"
node recuperer.mjs                                   # corpus et exemples, empreintes contrôlées
node banc.mjs                                        # poids, compression, conservation, témoins de cascade (aucune durée)
CIBLES=460 node calibrage.mjs 1 6 7 8 9 10           # taux du niveau ~460 (×9 sur le poste du banc)
./attendre-repos.sh env TAUX=1,9 PASSAGES=10 node rendu.mjs || true   # durées : la série est gardée même si le témoin échoue
python3 synthese.py
