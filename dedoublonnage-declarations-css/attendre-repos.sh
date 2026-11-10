#!/bin/bash
# Attend trois relevés consécutifs à 85 % d'inactivité ou plus (au plus 30 min), puis lance la commande donnée.
ok=0; debut=$(date +%s)
while [ "$ok" -lt 3 ]; do
  idle=$(top -l 2 -n 0 -s 2 | grep 'CPU usage' | tail -1 | sed -E 's/.* ([0-9.]+)% idle.*/\1/')
  if [ "${idle%.*}" -ge 85 ]; then ok=$((ok + 1)); else ok=0; fi
  echo "$(date +%T) inactivité ${idle} % (consécutifs : $ok)"
  if [ $(( $(date +%s) - debut )) -gt 1800 ]; then echo "ABANDON : machine jamais au repos en 30 min"; exit 2; fi
  [ "$ok" -lt 3 ] && sleep 20
done
exec "$@"
