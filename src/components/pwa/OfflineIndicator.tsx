import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div 
      role="status"
      aria-live="polite"
      className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-3 backdrop-blur-md"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Showing cached marketplace data</span>
      <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
    </div>
  );
};
