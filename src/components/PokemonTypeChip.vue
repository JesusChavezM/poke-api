<template>
  <q-chip dense size="sm" :class="['pokemon-type-chip', { 'no-type': !type }]" :style="chipStyle" :aria-label="type ? `Type ${type}` : 'No type'">
    <template #default v-if="iconUrl">
      <q-avatar square dense class="type-avatar">
        <img :src="iconUrl" :alt="type" />
      </q-avatar>
      <span class="type-text" v-text="translateType(displayName)" />
    </template>
  </q-chip>
</template>

<script lang="ts">
import { TYPE_COLORS } from 'src/constants/PokemonTypeColors';
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'PokemonTypeChip',
  props: {
    type: { type: String as () => string | undefined, required: false },
    colorOverride: { type: String as () => string | undefined, required: false },
  },
  setup(props) {
    const buildIconPath = (t?: string) => (t ? `/icons/${t.toLowerCase()}.svg` : undefined);
    const iconUrl = computed(() => (props.type ? buildIconPath(props.type) : undefined));

    const displayName = computed(() => (props.type ? props.type : ''));
    const chipStyle = computed(() => {
      const t = props.type?.toLowerCase();
      const bg = props.colorOverride ?? (t && TYPE_COLORS[t] ? TYPE_COLORS[t] : '#888');
      return {
        background: bg,
        color: '#fff',
        'font-weight': '600',
      } as Record<string, string>;
    });

    const translateType = (type: string) => {
      const translations: Record<string, string> = {
        normal: 'Normal',
        fire: 'Fuego',
        water: 'Agua',
        electric: 'Eléctrico',
        grass: 'Planta',
        ice: 'Hielo',
        fighting: 'Lucha',
        poison: 'Veneno',
        ground: 'Tierra',
        flying: 'Volador',
        psychic: 'Psíquico',
        bug: 'Bicho',
        rock: 'Roca',
        ghost: 'Fantasma',
        dragon: 'Dragón',
        dark: 'Siniestro',
        steel: 'Acero',
        fairy: 'Hada',
      };
      return translations[type.toLowerCase()] || type;
    };

    return {
      iconUrl,
      displayName,
      chipStyle,
      translateType,
    };
  },
});
</script>

<style scoped>
.pokemon-type-chip {
  text-transform: capitalize;
  --q-chip-padding: 4px 8px;
  align-items: center;
  gap: 8px;
}

.type-avatar {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 4px;
  background: transparent;
}

.type-avatar img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}

.type-text {
  font-size: 12px;
  line-height: 1;
  color: inherit;
}

.pokemon-type-chip.no-type {
  background: #d0d0d0;
  color: #222;
}
</style>
