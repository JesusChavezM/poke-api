import { boot } from 'quasar/wrappers';
import { setOnUnauthorizedHandler, clearAuthStorage } from 'src/lib/apiClient';

export default boot(({ router }) => {
  setOnUnauthorizedHandler(async () => {
    try {
      clearAuthStorage();
      await router.replace({ name: 'login' });
    } catch (err) {
      console.error('Error during unauthorized handler:', err);
      try {
        window.location.href = '/login';
      } catch (err) {
        console.error('Error redirecting to login page:', err);
      }
    }
  });
});
