import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Crown, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  CreditCard,
  Building,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionCard } from '@/components/dashboard/CreationComponents';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  limit: number | string;
  price: number;
  price_monthly: number;
  description: string;
}

export const SUB_PLANS: SubscriptionPlan[] = [
  { id: 'free', name: 'Comrade Free', display_name: 'Student Free', limit: 10, price: 0, price_monthly: 0, description: 'Basic selling with standard search indexing.' },
  { id: 'partner', name: 'Premium Partner', display_name: 'Store Pro', limit: 100, price: 499, price_monthly: 499, description: 'Expanded listing caps, analytics dashboard access.' },
  { id: 'elite', name: 'Campus Elite', display_name: 'Vanguard VIP', limit: 9999, price: 999, price_monthly: 999, description: 'Unlimited premium listing, custom home sliders.' }
];

export default function BillingPlans() {
  const { user, profile } = useAuth();
  const sellerId = profile?.id || user?.id || '';
  const isStore = profile?.account_type === 'store' || profile?.role === 'store' || profile?.is_store === true;

  const [activePlanId, setActivePlanId] = useState(() => {
    const saved = localStorage.getItem(`sub_plan_${sellerId}`);
    if (saved) return saved;
    return isStore ? 'partner' : 'free';
  });
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Plan upgrade fields
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [payLoading, setPayLoading] = useState(false);
  const [payStep, setPayStep] = useState<'form' | 'success'>('form');

  const handleSelectUpgrade = (planId: string) => {
    const targetPlan = SUB_PLANS.find(p => p.id === planId);
    if (targetPlan) {
      setSelectedPlan(targetPlan);
      setPayStep('form');
      setIsPayOpen(true);
    }
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      localStorage.setItem(`sub_plan_${sellerId}`, selectedPlan.id);
      setActivePlanId(selectedPlan.id);
      setPayStep('success');
      toast.success(`🎉 Subscription updated to ${selectedPlan.display_name}!`);
    }
  };

  const handleWhatsAppUpgrade = () => {
    if (!selectedPlan) return;
    const msg = `Hello Kibu Mall team, I would like to activate the ${selectedPlan.display_name} tier (KES ${selectedPlan.price_monthly}/month) for my store account (${profile?.full_name || profile?.username || 'Store'}).`;
    const waUrl = `https://wa.me/254794154940?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    handleConfirmUpgrade();
  };

  const handleRenewPlan = () => {
    toast.success('🎉 Active subscription renewed for another 30 Days successfully!');
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full border border-slate-150 bg-white shadow-sm shrink-0 h-10 w-10 hover:bg-slate-50 transition">
            <Link to="/dashboard" title="Back to Dashboard">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               Shop Subscriptions & Billing
            </h1>
            <p className="text-sm font-semibold text-slate-500">
               Manage subscription tiers, featured promotion limits, and store status
            </p>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex gap-1.5 items-center shrink-0">
          <Badge className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold uppercase text-[9px]">
             current plan
          </Badge>
          <span className="font-extrabold text-xs text-indigo-855 uppercase font-mono">
             {SUB_PLANS.find(p => p.id === activePlanId)?.display_name} Active
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUB_PLANS.map((plan) => {
          const CardComp = SubscriptionCard as any;
          return (
            <CardComp
              key={plan.id}
              plan={plan}
              isActive={activePlanId === plan.id}
              onChoose={handleSelectUpgrade}
            />
          );
        })}
      </div>

      {/* Side-by-side comparison metrics table */}
      <Card className="rounded-[28px] border-none shadow-sm bg-white overflow-hidden text-left">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-black text-slate-905">Detail Benefits Matrix</CardTitle>
          <CardDescription className="text-xs font-semibold text-slate-450">Compare allowances across all vendor accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-xs">
                <thead>
                   <tr className="bg-slate-50 border-y text-left">
                      <th className="px-6 py-3.5 text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Features</th>
                      <th className="px-6 py-3.5 text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Free Store</th>
                      <th className="px-6 py-3.5 text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Bronze Store</th>
                      <th className="px-6 py-3.5 text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Silver Store</th>
                      <th className="px-6 py-3.5 text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Gold Store</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {[
                     { name: 'Max Listings limit', val: ['10 Items', '50 Items', '200 Items', 'Unlimited'] },
                     { name: 'Featured Slots', val: ['0 Slots', '2 Slots', '10 Slots', '30 Slots'] },
                     { name: 'Performance Analytics', val: ['-', 'Standard', 'Advanced', 'Comprehensive'] },
                     { name: 'Flash Discount Access', val: ['-', '-', '✓ Included', '✓ Included'] },
                     { name: 'Homepage Banner slider', val: ['-', '-', '-', '✓ Included'] },
                     { name: 'Moderator VIP priority', val: ['-', '-', '✓ Included', '✓ Included'] }
                   ].map((row, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/10 font-semibold text-slate-700">
                        <td className="px-6 py-4 font-black text-slate-800">{row.name}</td>
                        {row.val.map((v, i) => (
                          <td key={i} className="px-6 py-4 font-bold">{v}</td>
                        ))}
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </CardContent>
      </Card>

      {/* Store Plan Upgrade dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
            <DialogHeader className="text-left border-b pb-4">
               <DialogTitle className="text-lg font-black text-slate-905 flex items-center gap-1.5">
                  <Sparkles className="h-5.5 w-5.5 text-primary" /> Store Tier Upgrade
               </DialogTitle>
               <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Connect via WhatsApp or Activate Instantly
               </DialogDescription>
            </DialogHeader>

            {payStep === 'form' && selectedPlan && (
              <div className="py-4 space-y-4 text-left">
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <div>
                       <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Upgrading To</span>
                       <p className="font-extrabold text-base text-slate-905">{selectedPlan.display_name}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Price Monthly</span>
                       <p className="font-mono font-black text-secondary text-lg">KES {selectedPlan.price_monthly.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                       <span className="text-base">💬</span>
                       <span>Direct WhatsApp Activation</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                       Upgrades are coordinated directly with the campus marketplace desk via WhatsApp and in-app chat.
                    </p>
                 </div>

                 <div className="space-y-2 pt-2">
                   <Button 
                     onClick={handleWhatsAppUpgrade}
                     className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                   >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request on WhatsApp
                   </Button>

                   <Button 
                     onClick={handleConfirmUpgrade}
                     variant="outline"
                     className="w-full font-bold h-11 rounded-xl cursor-pointer"
                   >
                      ✓ Activate Plan Instantly
                   </Button>
                 </div>
              </div>
            )}

            {payStep === 'success' && selectedPlan && (
              <div className="py-8 text-center space-y-5">
                 <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="h-8 w-8" strokeWidth={3} />
                 </div>
                 <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 text-lg">Plan activated successfully!</h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                       Store upgraded to <span className="font-extrabold text-slate-900">{selectedPlan.display_name}</span>. Limits synchronized.
                    </p>
                 </div>
                 <Button 
                   onClick={() => setIsPayOpen(false)}
                   className="bg-primary hover:bg-primary/95 text-white font-extrabold h-11 w-full rounded-xl cursor-pointer"
                 >
                    Go Back to Inventory
                 </Button>
              </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
