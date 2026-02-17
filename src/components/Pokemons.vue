<template>
  <q-page class="q-px-xs q-py-sm">
    <div class="col-12">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h2" v-text="'Pokédex Explorer'" />
          <div
            class="text-subtitle1 text-grey-7 q-mt-xs"
            v-text="'Implementando PokeAPI — interfaz ligera que muestra imágenes oficiales, tipos y evoluciones.'"
          />
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

    <!-- <q-dialog v-model="dialogOpen" :maximized="true" transition-show="slide-up" transition-hide="slide-down">
      <q-card flat class="bg-white" style="height: 100vh; display: flex; flex-direction: column">
        <q-toolbar class="q-pa-xs">
          <q-btn dense flat round icon="close" aria-label="Cerrar" @click="closeDialog" />
          <q-btn dense flat round icon="chevron_left" aria-label="Anterior" :disable="!hasPrev" @click="prevPokemon" class="q-ml-xs" />
          <q-toolbar-title class="q-ml-xs">{{ dialogTitle }}</q-toolbar-title>
          <q-btn dense flat round icon="chevron_right" aria-label="Siguiente" :disable="!hasNext" @click="nextPokemon" class="q-mr-sm" />
          <div class="q-mx-sm" />
          <q-toggle dense v-model="includeEvolutions" label="Evolutions" />
        </q-toolbar>

        <q-separator />
        <q-card-section style="flex: 1 1 auto; overflow: auto; padding: 16px">
          <PokemonDetails :nameOrId="selectedKey ?? '1'" :includeEvolutions="includeEvolutions" @select-evolution="onSelectEvolution" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-sm">
          <q-btn flat label="Cerrar" @click="closeDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog> -->
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Notify } from 'quasar';
import { usePokemon } from 'src/hooks/usePokemon';
import type { PokemonListItem } from 'src/hooks/usePokemon';
import PokemonCard from './PokemonCard.vue';

export default defineComponent({
  name: 'PokemonList',
  components: {
    // PokemonDetails,
    PokemonCard,
  },
  setup() {
    const { list, count, fetchList } = usePokemon();

    // pagination
    const pageLimit = 20;
    const offset = ref(0);

    // dialog/selection
    const dialogOpen = ref(false);
    const selectedKey = ref<string | number | null>(null);
    const includeEvolutions = ref(true);

    // initial load
    onMounted(() => {
      void fetchList(pageLimit, offset.value);
    });

    const hasMorePage = computed(() => offset.value + pageLimit < (count.value ?? 0));
    const dialogTitle = computed(() => (selectedKey.value ? `Detalle — ${selectedKey.value}` : 'Detalle'));

    function infiniteLoad(index: number, done: (stop?: boolean) => void) {
      void (async () => {
        try {
          if (!hasMorePage.value) {
            done(true);
            return;
          }
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
      })();
    }

    function onSelectAndOpen(item: PokemonListItem) {
      selectedKey.value = item.id ?? item.name;
      dialogOpen.value = true;
    }

    function findIndexByKey(key: string | number | null) {
      if (key === null || key === undefined) return -1;
      // si key es número, comparar con item.id
      const keyAsNumber = typeof key === 'number' || (!isNaN(Number(key)) && String(key).trim() !== '') ? Number(key) : null;
      if (keyAsNumber !== null && !isNaN(keyAsNumber)) {
        return list.value.findIndex((it) => (it as any).id === keyAsNumber);
      }
      const keyStr = String(key).toLowerCase();
      return list.value.findIndex((it) => (it.name || '').toLowerCase() === keyStr);
    }

    const currentIndex = computed(() => findIndexByKey(selectedKey.value));
    const hasPrev = computed(() => currentIndex.value > 0);
    const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < list.value.length - 1);

    function goToIndex(idx: number) {
      const it = list.value[idx];
      if (!it) return;
      selectedKey.value = it.id ?? it.name;
    }

    function prevPokemon() {
      if (!hasPrev.value) return;
      goToIndex(currentIndex.value - 1);
    }

    function nextPokemon() {
      if (!hasNext.value) return;
      goToIndex(currentIndex.value + 1);
    }

    function onSelectEvolution(payload: { id?: number | null; name: string }) {
      selectedKey.value = payload.id ?? payload.name;
      Notify.create({ type: 'info', message: `Cargando ${payload.name}…` });
    }

    function closeDialog() {
      dialogOpen.value = false;
    }

    return {
      list,
      count,
      pageLimit,
      offset,
      hasMorePage,
      dialogOpen,
      selectedKey,
      includeEvolutions,
      dialogTitle,
      onSelectAndOpen,
      onSelectEvolution,
      closeDialog,
      nextPokemon,
      prevPokemon,
      hasPrev,
      hasNext,
      infiniteLoad,
    };
  },
});
</script>
