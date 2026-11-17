// Solid 1.9 : même composant que la variante solid, API 1.x (solid-js/store, solid-js/web, setter par chemin).
import { createSignal, createMemo, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import { render } from 'solid-js/web';
import { correspond, trier, sensSuivant, donnees, pret } from '../../../src/commun.js';
function App() {
  const items = donnees();
  const [q, setQ] = createSignal('');
  const [sens, setSens] = createSignal(0);
  const [favs, setFavs] = createStore({});
  const visibles = createMemo(() => { const f = items.filter((i) => correspond(i.nom, q())); return sens() ? trier(f, sens()) : f; });
  const nbFav = createMemo(() => Object.values(favs).filter(Boolean).length);
  return (
    <>
      <div class="outils"><input id="filtre" type="search" aria-label="Filtrer" onInput={(e) => setQ(e.currentTarget.value)} /> <button id="tri" type="button" onClick={() => setSens(sensSuivant)}>Trier par prix</button> <span id="compteur">{nbFav()} favori(s)</span></div>
      <ul id="liste">
        <For each={visibles()}>{(i) => (
          <li class="ligne" data-id={i.id}><span class="nom">{i.nom}</span> <span class="prix">{i.prixTexte}</span> <button class="fav" type="button" aria-label="Favori" aria-pressed={String(!!favs[i.id])} onClick={() => setFavs(i.id, (v) => !v)}>{favs[i.id] ? '★' : '☆'}</button></li>
        )}</For>
      </ul>
    </>
  );
}
render(() => <App />, document.getElementById('app'));
pret();
