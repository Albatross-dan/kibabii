import * as React from 'react';
import { useState } from 'react';
import { 
  Store, 
  Image, 
  Sliders, 
  BarChart3, 
  Star, 
  Users, 
  Tag, 
  Zap, 
  Compass, 
  ShieldCheck, 
  Coins, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function StoreManagementPanel() {
  const [promoCode, setPromoCode] = useState('COMRADE_DEAL');
  const [promoActive, setPromoActive] = useState(true);

  // Subscriptions Simulated Selection
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'growth' | 'elite'>('free');

  // Interactive flash sale states
  const [flashSaleActive, setFlashSaleActive] = useState(false);

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoActive(true);
    toast.success(`📢 Promo code campaign "${promoCode.toUpperCase()}" launched actively!`);
  };

  const handleCheckoutSubscription = (plan: 'free' | 'growth' | 'elite') => {
    setSelectedPlan(plan);
    const cost = plan === 'elite' ? 'KSh 799/mo' : plan === 'growth' ? 'KSh 299/mo' : 'Free';
    toast.success(`💎 Store Plan updated to ${plan.toUpperCase()} (${cost}). Future Ready Escrow integrated.`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center pb-2 border-b">
        <div>
          <h4 className="font-extrabold text-slate-950 text-sm">Storefront Management Desk</h4>
          <span className="text-[10.5px] text-indigo-600 font-extrabold flex items-center gap-1">
            🏪 Authorized Merchant Mode
          </span>
        </div>
        <div className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 font-black rounded-lg border border-emerald-150">
          Rank: {selectedPlan.toUpperCase()} MERCHANT
        </div>
      </div>

      {/* Primary store dashboard buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
        {[
          { label: 'Edit Profile', icon: <Sliders className="h-4 w-4" /> },
          { label: 'Update Banner', icon: <Image className="h-4 w-4" /> },
          { label: 'Products', icon: <Store className="h-4.5 w-4.5" /> },
          { label: 'Analytics', icon: <BarChart3 className="h-4.5 w-4.5" /> },
          { label: 'Reviews', icon: <Star className="h-4.5 w-4.5" /> },
          { label: 'Followers', icon: <Users className="h-4 w-4" /> },
          { label: 'Promotions', icon: <Tag className="h-4 w-4" /> },
          { label: 'Flash Sales', icon: <Zap className="h-4 w-4" /> },
          { label: 'Featured List', icon: <Coins className="h-4 w-4" /> }
        ].map((opt, oIdx) => (
          <button 
            key={oIdx}
            onClick={() => toast.success(`Redirected to "${opt.label}" Console Panel.`)}
            className="p-3 border rounded-xl hover:bg-slate-50 text-center flex flex-col justify-between items-center text-[10.5px] font-extrabold text-slate-700 hover:border-slate-200 transition-colors gap-2 min-h-[75px]"
          >
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shadow-sm leading-none shrink-0">
              {opt.icon}
            </div>
            <span className="leading-none tracking-tight block truncate w-full">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Flash Sales & Promotions Simulator */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" /> Live Promotions & Deals
              </h5>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Disseminate flash codes for instant cart savings.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Promo Code configuration */}
            <form onSubmit={handleCreatePromo} className="space-y-1.5">
              <label htmlFor="pmCode" className="font-bold text-slate-650 block">Promo Flash Code</label>
              <div className="flex gap-2">
                <Input 
                  id="pmCode"
                  placeholder="e.g. HALFOFFCOMRADE" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="h-10 text-xs rounded-xl flex-1 bg-white" 
                />
                <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-10 px-4 rounded-xl font-bold">
                  Launch code
                </Button>
              </div>
            </form>

            {promoActive && (
              <div className="flex justify-between items-center p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl leading-none">
                <span className="font-black text-[10.5px] text-indigo-700">ACTIVE: #{promoCode.toUpperCase()}</span>
                <button 
                  type="button" 
                  onClick={() => { setPromoActive(false); toast.info('Promo code campaign deactivated.'); }}
                  className="text-[10px] text-red-600 font-extrabold hover:underline"
                >
                  Terminate Campaign
                </button>
              </div>
            )}

            {/* Simulated Flash Sale deal */}
            <div className="p-3 bg-stone-50 border rounded-xl flex justify-between items-center">
              <div>
                <span className="font-bold text-xs block text-slate-800">⚡ Store-wide Midnight Flash Sale</span>
                <p className="text-[10px] text-slate-400 font-medium">Auto-applies 15% discount limit across all listed stock items.</p>
              </div>
              <Button 
                size="xs"
                variant={flashSaleActive ? 'secondary' : 'default'}
                onClick={() => {
                  setFlashSaleActive(!flashSaleActive);
                  toast.success(flashSaleActive ? 'Flash sale deactivated!' : 'Flash deals started! Red neon banner activated.');
                }}
                className={`text-[10px] font-black h-8 shrink-0 ${flashSaleActive ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-150' : 'bg-primary text-white hover:bg-primary/95'}`}
              >
                {flashSaleActive ? 'Active' : 'Ignit'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Future Ready Store Subscriptions Plans */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-4 sm:p-5 space-y-4">
          <div>
            <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" /> Premium Subscription Levels
            </h5>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Acquire professional marketing toolsets and bulk ads limits.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { id: 'free', name: 'Starter', price: 'Free', features: ['3 Listing Limit', 'P2P Payments'] },
              { id: 'growth', name: 'Pro Space', price: 'KSh 299/mo', features: ['15 Listings Limit', 'WhatsApp Auto-alerts'] },
              { id: 'elite', name: 'Mega Store', price: 'KSh 799/mo', features: ['Unlimited Stock', 'Premium Banner Boost'] }
            ].map((p) => (
              <div 
                key={p.id}
                onClick={() => handleCheckoutSubscription(p.id as any)}
                className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === p.id 
                    ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/10' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-black text-[11px] block text-slate-905">{p.name}</span>
                  <span className="font-black text-indigo-705 block text-[10px] text-indigo-600">{p.price}</span>
                </div>
                
                <div className="pt-2 italic text-[8.5px] text-slate-400 font-bold border-t border-dashed mt-2">
                  {p.features[0]}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[9.5px] leading-tight font-semibold text-emerald-800">
              Payments are fully protected via the integrated escrow safety protocols. Funds are only triggered upon verified delivery.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
