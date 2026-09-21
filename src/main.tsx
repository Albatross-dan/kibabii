import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Safe localStorage wrapper to prevent QuotaExceededError or security exceptions in sandboxed/iframe environments
(function() {
  let isLocalStorageAvailable = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      if (window.localStorage.getItem(testKey) === '1') {
        window.localStorage.removeItem(testKey);
        isLocalStorageAvailable = true;
      }
    }
  } catch (e) {
    console.warn('[SafeStorage] localStorage access is restricted or disabled:', e);
  }

  if (isLocalStorageAvailable) {
    try {
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = function (key: string, value: string) {
        try {
          originalSetItem.call(window.localStorage, key, value);
        } catch (e) {
          console.warn(`[SafeStorage] localStorage.setItem failed for "${key}" (Quota exceeded?), using in-memory fallback`, e);
        }
      };
    } catch (e) {
      console.warn('[SafeStorage] Could not wrap localStorage.setItem:', e);
    }
  } else {
    // Polyfill localStorage completely with an in-memory equivalent
    console.warn('[SafeStorage] Polyfilling window.localStorage with an in-memory storage.');
    const memoryStore: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => memoryStore[key] !== undefined ? memoryStore[key] : null,
      setItem: (key: string, value: string): void => { memoryStore[key] = String(value); },
      removeItem: (key: string): void => { delete memoryStore[key]; },
      clear: (): void => { for (const k in memoryStore) delete memoryStore[k]; },
      key: (index: number): string | null => Object.keys(memoryStore)[index] || null,
      get length(): number { return Object.keys(memoryStore).length; }
    };
    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
    } catch (e) {
      console.warn('[SafeStorage] Could not redefine window.localStorage, overriding individual properties if possible', e);
      try {
        (window as any).localStorage = mockLocalStorage;
      } catch (err) {
        console.warn('[SafeStorage] Complete override failed:', err);
      }
    }
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

