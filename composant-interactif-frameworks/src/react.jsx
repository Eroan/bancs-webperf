// React 19 : useState, useMemo, liste avec key ; « prêt » posé au premier commit (useLayoutEffect).
import { useState, useMemo, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
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
      <div className="outils"><input id="filtre" type="search" aria-label="Filtrer" value={q} onChange={(e) => setQ(e.currentTarget.value)} /> <button id="tri" type="button" onClick={() => setSens(sensSuivant)}>Trier par prix</button> <span id="compteur">{nbFav} favori(s)</span></div>
      <ul id="liste">
        {visibles.map((i) => (
          <li className="ligne" data-id={i.id} key={i.id}><span className="nom">{i.nom}</span> <span className="prix">{i.prixTexte}</span> <button className="fav" type="button" aria-label="Favori" aria-pressed={String(!!favs[i.id])} onClick={() => setFavs((f) => ({ ...f, [i.id]: !f[i.id] }))}>{favs[i.id] ? '★' : '☆'}</button></li>
        ))}
      </ul>
    </>
  );
}
createRoot(document.getElementById('app')).render(<App />);
