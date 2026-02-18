import { boot } from 'quasar/wrappers';

declare global {
  interface Window {
    __gsiLoaded?: Promise<void>;
    google?: any;
  }
}

export default boot(() => {
  const id = 'gsi-client-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  let resolveFn: () => void;
  let rejectFn: (err: any) => void;
  window.__gsiLoaded = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  script.addEventListener('load', () => {
    if (window.google) {
      resolveFn();
    } else {
      setTimeout(() => {
        if (window.google) resolveFn();
        else rejectFn(new Error('GSI script loaded but window.google is undefined'));
      }, 50);
    }
  });
  document.head.appendChild(script);
});
