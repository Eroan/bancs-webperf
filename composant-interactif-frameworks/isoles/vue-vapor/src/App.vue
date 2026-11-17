<script setup vapor>
// Vue : ref, reactive, computed, v-for à clé ; « prêt » au montage. Même fichier pour Vue 3.5 et Vapor (attribut vapor ajouté à la construction).
import { ref, reactive, computed, onMounted } from 'vue';
import { correspond, trier, sensSuivant, donnees, pret } from '../../../src/commun.js';
const items = donnees();
const q = ref('');
const sens = ref(0);
const favs = reactive({});
const visibles = computed(() => { const f = items.filter((i) => correspond(i.nom, q.value)); return sens.value ? trier(f, sens.value) : f; });
const nbFav = computed(() => Object.values(favs).filter(Boolean).length);
onMounted(pret);
</script>

<template>
  <div class="outils"><input id="filtre" type="search" aria-label="Filtrer" v-model="q"> <button id="tri" type="button" @click="sens = sensSuivant(sens)">Trier par prix</button> <span id="compteur">{{ nbFav }} favori(s)</span></div>
  <ul id="liste"><li v-for="i in visibles" :key="i.id" class="ligne" :data-id="i.id"><span class="nom">{{ i.nom }}</span> <span class="prix">{{ i.prixTexte }}</span> <button class="fav" type="button" aria-label="Favori" :aria-pressed="String(!!favs[i.id])" @click="favs[i.id] = !favs[i.id]">{{ favs[i.id] ? '★' : '☆' }}</button></li></ul>
</template>
