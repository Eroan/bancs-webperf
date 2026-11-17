// Données fixes du composant : N produits, générateur congruentiel (même suite à chaque appel).
const OBJETS = ['Chaise', 'Table', 'Lampe', 'Tapis', 'Miroir', 'Vase', 'Coussin', 'Étagère', 'Fauteuil', 'Bureau', 'Plaid', 'Horloge'];
const QUALITES = ['en chêne', 'en lin', 'noire', 'dorée', 'vintage', 'scandinave', 'en rotin', 'en laine'];
export function generer(n) {
  let s = 20261117;
  const alea = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const liste = [];
  for (let id = 1; id <= n; id++) {
    const prix = 990 + Math.floor(alea() * 49000);
    liste.push({
      id,
      nom: `${OBJETS[Math.floor(alea() * OBJETS.length)]} ${QUALITES[Math.floor(alea() * QUALITES.length)]} n°${id}`,
      prix,
      prixTexte: (prix / 100).toFixed(2).replace('.', ',') + ' €',
    });
  }
  return liste;
}
