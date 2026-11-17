// Témoin plancher : DOM créé une fois, filtre par l'attribut hidden, tri par déplacement des nœuds.
import { correspond, trier, sensSuivant, donnees, pret } from './commun.js';
const items = donnees();
const app = document.getElementById('app');
app.innerHTML = '<div class="outils"><input id="filtre" type="search" aria-label="Filtrer"> <button id="tri" type="button">Trier par prix</button> <span id="compteur">0 favori(s)</span></div><ul id="liste"></ul>';
const ul = app.querySelector('#liste'), compteur = app.querySelector('#compteur');
const lignes = new Map(), favs = new Set();
let sens = 0;
const frag = document.createDocumentFragment();
for (const i of items) {
  const li = document.createElement('li'); li.className = 'ligne'; li.dataset.id = i.id;
  const nom = document.createElement('span'); nom.className = 'nom'; nom.textContent = i.nom;
  const prix = document.createElement('span'); prix.className = 'prix'; prix.textContent = i.prixTexte;
  const b = document.createElement('button'); b.className = 'fav'; b.type = 'button';
  b.setAttribute('aria-label', 'Favori'); b.setAttribute('aria-pressed', 'false'); b.textContent = '☆';
  li.append(nom, ' ', prix, ' ', b); lignes.set(i.id, li); frag.append(li);
}
ul.append(frag);
app.querySelector('#filtre').addEventListener('input', (e) => {
  const q = e.currentTarget.value;
  for (const i of items) lignes.get(i.id).hidden = !correspond(i.nom, q);
});
app.querySelector('#tri').addEventListener('click', () => {
  sens = sensSuivant(sens);
  const f = document.createDocumentFragment();
  for (const i of trier(items, sens)) f.append(lignes.get(i.id));
  ul.append(f);
});
ul.addEventListener('click', (e) => {
  const b = e.target.closest('.fav'); if (!b) return;
  const id = Number(b.closest('.ligne').dataset.id);
  favs.has(id) ? favs.delete(id) : favs.add(id);
  b.setAttribute('aria-pressed', String(favs.has(id))); b.textContent = favs.has(id) ? '★' : '☆';
  compteur.textContent = `${favs.size} favori(s)`;
});
pret();
