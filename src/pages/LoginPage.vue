<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="login-page">
        <div class="background-scene">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
          <div class="floating-pokemon p1">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="Pikachu" />
          </div>
          <div class="floating-pokemon p2">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png" alt="Eevee" />
          </div>
          <div class="floating-pokemon p3">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png" alt="Jigglypuff" />
          </div>
          <div class="floating-pokemon p4">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png" alt="Charmander" />
          </div>
          <div class="floating-pokemon p5">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png" alt="Squirtle" />
          </div>
        </div>
        <div class="login-wrapper">
          <div class="logo-badge">
            <div class="badge-inner">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                alt="Pikachu"
                class="badge-img"
                loading="lazy"
              />
            </div>
          </div>
          <div class="login-card">
            <div class="login-header">
              <h1 class="login-title">¡Bienvenido, Entrenador!</h1>
              <p class="login-subtitle">Comienza tu aventura Pokémon</p>
            </div>
            <div class="login-content">
              <div id="g_id_signin" class="google-btn-wrapper"></div>
            </div>
          </div>
          <div class="login-footer">
            <p class="footer-text text-grey-7">Al continuar, aceptas nuestros términos • Atrapa todos los datos</p>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { postApi } from 'src/lib/apiClient';

const router = useRouter();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

declare global {
  interface Window {
    google?: any;
    handleCredentialResponse?: (resp: any) => void;
  }
}

window.handleCredentialResponse = (resp: any) => {
  void (async () => {
    const id_token = resp?.credential;
    if (!id_token) return console.error('No credential from Google');

    try {
      const r = await postApi('/auth/google', { idToken: id_token });
      const payload = r.data as Record<string, any> | null;

      if (r.status >= 200 && r.status < 300 && payload) {
        const sessionToken = payload.sessionToken ?? payload.token;
        const user = payload.user ?? payload;
        if (!sessionToken) return console.error('No session token returned', r);
        localStorage.setItem('token', sessionToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));
        try {
          await router.replace({ name: 'home' });
        } catch {
          window.location.href = '/';
        }
      } else {
        console.error('Auth failed', r);
      }
    } catch (err) {
      console.error('Login error', err);
    }
  })();
};
console.log('VITE_API_BASE_URL ->', import.meta.env?.VITE_API_BASE_URL || 'no disponible');
console.log('location.origin ->', location.origin);

onMounted(() => {
  const init = () => {
    if (!window.google) return setTimeout(init, 100);
    const el = document.getElementById('g_id_signin');
    if (!el) return setTimeout(init, 100);

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: window.handleCredentialResponse,
    });
    window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large' });
  };
  init();
});
</script>
