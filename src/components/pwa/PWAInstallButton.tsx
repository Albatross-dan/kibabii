import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Laptop, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'icon' | 'badge' | 'yellow';
  size?: 'sm' | 'md';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'yellow',
  size = 'md'
}) => {
  const { isInstalled, isIOS, install, hasDeferredPrompt } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  // If already installed as standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (hasDeferredPrompt) {
      await install();
      return;
    }

    setShowDesktopModal(true);
  };

  const basePadding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  let variantStyle = 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-black border border-yellow-500/50 shadow-sm';
  if (variant === 'yellow' || variant === 'primary') {
    variantStyle = 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-black border border-yellow-500/50 shadow-sm';
  } else if (variant === 'outline') {
    variantStyle = 'border border-yellow-500 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black shadow-sm';
  } else if (variant === 'ghost') {
    variantStyle = 'hover:bg-yellow-200 text-slate-950 font-bold';
  } else if (variant === 'icon') {
    variantStyle = 'p-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-sm border border-yellow-500/50';
  } else if (variant === 'badge') {
    variantStyle = 'bg-yellow-300 text-slate-950 border border-yellow-500 hover:bg-yellow-400 px-2 py-0.5 text-[11px] rounded-full font-bold shadow-2xs';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer ${variant === 'icon' || variant === 'badge' ? '' : basePadding} ${variantStyle} ${className}`}
        title="Install Comrade Market on your device"
      >
        <Download className={iconSize} />
        {variant !== 'icon' && (
          <>
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </>
        )}
      </button>

      {/* Guided iOS Safari Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl space-y-4 text-left"
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
                  Tap the <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">Share <Share2 className="w-3.5 h-3.5 inline text-sky-600" /></strong> icon in Safari bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  Scroll down and tap <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" /></strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  Tap <strong className="text-slate-900 font-bold">Add</strong> at top right to complete installation.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
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
              <p>Install Comrade Market on your computer or mobile browser for rapid offline access and full native speed:</p>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Click the <strong>Install</strong> icon (⊞ or ⬇) in your browser address bar (top right).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Or open browser menu (<strong>⋮</strong> / <strong>⋯</strong>) and click <strong>"Install Comrade Market..."</strong>.</span>
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
