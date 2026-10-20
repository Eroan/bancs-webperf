# Protocole : report des scripts à la première interaction

Écrit le 2026-10-20, avant la série publiable. Méthode : article « Banc comparatif
reproductible » du wiki technique interne de l'agence (`banc-comparatif-reproductible-mesurer-des-variantes`).

## Question

Reporter des scripts à la première interaction (ou à un plafond) : que gagne-t-on en
chargement, et que perd-on en **mesure d'audience** et en **réactivité des gestes réels** ?
Trois objections à trancher :

1. « C'est de la triche pour Lighthouse » : écart entre ce que voit Lighthouse (aucun
   geste) et ce que vit un visiteur qui touche la page.
2. « On perd des données » : part des visiteurs sans geste dont la mesure d'audience
   n'arrive pas avant leur départ.
3. « Le premier clic devient lent » : un geste précoce est-il immédiat, différé ou perdu,
   et l'INP le voit-il ?

## Page et variantes (une seule variable : le mode de chargement des scripts)

Page servie en local (`site.mjs`), gzip, HTTP/1.1, deux origines (`site.localhost`,
`tiers.localhost`). Contenu fixe : en-tête fixe à menu burger, image principale (LCP,
WebP 50 Ko), FAQ en accordéon, carrousel Slick, galerie Magnific Popup, texte.

| Script | Version | Origine |
|---|---|---|
| jQuery + jQuery Migrate | 3.7.1 + 3.4.1 (couple de WordPress) | npm |
| Slick, Magnific Popup | 1.8.1, 1.2.0 | npm |
| `theme.js` (menu, FAQ, init. des plugins, défilement) | banc | `site.mjs` |
| inline dépendant de jQuery (« haut de page ») | banc | `site.mjs` |
| GA4 `gtag.js` | réel, `?id=G-BANC000001`, 442 Ko non compressé, sha256 `aacf75c0…` | téléchargé le 2026-10-20, servi en local |
| Meta Pixel `fbevents.js` 2.9.425 + `signals/config` | réel, 435 Ko + 28 Ko, sha256 `719d46f5…` | téléchargé le 2026-10-20, servi en local |

Ces fichiers tiers ne sont pas dans le dépôt : `vendor/recuperer.sh` les récupère et compare
leur empreinte à `vendor/SHA256SUMS` (série de référence).
| widget de chat | **synthétique** : ~150 Ko, ~350 ms de travail à ×8, écouteur de clic global | `site.mjs` |

Variantes :

- **A classique** : jQuery bloquant dans le `<head>`, scripts du thème synchrones en pied, tiers `async`.
- **B defer** : scripts propres en `defer`, inline dépendant enveloppé dans `DOMContentLoaded`, tiers `async`.
- **C report des tiers (AWP)** : B + `AwpDelayScripts` (`vendor/awp-delay-scripts.js`) :
  bibliothèque GA 2 500 ms, Pixel 3 000 ms, chat 7 000 ms, plafond 5 s après `DOMContentLoaded`.
- **E report hors mesure (AWP)** : C, mais GA4 laissé en `async`.
- **D tout reporter (WP Rocket)** : A transformé par Delay JS de WP Rocket 3.23.5.1
  (`HTML::replace_scripts`, exclusions par défaut de `dynamic-lists.json`, chargeur
  `lazyload-scripts.min.js` 2.0.5 en tête). jQuery compris. Pas de plafond.

## Fixe

- Chrome stable piloté par Playwright 1.64.1, **en fenêtre** (pas headless : clôture des
  entrées Event Timing), contexte neuf à chaque passage.
- Mobile : 412 × 823, DPR 1,75, tactile, UA « moto g power (2022) ».
- Réseau : Slow 4G de Lighthouse (562,5 ms, 1,44 Mbit/s, 0,675 Mbit/s), par CDP.
- Processeur : **deux niveaux calibrés** par l'indice de Lighthouse calculé dans la page
  (`calibrage.mjs`) :
  - ~460 : mobile milieu de gamme visé par le ×4 de Lighthouse sur un poste de 1 500 à 2 000 ;
  - ~173 : équivalent PageSpeed Insights : indice de ses machines relevé le 2026-10-20 par
    l'API sur 12 réponses distinctes, médiane 694 [470, 1 156], ÷ 4 de son throttling simulé
    (`brut/psi-indice-machines-2026-10-20.json`). La dispersion des machines de PSI est
    grande : son équivalent va de ~117 à ~289.
  Sur le Mac Studio M4 Max du banc (indice ~4 060 à ×1), le ×4 par défaut donne ~970 :
  un mobile haut de gamme, pas représentatif.
- Aucune requête ne sort : tout hôte autre que `*.localhost` est intercepté, journalisé et
  servi localement (204, ou la configuration du Pixel archivée).

## Parcours (instants depuis le début de la navigation, observation 20 s)

| Parcours | Gestes |
|---|---|
| `passif` | aucun |
| `tap2` / `tap4` / `tap7` | tap FAQ à 2 / 4 / 7 s, tap menu 1,5 s plus tard |
| `scrolltap` | défilement tactile à 1,5 s, tap menu à 2,5 s, retap menu à 4 s |
| `temoin` (A, B) | tap sur un bouton dont le gestionnaire occupe 100 ms |

Gestes synthétisés par le navigateur (`Input.synthesizeTapGesture`,
`synthesizeScrollGesture`), coordonnées relevées une fois page au repos : aucun appel au
fil principal de la page ne précède un geste (sinon le geste attend la page, ce que ne fait
pas un doigt : jusqu'à 800 ms de retard constatés au pilote).

## Relevés

Sonde injectée avant tout script (avant le patch d'`addEventListener` de WP Rocket) : FCP,
LCP, tâches longues, LoAF avec attribution, Event Timing (seuil 16 ms), `pointerdown` et
`click` (réel ou rejoué), bascules du menu, ouverture de la FAQ, init. de Slick, bulle de
chat. Côté réseau : heure d'arrivée des appels GA4 (`en=page_view`) et Meta (`ev=PageView`).

Issue d'un geste : **immédiat** (effet ≤ 200 ms après le `pointerdown`), **différé**,
**perdu** (aucun effet en 20 s). Durée Event Timing de l'interaction = ce que verrait l'INP.

Lighthouse 13.5.0 mobile, throttling simulé, `cpuSlowdownMultiplier` = les deux taux
calibrés, trois passages alternés, échauffement jeté, envois Google et Meta bloqués.

## Passages et conclusion

10 passages par parcours et par variante et par niveau, variantes alternées (départ
décalé à chaque passage). Durées publiées en médiane [min, max] ; un écart ne s'écrit que
si les plages ne se recouvrent pas. Proportions en « n/N » avec leur critère.

## Contrôles

- **Machine au repos** : refus de démarrer si le processeur est inactif à moins de 85 % (`top`)
  ou si l'indice à ×1 tombe sous 3 500 (`run.sh`) ; la charge moyenne de macOS ne départage pas
  une machine inactive d'une machine chargée (2 à 3 dans les deux cas, mesuré le 2026-10-20) ; charge et processus relevés à chaque étape
  dans `machine.txt`.
- **Témoin** de durée connue : traitement du clic entre 95 et 130 ms (pilote : 104 à 108).
- **Bridage réseau** : LCP 396 ms sans bridage contre 1 872 ms sous Slow 4G (pilote, A).
- **Gestes à l'heure** : retard sur l'horaire prévu imprimé par la synthèse (pilote : -1 à 2 ms).
- **Rien ne sort** : vérifié pour Lighthouse (statut -1, 0 octet vers google-analytics.com
  et facebook.net).

## Limites connues

- HTTP/1.1 local (6 connexions par hôte), pas HTTP/2.
- Chat synthétique : coût calibré, pas un produit réel.
- GA4 et Pixel avec des identifiants fictifs : le code servi est réel, la configuration
  du conteneur est celle d'un identifiant inconnu.
- En D, le bouton témoin n'est pas un témoin : WP Rocket retient aussi son écouteur de
  clic jusqu'au chargement complet.
- Lighthouse : la configuration du Pixel n'est pas servie (bloquée), contrairement au banc Playwright.
