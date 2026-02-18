<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="text-white" style="background-color: #f7f7f7">
      <div class="flex justify-between q-py-sm q-px-md">
        <div class="row no-wrap items-center">
          <q-icon name="img:/icons/loader-pokeball.svg" size="md" class="q-mr-sm" />
          <div class="text-bold text-h5 text-black" v-text="'Pokédex Explorer'" />
        </div>
        <div class="row items-center">
          <q-btn dense flat round color="black" icon="logout" @click="logout" v-if="user" />
        </div>
      </div>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function getUserFromStorage(): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  try {
    const j = localStorage.getItem('user');
    return j ? JSON.parse(j) : null;
  } catch (err) {
    console.warn('Error parsing user from localStorage:', err);
    return null;
  }
}

const user = ref<Record<string, any> | null>(null);

onMounted(() => {
  user.value = getUserFromStorage();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', () => {
      user.value = getUserFromStorage();
    });
  }
});

async function logout(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (e) {
    console.warn('Error clearing auth storage:', e);
  }
  user.value = null;
  try {
    await router.replace({ name: 'login' });
  } catch (err) {
    console.error('Failed to navigate to login, falling back to location.href', err);
    try {
      if (typeof window !== 'undefined') window.location.href = '/login';
    } catch (e) {
      console.error('Fallback redirect failed', e);
    }
  }
}
</script>
