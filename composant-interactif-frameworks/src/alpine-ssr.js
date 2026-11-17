// Alpine sur HTML serveur : les lignes sont dans la page, Alpine les lie (x-show, @click, x-text).
import Alpine from 'alpinejs';
import { correspond, pret } from './commun.js';
Alpine.data('listeSsr', () => ({
  q: '', favs: {},
  montre(nom) { return correspond(nom, this.q); },
  get nbFav() { return Object.values(this.favs).filter(Boolean).length; },
  basculer(id) { this.favs[id] = !this.favs[id]; },
  init() { this.$nextTick(pret); },
}));
Alpine.start();
