# Protocole : quand s'exécute un script externe dans un document HTML envoyé en flux ? `defer`, `async`, `type="module"`, module `async`

Écrit le 2026-11-19, après cinq passages pilotes d'un passage chacun (constats plus bas), avant la série.
Point de départ : le billet d'ingénierie de X « Rebuilding the global town square from scratch » (Yagiz Nizipli,
2026-11-04), qui rapporte qu'un point d'entrée chargé en module différé n'hydratait la page qu'à la fin de l'analyse
d'un document envoyé en flux, donc après la dernière frontière Suspense, et qu'en module `async` React s'attachait à
589 ms au lieu de 6 017 ms avec 5 s de délai serveur. La spécification HTML range un script `defer` (et un module sans
`async`, différé par défaut) dans la liste des scripts exécutés quand l'analyse du document est terminée, et un script
`async` dans l'ensemble des scripts exécutés dès que possible.

## Question

Dans un document envoyé en deux parties séparées par une pause du serveur, un script externe placé dans le `<head>`
s'exécute-t-il avant l'arrivée de la seconde partie, selon son attribut et selon le moteur ?

## Variantes

Le serveur (`serveur.mjs`, Node, port choisi par le système) envoie le `<head>` et une coquille (`<main>`), puis, après
2 000 ms, la seconde partie (`<section id="fin">`) et la fin du document. Le script est servi sans délai, `no-store`.

| Variante | Balise dans le `<head>` |
|---|---|
| `defer` | `<script defer src>` |
| `async` | `<script async src>` |
| `module` | `<script type="module" src>` (différé par défaut) |
| `module-async` | `<script type="module" async src>` |
| `async-lent` | `<script async src>`, script servi après 300 ms |
| `module-async-lent` | `<script type="module" async src>`, script servi après 300 ms |

Chaque variante est servie avec deux coquilles : `courte` (un titre et une phrase) et `longue` (même chose plus
environ 1 500 caractères de texte). Les variantes `-lent` et la coquille longue sont les témoins du report de WebKit
(voir Constats du pilote).

## Mesure

Playwright 1.65.0 : Chrome stable installé (`channel: 'chrome'`), Firefox et WebKit de Playwright, sans affichage,
contexte neuf à chaque chargement, aucun bridage. Le script enregistre `performance.now()`, `document.readyState` et la
présence de `#fin` au moment de son exécution ; la page enregistre l'analyse de la coquille et de la suite (scripts en
ligne), `DOMContentLoaded`, `load`, le FCP (Paint Timing) et le Resource Timing du script ; le serveur journalise
l'instant de chaque requête.

Une variante s'exécute « avant la suite » quand `#fin` est absent du DOM à l'exécution du script. Le résultat publié est
ce compte, « n/N chargements », par moteur, variante et coquille ; les instants (médiane [min, max]) servent à le lire et
ne sont pas comparés entre eux à la milliseconde.

Série : 5 passages, variantes alternées dans chaque passage, soit 5 chargements par moteur, variante et coquille.

## Témoins

- **Flux réel** : la coquille est analysée avant 500 ms et la suite après la pause, dans chaque chargement (sinon le
  document est arrivé d'un bloc et la question ne se pose pas).
- **Témoin négatif** : `defer` et `module` s'exécutent après la suite dans chaque moteur (règle de la spécification).
- **Témoin positif** : `async-lent` sur coquille longue s'exécute avant la suite dans chaque moteur.
- **Complétude** : une exécution exactement et aucune erreur par chargement ; une requête de script par chargement au
  journal du serveur.

`synthese.py` sort en 1 si un témoin échoue, et imprime chaque nombre dans `RESULTATS.md`.

## Constats du pilote (2026-11-19, un passage)

- Chrome 158.0.8127.37 et Firefox 159.0 : `async` et module `async` exécutés avant la suite (7 à 44 ms), `defer` et
  `module` à l'arrivée de la suite (vers 2 005 ms).
- WebKit 27.2 : les quatre variantes de base exécutées à l'arrivée de la suite, alors que le script est reçu en 3 à
  18 ms. Le code de WebKit (`Document::shouldDeferAsynchronousScriptsUntilParsingFinishes()`, `Document.cpp`, et
  `ScriptRunner::timerFired()`, `ScriptRunner.cpp`, commit 295d072f6600a0218be3642c1f5f112d9f87db7a de main, lu le
  2026-11-19) retient un script portant l'attribut `async` tant que le document est en cours d'analyse et que la vue
  n'a jamais été peinte. L'exécution n'est relancée qu'à la fin d'un chargement de script, à la fin de l'analyse ou à la
  fin d'une pause du parseur : un script arrivé avant le premier rendu attend donc la fin du document même si la page est
  peinte entre-temps (coquille longue : FCP vers 20 ms, exécution vers 2 005 ms). Servi après 300 ms, donc après le
  premier rendu de la coquille longue, il s'exécute à 309 ms ; avec la coquille courte, qui n'est pas peinte avant la
  suite (FCP vers 2 006 ms), il attend.

## Limites

- WebKit de Playwright n'est pas Safari : le comportement est lu dans le code de WebKit et mesuré sur la build de
  Playwright ; Safari n'est pas testé. Une exception par domaine existe (`quirks().shouldBypassAsyncScriptDeferring()`).
- Versions en retard sur les dernières publiées au 2026-11-19 : Chrome 158 installé (159.0.8154.13 publié), Firefox 159.0
  de Playwright, build patchée (160.0.1 publié).
- Un seul placement (`<head>`), un seul délai de pause, aucune hydratation réelle : le banc mesure l'instant d'exécution
  du script, pas le travail d'un framework.
