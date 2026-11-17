#!/usr/bin/env bash
# Relance complète du banc, À FROID : construction, garde de repos, calibrage, série, synthèse.
# Usage : bash run.sh [passages=10]
#   FORCE=1       ignore les gardes (mise au point seulement : chiffres non publiables)
#   IDLE_MIN=85   inactivité médiane du processeur (%, quatre relevés de top, premier jeté) sous laquelle on refuse
#   BI_MIN=3500   indice de Lighthouse à ×1 sous lequel on refuse (poste du banc : ~4 060)
set -euo pipefail
cd "$(dirname "$0")"
PASSAGES=${1:-10}
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"
mkdir -p "$OUT"

repos() {   # médiane de quatre relevés d'une seconde, premier relevé de top jeté ; sortie 1 sous le seuil, 2 si moins de 4 relevés
  top -l 5 -s 1 -n 0 | awk '/CPU usage/ {sub("%","",$7); print $7}' | tail -4 | sort -n | awk -v s="${IDLE_MIN:-85}" '{v[NR]=$1} END {if (NR < 4) {print "GARDE : moins de 4 relevés"; exit 2}; m = (v[2]+v[3])/2; printf "inactivité médiane %.1f %%\n", m; exit (m < s)}'
}
machine() { { echo "# $1 : $(date '+%F %T')"; repos || true; { ps -Ao pcpu,ucomm -r | head -6; } || true; echo; } >> "$OUT/machine.txt"; }
{ sw_vers; sysctl -n machdep.cpu.brand_string hw.ncpu hw.memsize; "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version; node -v; } > "$OUT/versions.txt" 2>&1

node construire.mjs | tee "$OUT/construction.txt"
cp dist/poids.json "$OUT/poids.json"
(cd dist && shasum -a 256 */app.js) > "$OUT/SHA256SUMS-dist"
grep -c '<li class=ligne' dist/vue-vapor/app.js > "$OUT/vapor-gabarit.txt" || echo 0 > "$OUT/vapor-gabarit.txt"   # mode Vapor : gabarit HTML compilé
grep -c '<li class=ligne' dist/vue/app.js >> "$OUT/vapor-gabarit.txt" || echo 0 >> "$OUT/vapor-gabarit.txt"

machine "départ"
if ! repos && [ "${FORCE:-0}" != 1 ]; then echo "MACHINE CHARGÉE : relancer à froid (ou FORCE=1 pour un essai non publiable)."; exit 2; fi

SORTIE="$OUT" CIBLES="460" node calibrage.mjs | tee "$OUT/calibrage.txt"
BI1=$(awk '/^BI_X1/{print $2}' "$OUT/calibrage.txt")
if awk "BEGIN{exit !($BI1 < ${BI_MIN:-3500})}" && [ "${FORCE:-0}" != 1 ]; then echo "INDICE ×1 = $BI1 < ${BI_MIN:-3500} : arrêt."; exit 2; fi
T=$(awk '/^TAUX 460 /{print $3}' "$OUT/calibrage.txt")
echo "taux retenu : ×$T" | tee -a "$OUT/calibrage.txt"

machine "série ×$T"
SORTIE="$OUT" node banc.mjs "$T" "$PASSAGES" 100,1000 | tee "$OUT/serie.txt"
machine "fin"
python3 synthese.py "$OUT" > "$OUT/RESULTATS.md"
echo "Résultats : $OUT/RESULTATS.md"
