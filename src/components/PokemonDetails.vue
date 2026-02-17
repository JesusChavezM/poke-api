<template>
  <q-dialog v-model="dialogOpen" maximized backdrop-filter="blur(12px) brightness(0.96)" transition-show="slide-up" transition-hide="slide-down">
    <q-card flat class="pokedex-dialog" :style="dialogStyle">
      <q-btn class="btn-close" flat size="lg" color="white" icon="close" @click="closeDialog" />
      <q-btn class="nav-btn nav-btn-left" :disabled="!hasPrev" color="white" flat size="lg" icon="chevron_left" @click="prevPokemon" />
      <q-btn class="nav-btn nav-btn-right cursor-pointer" :disabled="!hasNext" color="white" flat size="lg" icon="chevron_right" @click="nextPokemon" />

      <div class="dialog-scroll">
        <div v-if="loadingDetail" class="loader-wrap">
          <img src="/icons/loader-pokeball.svg" alt="loading" class="pokeball-loader" />
        </div>
        <div v-else-if="detail" class="detail-grid">
          <div class="left-col">
            <div class="hero-card" :style="heroStyle">
              <div class="pokemon-number text-bold" v-text="`No. ${String(detail.id ?? '—').padStart(4, '0')}`" />
              <q-img :src="detail.sprites?.other?.['official-artwork']?.front_default ?? detail.sprites?.front_default" class="hero-img" fit="contain" no-spinner />
              <span class="blob b1" />
              <span class="blob b2" />
            </div>

            <div v-if="detail.evolutions?.length" class="evo-section">
              <p class="section-label">Cadena evolutiva</p>
              <div class="evo-list">
                <div
                  v-for="ev in detail.evolutions"
                  :key="ev.name"
                  class="evo-item"
                  :class="{ 'evo-active': String(ev.id) === String(detail.id) }"
                  role="button"
                  tabindex="0"
                  @click.stop="onSelectEvolution(ev)"
                  @keyup.enter.stop="onSelectEvolution(ev)"
                >
                  <div class="evo-img-wrap">
                    <q-img :src="ev.sprite" fit="contain" class="evo-img" no-spinner />
                  </div>
                  <span class="evo-name text-capitalize" v-text="ev.name" />
                  <span class="evo-id" v-text="`#${String(ev.id ?? '?').padStart(3, '0')}`" />
                </div>
              </div>
            </div>
          </div>

          <div class="right-col">
            <div class="info-header">
              <h1 class="pokemon-name text-capitalize" v-text="detail.name" />
              <div class="types-row">
                <PokemonTypeChip v-for="t in detail.types" :key="t" :type="t" />
              </div>
            </div>
            <div class="physical-row" v-if="detail.height || detail.weight">
              <div class="physical-item" v-if="detail.height">
                <span class="physical-value" v-text="`${(detail.height / 10).toFixed(1)}m`" />
                <span class="physical-label" v-text="'Altura'" />
              </div>
              <div class="physical-divider" v-if="detail.height && detail.weight" />
              <div class="physical-item" v-if="detail.weight">
                <span class="physical-value" v-text="`${(detail.weight / 10).toFixed(1)}kg`" />
                <span class="physical-label" v-text="'Peso'" />
              </div>
            </div>

            <div class="section-block" v-if="detail.abilities?.length">
              <p class="section-label" v-text="'Habilidades'" />
              <div class="abilities-row">
                <span v-for="ab in detail.abilities" :key="ab" class="ability-chip text-capitalize" :class="{ 'ability-hidden': ab.is_hidden }">
                  <span v-text="ab.name ?? ab" />
                  <span v-if="ab.is_hidden" class="hidden-tag" v-text="'oculta'" />
                </span>
              </div>
            </div>

            <div class="section-block">
              <p class="section-label" v-text="'Estadísticas base'" />
              <div class="stats-list">
                <div v-for="s in detail.stats" :key="s.name" class="stat-row">
                  <span class="stat-name" v-text="statLabel(s.name)" />
                  <span class="stat-val" v-text="s.base" />
                  <div class="stat-bar-bg">
                    <div class="stat-bar-fill" :style="{ width: statPercent(s.base) + '%', background: statColor(s.base) }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="error-state">
          <q-icon name="catching_pokemon" size="48px" style="color: #bbb" />
          <p style="color: white; margin-top: 8px">No se pudo cargar el detalle.</p>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { usePokemon } from 'src/hooks/usePokemon';
import type { PokemonListItem } from 'src/hooks/usePokemon';
import PokemonTypeChip from './PokemonTypeChip.vue';
import { TYPE_COLORS } from 'src/constants/PokemonTypeColors';
import { STAT_LABELS } from 'src/constants/PokemonStatLabels';

export default defineComponent({
  name: 'PokemonDetails',
  components: { PokemonTypeChip },
  props: {
    items: { type: Array as () => Array<PokemonListItem>, default: () => [] },
  },
  emits: ['select-evolution'],
  setup(props, { emit }) {
    const dialogOpen = ref(false);
    const selectedKey = ref<string | number | null>(null);
    const includeEvolutions = ref(true);

    const { fetchDetail } = usePokemon();
    const detail = ref<any>(null);
    const loadingDetail = ref(false);

    async function open(key: string | number) {
      selectedKey.value = key;
      dialogOpen.value = true;
      await loadDetail(key);
    }

    function closeDialog() {
      dialogOpen.value = false;
    }

    function findIndexByKey(key: string | number | null) {
      if (key === null || key === undefined) return -1;
      const n = Number(key);
      if (!isNaN(n) && String(key).trim() !== '') return props.items.findIndex((it: any) => it.id === n);
      const s = String(key).toLowerCase();
      return props.items.findIndex((it) => (it.name || '').toLowerCase() === s);
    }

    const currentIndex = computed(() => findIndexByKey(selectedKey.value));
    const hasPrev = computed(() => currentIndex.value > 0);
    const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.items.length - 1);

    async function goToIndex(idx: number) {
      const it = props.items[idx] as any;
      if (!it) return;
      selectedKey.value = it.id ?? it.name;
      await loadDetail(selectedKey.value);
    }

    const prevPokemon = async () => hasPrev.value && (await goToIndex(currentIndex.value - 1));
    const nextPokemon = async () => hasNext.value && (await goToIndex(currentIndex.value + 1));

    async function loadDetail(key: string | number | null) {
      if (!key) {
        detail.value = null;
        return;
      }
      loadingDetail.value = true;
      detail.value = null;
      try {
        detail.value = await fetchDetail(String(key), { includeEvolutions: includeEvolutions.value });
      } catch (err) {
        console.error('loadDetail error', err);
        detail.value = null;
      } finally {
        loadingDetail.value = false;
      }
    }

    async function onSelectEvolution(ev: { id?: number | null; name: string }) {
      const key = ev.id ?? ev.name;
      if (!key) return;
      dialogOpen.value = true;
      selectedKey.value = key;
      await loadDetail(key);
      emit('select-evolution', ev);
    }

    const primaryType = computed(() => detail.value?.types?.[0] ?? 'normal');
    const accentColor = computed(() => TYPE_COLORS[primaryType.value] ?? '#4a72e8');
    const dialogStyle = computed(() => ({ '--accent': accentColor.value }));
    const heroStyle = computed(() => ({ background: `radial-gradient(ellipse at 55% 40%, ${accentColor.value}20 0%, #F7F7F7 65%)` }));

    const statLabel = (name: string) => STAT_LABELS[name] ?? name;
    const statPercent = (val: number) => Math.min(100, Math.round((val / 255) * 100));

    const statColor = (val: number) => {
      if (val >= 120) return '#22c55e';
      if (val >= 80) return '#eab308';
      if (val >= 50) return '#f97316';
      return '#ef4444';
    };

    watch(includeEvolutions, async () => {
      if (dialogOpen.value && selectedKey.value) await loadDetail(selectedKey.value);
    });

    return {
      dialogOpen,
      selectedKey,
      includeEvolutions,
      detail,
      loadingDetail,
      open,
      closeDialog,
      prevPokemon,
      nextPokemon,
      hasPrev,
      hasNext,
      dialogStyle,
      heroStyle,
      accentColor,
      onSelectEvolution,
      statLabel,
      statPercent,
      statColor,
    };
  },
});
</script>
