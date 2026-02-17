<template>
  <q-page class="row items-center justify-center" style="min-height: 100vh">
    <div class="full-width q-pa-sm" style="max-width: 1100px; box-sizing: border-box">
      <Pokemons />
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';

export default defineComponent({
  name: 'HomePage',
  components: {
    Pokemons: defineAsyncComponent(() => import('src/components/Pokemons.vue')),
  },
});
</script>
