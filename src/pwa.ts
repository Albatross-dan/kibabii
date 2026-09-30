import { registerSW } from 'virtual:pwa-register';

export function registerPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] New content available, dispatching update event');
        window.dispatchEvent(new CustomEvent('pwa-update-available'));
      },
      onOfflineReady() {
        console.log('[PWA] App is ready to work offline with cached assets');
      },
      onRegisteredSW(swScriptUrl, registration) {
        console.log('[PWA] Service Worker registered:', swScriptUrl, registration);
      },
      onRegisterError(error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      }
    });

    return updateSW;
  }
  return () => {};
}
