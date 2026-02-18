import { defineRouter } from '#q-app/wrappers';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { setOnUnauthorizedHandler, clearAuthStorage } from 'src/lib/apiClient';

export default defineRouter(function () {
  const createHistory = process.env.SERVER ? createMemoryHistory : createWebHistory;
  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  let handlingUnauthorized = false;
  setOnUnauthorizedHandler(async () => {
    if (handlingUnauthorized) return;
    handlingUnauthorized = true;

    try {
      clearAuthStorage();

      if (router.hasRoute && !router.hasRoute('login')) {
        console.warn('No route named "login" found; skipping redirect');
        return;
      }
      const current = router.currentRoute.value;
      if (current?.name !== 'login') {
        try {
          await router.replace({ name: 'login' });
        } catch (err) {
          console.error('router.replace failed, fallback to location.href', err);
          try {
            window.location.href = '/login';
          } catch (err) {
            console.error('Failed to redirect to login page:', err);
          }
        }
      }
    } finally {
      setTimeout(() => {
        handlingUnauthorized = false;
      }, 600);
    }
  });

  router.beforeEach((to, from, next) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const requiresAuth = to.meta?.requiresAuth === true;
    if (requiresAuth && !token) {
      return next({ name: 'login' });
    }
    if (to.name === 'login' && token) {
      return next({ name: 'home' });
    }
    return next();
  });

  return router;
});
