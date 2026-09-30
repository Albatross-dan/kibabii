import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Laptop, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install, hasDeferredPrompt } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this browser session
    const dismissedSession = sessionStorage.getItem('pwa_install_banner_dismissed');
    if (dismissedSession === 'true') {
      setIsDismissed(true);
      return;
    }

    // Auto-prompt delay so page loads and renders first (1.2 seconds)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_install_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (hasDeferredPrompt) {
      const success = await install();
      if (success) {
        setIsDismissed(true);
      }
      return;
    }

    // If browser didn't fire beforeinstallprompt (e.g. desktop Chrome/Edge or iframe), show guided modal
    setShowDesktopModal(true);
  };

  // Do not show if already running in standalone PWA, dismissed, or initial delay not finished
  if (isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Installation Card / Banner */}
      <aside 
        aria-label="Install Comrade Market Application"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#101732]/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shrink-0 shadow-lg">
            <img 
              src="/pwa-192x192.png" 
              alt="Comrade Market Logo" 
              className="w-full h-full object-cover rounded-[10px]" 
            />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-white leading-tight truncate">
                Install Comrade Market
              </h4>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-sm">
                Fast &amp; Offline
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 font-medium leading-snug mt-1">
              Tap to install on your device for instant offline loading, zero data lags, and fullscreen marketplace deals.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isIOS ? 'How to Install' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close install prompt"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors -mr-1 -mt-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Guided iOS Safari Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#E53E3E]" />
                <h3 className="text-base font-black text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  Tap the <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">Share <Share2 className="w-3.5 h-3.5 inline text-sky-600" /></strong> icon in Safari bottom navigation bar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  Scroll down the share sheet and select <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" /></strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  Tap <strong className="text-slate-900 font-bold">Add</strong> in the top-right corner to place Comrade Market directly on your phone.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Guided Desktop / Manual Install Modal */}
      {showDesktopModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowDesktopModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Install Comrade Market</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowDesktopModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
              <p>Install Comrade Market on your computer or phone for rapid offline access and a native desktop app experience:</p>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Look for the <strong>Install</strong> icon (⊞ or ⬇) in your browser address bar (top right).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Or click the browser menu (<strong>⋮</strong> or <strong>⋯</strong>) and select <strong>"Install Comrade Market..."</strong>.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
