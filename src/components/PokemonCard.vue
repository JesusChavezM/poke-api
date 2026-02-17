<template>
  <q-card flat bordered class="pokemon-card" clickable @click="$emit('select', pokemon)" :aria-label="`Pokemon ${pokemon.name}`">
    <div class="image-wrapper">
      <q-img :src="pokemon.artwork" ratio="1" class="card-image" :style="imageBackgroundStyle" img-class="fit">
        <template #loading>
          <div class="img-overlay-center">
            <img src="/icons/loader-pokeball.svg" alt="loading" class="pokeball-loader" />
          </div>
        </template>
        <template #error>
          <div class="img-overlay-center img-error">
            <q-icon name="image_not_supported" size="48px" />
          </div>
        </template>
      </q-img>
      <div v-if="pokemon.primaryType" class="type-badge-wrapper" role="presentation">
        <PokemonTypeChip :type="pokemon.primaryType" />
      </div>
    </div>
    <q-card-section class="q-pa-sm">
      <div class="row items-center no-wrap justify-between">
        <div class="col">
          <div class="text-subtitle2 text-capitalize ellipsis" v-text="pokemon.name" />
        </div>
        <div class="meta-row row items-center no-wrap q-gutter-x-sm items-center">
          <img v-if="pokemon.id" src="/icons/loader-pokeball.svg" alt="pokeball" class="meta-pokeball" />
          <div v-if="pokemon.id" class="text-caption id-text" v-text="`#${pokemon.id}`" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import type { PokemonListItem } from 'src/hooks/usePokemon';
import type { PropType } from 'vue';
import PokemonTypeChip from './PokemonTypeChip.vue';
import { hexToRgba } from 'src/utils/hexToRgb';
import { TYPE_COLORS } from 'src/constants/PokemonTypeColors';

export default defineComponent({
  name: 'PokemonCard',
  components: { PokemonTypeChip },
  props: {
    pokemon: { type: Object as PropType<PokemonListItem>, required: true },
  },
  emits: ['select'],
  setup(props) {
    const imageBackgroundStyle = computed(() => {
      const typeKey = props.pokemon.primaryType?.toLowerCase();
      const baseColor = typeKey && TYPE_COLORS[typeKey] ? TYPE_COLORS[typeKey] : '#f5f5f5';
      const top = hexToRgba(baseColor, 0.1);
      const bottom = hexToRgba(baseColor, 0.04);
      return {
        background: `linear-gradient(180deg, ${top}, ${bottom})`,
        transition: 'background 180ms ease',
      } as Record<string, string>;
    });

    return {
      imageBackgroundStyle,
    };
  },
});
</script>
