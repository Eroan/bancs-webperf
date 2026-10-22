# Bancs webperf : consignes de session

Méthode commune : README.md, puis le PROTOCOLE.md de chaque banc.

- Mesurer à froid : le lanceur refuse de démarrer si le processeur est inactif à moins de 85 % (`top`). La charge moyenne ne sert pas de garde : sur macOS, elle reste à 2 ou 3 même sur une machine inactive. Un chiffre pris sous charge ne se publie pas (pilote du 2026-10-20 : coût du chat doublé).
- Processeur bridé par `calibrage.mjs` (indice de Lighthouse mesuré dans la page), jamais par le ×4 par défaut : sur le Mac Studio M4 Max du banc, ×4 donne un mobile haut de gamme.
- Code tiers non redistribuable (gtag.js, fbevents.js) jamais commité : `vendor/recuperer.sh` et `SHA256SUMS`.
- Tout chiffre repris ailleurs (wiki, rapport) est imprimé par `synthese.py` dans `RESULTATS.md` ; un calcul fait à part s'ajoute d'abord à la synthèse.
