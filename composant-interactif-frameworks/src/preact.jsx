// Preact 11 : useState, useMemo, liste avec key ; « prêt » posé au premier commit (useLayoutEffect).
import { useState, useMemo, useLayoutEffect } from 'preact/hooks';
import { render } from 'preact';
import { correspond, trier, sensSuivant, donnees, pret } from './commun.js';
const items = donnees();
function App() {
  const [q, setQ] = useState('');
  const [sens, setSens] = useState(0);
  const [favs, setFavs] = useState({});
  const visibles = useMemo(() => { const f = items.filter((i) => correspond(i.nom, q)); return sens ? trier(f, sens) : f; }, [q, sens]);
  const nbFav = useMemo(() => Object.values(favs).filter(Boolean).length, [favs]);
  useLayoutEffect(() => { pret(); }, []);
  return (
    <>
      <div class="outils"><input id="filtre" type="search" aria-label="Filtrer" value={q} onInput={(e) => setQ(e.currentTarget.value)} /> <button id="tri" type="button" onClick={() => setSens(sensSuivant)}>Trier par prix</button> <span id="compteur">{nbFav} favori(s)</span></div>
      <ul id="liste">
        {visibles.map((i) => (
          <li class="ligne" data-id={i.id} key={i.id}><span class="nom">{i.nom}</span> <span class="prix">{i.prixTexte}</span> <button class="fav" type="button" aria-label="Favori" aria-pressed={String(!!favs[i.id])} onClick={() => setFavs((f) => ({ ...f, [i.id]: !f[i.id] }))}>{favs[i.id] ? '★' : '☆'}</button></li>
        ))}
      </ul>
    </>
  );
}
render(<App />, document.getElementById('app'));
