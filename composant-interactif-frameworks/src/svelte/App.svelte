<script>
  // Svelte 5 : runes $state et $derived, {#each} à clé ; « prêt » au montage.
  import { onMount } from 'svelte';
  import { correspond, trier, sensSuivant, donnees, pret } from '../commun.js';
  const items = donnees();
  let q = $state('');
  let sens = $state(0);
  let favs = $state({});
  const visibles = $derived.by(() => { const f = items.filter((i) => correspond(i.nom, q)); return sens ? trier(f, sens) : f; });
  const nbFav = $derived(Object.values(favs).filter(Boolean).length);
  onMount(pret);
</script>

<div class="outils"><input id="filtre" type="search" aria-label="Filtrer" bind:value={q}> <button id="tri" type="button" onclick={() => (sens = sensSuivant(sens))}>Trier par prix</button> <span id="compteur">{nbFav} favori(s)</span></div>
<ul id="liste">
  {#each visibles as i (i.id)}<li class="ligne" data-id={i.id}><span class="nom">{i.nom}</span> <span class="prix">{i.prixTexte}</span> <button class="fav" type="button" aria-label="Favori" aria-pressed={String(!!favs[i.id])} onclick={() => (favs[i.id] = !favs[i.id])}>{favs[i.id] ? '★' : '☆'}</button></li>{/each}
</ul>
