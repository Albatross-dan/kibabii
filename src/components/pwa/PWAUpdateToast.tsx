import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdateToast: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNeedRefresh(true);
    };

    window.addEventListener('pwa-update-available', handleUpdate);
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  if (!needRefresh) {
    return null;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">App Update Available</h4>
          <p className="text-[11px] text-slate-300">A new version of Comrade Market is ready.</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleReload}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
