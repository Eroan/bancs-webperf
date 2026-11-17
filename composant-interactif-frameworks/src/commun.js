// Fonctions partagées par toutes les variantes (même code de filtre, de tri et de marque « prêt »).
export const correspond = (nom, q) => nom.toLowerCase().includes(q.trim().toLowerCase());
export const trier = (liste, sens) => [...liste].sort((a, b) => sens * (a.prix - b.prix) || a.id - b.id);
export const sensSuivant = (s) => (s === 1 ? -1 : 1);
export const donnees = () => JSON.parse(document.getElementById('donnees').textContent);
export const pret = () => {
  const n = document.querySelectorAll('#liste .ligne').length;
  window.__pret = { t: performance.now(), n };
  performance.mark('pret');
};
