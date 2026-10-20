#!/usr/bin/env bash
# Récupère les fichiers tiers que le dépôt ne redistribue pas, et compare leur empreinte à celle
# de la série de référence (vendor/SHA256SUMS, relevée le 2026-10-20).
#   - WP Rocket 3.23.5.1 (GPL-2.0) : tag figé, empreinte exigée.
#   - gtag.js (Google, « All rights reserved ») et fbevents.js + config (Meta, licence liée à ses
#     services) : servis par les éditeurs, ils changent ; un écart est SIGNALÉ, et les empreintes
#     réellement utilisées sont recopiées dans le dossier de la série par run.sh.
# Usage : bash vendor/recuperer.sh [--force]
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p tiers wp-rocket
UA="Mozilla/5.0 (banc-report-interaction; recuperation des fichiers tiers)"
get() {   # $1 url, $2 fichier
  if [ -s "$2" ] && [ "${1:-}" != "--force" ] && [ "${FORCE:-0}" != 1 ]; then return; fi
  code=$(curl -sL -A "$UA" -o "$2" -w '%{http_code}' "$1")
  [ "$code" = 200 ] || { echo "ÉCHEC $code : $1"; rm -f "$2"; exit 1; }
}
[ "${1:-}" = "--force" ] && FORCE=1
WPR=https://raw.githubusercontent.com/wp-media/wp-rocket/v3.23.5.1
get "$WPR/assets/js/lazyload-scripts.min.js" wp-rocket/lazyload-scripts.min.js
get "$WPR/inc/Engine/Optimization/DelayJS/HTML.php" wp-rocket/HTML.php
get "$WPR/inc/Engine/Optimization/DelayJS/Subscriber.php" wp-rocket/Subscriber.php
get "$WPR/dynamic-lists.json" wp-rocket/dynamic-lists.json
get "https://www.googletagmanager.com/gtag/js?id=G-BANC000001" tiers/gtag.js
get "https://connect.facebook.net/en_US/fbevents.js" tiers/fbevents.js
V=$(grep -oE '"2\.9\.[0-9]+"' tiers/fbevents.js | head -1 | tr -d '"')
get "https://connect.facebook.net/signals/config/100000000000001?v=${V:-2.9.425}&r=stable&domain=localhost" tiers/fb-config.js
ecart=0
while read -r h f; do
  a=$(shasum -a 256 "$f" | cut -d' ' -f1)
  if [ "$a" = "$h" ]; then echo "identique  $f"
  else
    case $f in
      wp-rocket/*) echo "ERREUR     $f : empreinte différente du tag v3.23.5.1"; exit 1 ;;
      *) echo "DIFFÉRENT  $f : version servie aujourd'hui ≠ série de référence (attendu, à noter dans les résultats)"; ecart=1 ;;
    esac
  fi
done < SHA256SUMS
exit 0
