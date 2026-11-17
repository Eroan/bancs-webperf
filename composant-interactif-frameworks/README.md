# Composant interactif : Solid 2.0 face à Alpine, React, Preact, Svelte et Vue

Protocole : [`PROTOCOLE.md`](PROTOCOLE.md). Résultats : `brut/serie-*/RESULTATS.md` (imprimé par `synthese.py`).

```bash
npm install && (cd isoles/vue-vapor && npm install) && (cd isoles/solid-1 && npm install)
bash run.sh 10        # construction, garde de repos, calibrage, 10 passages, synthèse (~35 min)
```

`dist/` contient les fichiers mesurés (construits par `construire.mjs`, empreintes dans
`brut/serie-*/SHA256SUMS-dist`) ; leurs versions `.gz` et `.br` se régénèrent.
