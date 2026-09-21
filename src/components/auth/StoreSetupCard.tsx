import * as React from 'react';
import { Store, MapPin, Tag, FileText, CheckCircle2, AlertCircle, Edit, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StoreSetupCardProps {
  storeName: string;
  businessCategory: string;
  storeLocation: string;
  storeDescription: string;
  storeBannerImage?: string;
  onEditClick?: () => void;
  className?: string;
}

export function StoreSetupCard({
  storeName,
  businessCategory,
  storeLocation,
  storeDescription,
  storeBannerImage = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
  onEditClick,
  className = ''
}: StoreSetupCardProps) {
  // Compute checklist completeness
  const items = [
    { label: 'Store Name Specified', met: !!storeName },
    { label: 'Business Category Chosen', met: !!businessCategory },
    { label: 'Store Location Specified', met: !!storeLocation },
    { label: 'Store Description Written', met: (storeDescription?.length || 0) > 10 },
    { label: 'Store Banner Set', met: !!storeBannerImage && !storeBannerImage.includes('default') }
  ];

  const metCount = items.filter(i => i.met).length;
  const percentage = Math.round((metCount / items.length) * 105); // Cap nicely, let's say up to 100%

  return (
    <Card id="store-setup-card-container" className={`overflow-hidden rounded-3xl border shadow-lg bg-white ${className}`}>
      {/* Banner Cover */}
      <div className="relative h-28 bg-slate-100">
        <img 
          src={storeBannerImage} 
          alt={storeName || 'Store Banner'} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-neutral-900/30"></div>
        <div className="absolute bottom-3 left-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-lg font-black shrink-0">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-white drop-shadow-md">{storeName || 'Official Store'}</h4>
            <p className="text-[10px] text-slate-100 font-bold drop-shadow-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {storeLocation || 'Campus Main Sector'}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Completeness Tracker */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Store Setup Completeness</span>
            <span className="text-secondary font-black">{percentage > 100 ? 100 : percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground mb-2">Setup Checklist</p>
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${it.met ? 'text-slate-600' : 'text-slate-400'}`}>{it.label}</span>
              {it.met ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          ))}
        </div>

        {onEditClick && (
          <Button
            id="store-edit-profile-btn"
            onClick={onEditClick}
            variant="outline"
            className="w-full h-10 text-xs font-black rounded-xl gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 mt-2"
          >
            <Edit className="h-3.5 w-3.5" />
            Modify Store Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
