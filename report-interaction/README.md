# Banc : report des scripts à la première interaction

Protocole : `PROTOCOLE.md`. Tout est local : aucune requête ne sort de la machine.
Prérequis : macOS ou Linux, Node 20 ou plus (testé avec 25.9), Python 3, Google Chrome stable.

gtag.js et fbevents.js changent chez Google et Meta (gtag.js a changé en deux heures et
demie le 2026-10-20) : une relance mesure leur version du jour, dont l'empreinte est
archivée avec la série (`vendor.txt`).

## Relancer (à froid)

Fermer les tâches lourdes, puis :

```bash
cd report-interaction
npm ci                    # une fois : versions figées (playwright 1.64.1, lighthouse 13.5.0, jQuery 3.7.1…)
bash vendor/recuperer.sh  # fichiers tiers non redistribués (GA4, Meta Pixel, WP Rocket 3.23.5.1)
bash run.sh 10            # ~3 h 30 ; résultats dans brut/serie-<date>/RESULTATS.md
```

`run.sh` refuse de démarrer si la machine est chargée (charge > 1,5 ou indice ×1 < 3 500),
recalibre le processeur, joue le témoin, les deux séries, Lighthouse, puis la synthèse.
Ne pas toucher la fenêtre Chrome pendant la série (les gestes sont synthétisés dedans).

## Fichiers

| Fichier | Rôle |
|---|---|
| `site.mjs` | page, cinq variantes, serveurs `site.localhost` / `tiers.localhost` ; `node site.mjs 8701 8702` pour l'ouvrir à la main |
| `calibrage.mjs` | indice de Lighthouse dans la page sous chaque taux de bridage, taux retenus pour les cibles |
| `banc.mjs` | série Playwright : `node banc.mjs <cpu> <passages> [parcours] [variantes] [slow4g\|aucun]` |
| `lh-banc.sh` | Lighthouse sur les cinq variantes |
| `synthese.py` | `python3 synthese.py <dossier>` : tableaux Markdown relus dans les JSON bruts |
| `vendor/recuperer.sh`, `vendor/SHA256SUMS` | récupère gtag.js, fbevents.js et la config Pixel (non redistribuables) et WP Rocket 3.23.5.1 (GPL, tag figé) ; compare à l'empreinte de la série de référence |
| `vendor/awp-delay-scripts.js` | chargeur AwpDelayScripts de l'agence (MIT), variantes C et E |
| `site/img/`, `site/generer-images.py` | images de la page (celles de la série de référence) et leur générateur (images équivalentes, pas identiques à l'octet) |
| `brut/psi-indice-machines-2026-10-20.json` | indice des machines de PSI, 12 réponses distinctes du 2026-10-20 : médiane 694 [470, 1 156] |
