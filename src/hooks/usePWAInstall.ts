import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Module-level global prompt storage to prevent race condition if beforeinstallprompt
// fires before React components mount
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  // Check if already captured earlier
  if ((window as any).__deferredPWAInstallPrompt) {
    globalDeferredPrompt = (window as any).__deferredPWAInstallPrompt;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default mini-infobar so our custom high-visibility banner and buttons handle it smoothly
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).__deferredPWAInstallPrompt = globalDeferredPrompt;
    window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    (window as any).__deferredPWAInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return globalDeferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPWAInstallPrompt : null);
  });
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
  });
  const [isInstallable, setIsInstallable] = useState(() => {
    return !!(globalDeferredPrompt || (typeof window !== 'undefined' && (window as any).__deferredPWAInstallPrompt));
  });

  useEffect(() => {
    // 1. Detect if the app is already running in standalone PWA mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    // 2. Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // If global prompt already exists, make sure local state is synced
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstallable(true);
    }

    const handlePromptCaptured = () => {
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
        setIsInstallable(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      (window as any).__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      (window as any).__deferredPWAInstallPrompt = null;
    };

    window.addEventListener('pwa-prompt-captured', handlePromptCaptured);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-captured', handlePromptCaptured);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const promptToUse = deferredPrompt || globalDeferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPWAInstallPrompt : null);
    if (!promptToUse) {
      return false;
    }
    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        (window as any).__deferredPWAInstallPrompt = null;
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error during PWA installation prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    install,
    hasDeferredPrompt: !!(deferredPrompt || globalDeferredPrompt)
  };
}
