// Alpine : x-for sur la liste filtrée et triée (gabarit dans le HTML de la page).
import Alpine from 'alpinejs';
import { correspond, trier, sensSuivant, donnees, pret } from './commun.js';
Alpine.data('liste', () => ({
  items: donnees(), q: '', sens: 0, favs: {},
  get visibles() { const f = this.items.filter((i) => correspond(i.nom, this.q)); return this.sens ? trier(f, this.sens) : f; },
  get nbFav() { return Object.values(this.favs).filter(Boolean).length; },
  basculer(id) { this.favs[id] = !this.favs[id]; },
  trierPrix() { this.sens = sensSuivant(this.sens); },
  init() { this.$nextTick(pret); },
}));
Alpine.start();
