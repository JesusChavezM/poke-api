<template>
  <q-page class="row items-center justify-evenly">
    <PokemonTester />
  </q-page>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';

export default defineComponent({
  name: 'HomePage',
  components: {
    PokemonTester: defineAsyncComponent(() => import('src/components/PokemonTester.vue')),
  },
});
</script>
