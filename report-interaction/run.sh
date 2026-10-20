#!/usr/bin/env bash
# Relance complète du banc, À FROID (aucune tâche lourde en parallèle) : gardes, calibrage, témoin,
# séries aux deux niveaux de processeur, Lighthouse, synthèse.
# Usage : bash run.sh [passages=10]
#   FORCE=1          ignore les deux gardes (essai de mise au point seulement : chiffres non publiables)
#   IDLE_MIN=85      inactivité du processeur (%, top) en dessous de laquelle on refuse de démarrer.
#                    Pas la charge moyenne : sur macOS elle reste à 2 ou 3 sur une machine inactive à 92 %
#                    (fils en attente comptés), autant que sous une tâche lourde (mesuré le 2026-10-20).
#   BI_MIN=3500      indice de Lighthouse à ×1 en dessous duquel on refuse (poste du banc : ~4 060)
# Durée : ~10 min par passage et par niveau de processeur, soit ~3 h 30 pour 10 passages.
set -euo pipefail
cd "$(dirname "$0")"
PASSAGES=${1:-10}
OUT="brut/serie-$(date +%Y-%m-%dT%H-%M)"
mkdir -p "$OUT/lh"

inactif() { top -l 2 -n 0 -s 2 | awk '/CPU usage/ {v=$7} END {print v+0}'; }   # second échantillon : le premier couvre depuis le démarrage
machine() {
  { echo "# $1 : $(date '+%F %T')"; echo "charge 1/5/15 min : $(sysctl -n vm.loadavg) ; processeur inactif : $(inactif) %";
    echo "processus les plus gourmands :"; { ps -Ao pcpu,ucomm -r | head -6; } || true; echo; } >> "$OUT/machine.txt"   # head ferme le tube : SIGPIPE sous pipefail
}
{ sw_vers; sysctl -n machdep.cpu.brand_string hw.ncpu hw.memsize; "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version; node -v; } > "$OUT/versions.txt" 2>&1

# Fichiers tiers non redistribués : récupérés s'ils manquent, empreintes réellement utilisées archivées avec la série
bash vendor/recuperer.sh | tee "$OUT/vendor.txt"
(cd vendor && shasum -a 256 tiers/* wp-rocket/* awp-delay-scripts.js) >> "$OUT/vendor.txt"

machine "départ"
I=$(inactif)
if awk "BEGIN{exit !($I < ${IDLE_MIN:-85})}" && [ "${FORCE:-0}" != 1 ]; then
  echo "MACHINE CHARGÉE : processeur inactif à $I % < ${IDLE_MIN:-85} %. Relancer à froid (ou FORCE=1 pour un essai non publiable)."; exit 2
fi
echo "processeur inactif à $I % : départ"

# 1. Calibrage : taux qui amènent l'indice dans la page à ~460 (mobile milieu de gamme visé par Lighthouse)
#    et ~173 (équivalent PageSpeed Insights : médiane 694 de l'indice de ses machines sur 12 relevés, ÷ 4 ;
#    brut/psi-indice-machines-2026-10-20.json)
SORTIE="$OUT" CIBLES="460,173" node calibrage.mjs | tee "$OUT/calibrage.txt"
BI1=$(awk '/^BI_X1/{print $2}' "$OUT/calibrage.txt")
if awk "BEGIN{exit !($BI1 < ${BI_MIN:-3500})}" && [ "${FORCE:-0}" != 1 ]; then
  echo "INDICE ×1 = $BI1 < ${BI_MIN:-3500} : processeur occupé ou autre machine. Arrêt."; exit 2
fi
T_MILIEU=$(awk '/^TAUX 460 /{print $3}' "$OUT/calibrage.txt")
T_PSI=$(awk '/^TAUX 173 /{print $3}' "$OUT/calibrage.txt")
echo "taux retenus : milieu de gamme ×$T_MILIEU, équivalent PSI ×$T_PSI" | tee -a "$OUT/calibrage.txt"

# 2. Témoin puis série, pour chaque niveau
for T in "$T_MILIEU" "$T_PSI"; do
  machine "témoin ×$T"
  SORTIE="$OUT" node banc.mjs "$T" 2 temoin A,B
  machine "série ×$T"
  SORTIE="$OUT" node banc.mjs "$T" "$PASSAGES" passif,tap2,tap4,tap7,scrolltap
done

# 3. Lighthouse aux mêmes multiplicateurs
machine "lighthouse"
bash lh-banc.sh "$OUT/lh" "$T_MILIEU $T_PSI" 3
python3 alleger-lh.py "$OUT/lh"   # captures retirées, gzip : rapports archivables dans le dépôt

# 4. Synthèse (chaque chiffre relu dans les JSON bruts)
machine "fin"
python3 synthese.py "$OUT" > "$OUT/RESULTATS.md"
echo "Résultats : $OUT/RESULTATS.md"
