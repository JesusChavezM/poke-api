<template>
  <q-page class="q-px-xs q-py-sm">
    <div class="col-12">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-subtitle1 text-grey-7 q-mt-xs" v-text="'Implementando PokeAPI — interfaz ligera que muestra imágenes oficiales, tipos y evoluciones.'" />
          <div class="q-mt-xs">
            <span class="text-caption text-grey-6" v-text="`Mostrando ${list.length} de ${count ?? 0} Pokémon`" />
          </div>
        </div>
      </div>
      <div class="row">
        <div v-for="(p, i) in list" :key="i" class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-xs">
          <PokemonCard :pokemon="p" @select="onSelectAndOpen" />
        </div>
      </div>
      <q-infinite-scroll :offset="200" v-if="hasMorePage" @load="infiniteLoad" class="q-mt-md">
        <template #loading>
          <div class="img-overlay-center">
            <img src="/icons/loader-pokeball.svg" alt="loading" class="pokeball-loader" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
    <PokemonDetails ref="detailsRef" :items="list" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Notify } from 'quasar';
import { usePokemon } from 'src/hooks/usePokemon';
import type { PokemonListItem } from 'src/hooks/usePokemon';
import PokemonCard from './PokemonCard.vue';
import PokemonDetails from './PokemonDetails.vue';

export default defineComponent({
  name: 'PokemonList',
  components: {
    PokemonDetails,
    PokemonCard,
  },
  setup() {
    const { list, count, fetchList } = usePokemon();
    const pageLimit = 20;
    const offset = ref(0);
    const detailsRef = ref<typeof PokemonDetails>();

    const hasMorePage = computed(() => offset.value + pageLimit < (count.value ?? 0));

    const onSelectAndOpen = (item: PokemonListItem) =>
      detailsRef.value && typeof detailsRef.value.open === 'function'
        ? detailsRef.value.open(item.id ?? item.name)
        : Notify.create({ type: 'warning', message: 'Detalle no disponible' });

    async function infiniteLoad(index: number, done: (stop?: boolean) => void) {
      try {
        if (!hasMorePage.value) done(true);
        offset.value += pageLimit;
        const ok = await fetchList(pageLimit, offset.value);
        if (!ok) {
          Notify.create({ type: 'negative', message: 'Error cargando más pokémon' });
          done(true);
          return;
        }
        done();
      } catch (err) {
        console.error('infiniteLoad error', err);
        Notify.create({ type: 'negative', message: 'Error en infiniteLoad' });
        done(true);
      }
    }

    onMounted(async () => await fetchList(pageLimit, offset.value));

    return {
      list,
      count,
      pageLimit,
      offset,
      hasMorePage,
      infiniteLoad,
      onSelectAndOpen,
      detailsRef,
    };
  },
});
</script>
