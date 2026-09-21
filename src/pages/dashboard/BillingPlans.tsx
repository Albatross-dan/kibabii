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

  // STK Checkout fields
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [payLoading, setPayLoading] = useState(false);
  const [payStep, setPayStep] = useState<'form' | 'push' | 'success'>('form');

  const handleSelectUpgrade = (planId: string) => {
    const targetPlan = SUB_PLANS.find(p => p.id === planId);
    if (targetPlan) {
      setSelectedPlan(targetPlan);
      setPayStep('form');
      setIsPayOpen(true);
    }
  };

  const triggerSTKSimulation = () => {
    if (!phoneNumber.match(/^(07|01|254)\d{8}$/)) {
      return toast.error('Please enter a valid Safaricom phone code (e.g. 0712345678)');
    }

    setPayLoading(true);
    setPayStep('push');

    // Simulate STK Push delay
    setTimeout(() => {
      setPayLoading(false);
      if (selectedPlan) {
        localStorage.setItem(`sub_plan_${sellerId}`, selectedPlan.id);
        setActivePlanId(selectedPlan.id);
        setPayStep('success');
        toast.success(`🎉 Subscription updated to ${selectedPlan.display_name}!`);
      }
    }, 3200);
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

      {/* Active simulation Safaricom checkout dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
            <DialogHeader className="text-left border-b pb-4">
               <DialogTitle className="text-lg font-black text-slate-905 flex items-center gap-1.5">
                  <Smartphone className="h-5.5 w-5.5 text-emerald-600" /> M-PESA payment Gateway
               </DialogTitle>
               <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Secure Safaricom billing Checkout
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

                 <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-450 uppercase tracking-widest">Safaricom phone number</Label>
                    <div className="relative">
                       <Input
                         value={phoneNumber}
                         onChange={(e) => setPhoneNumber(e.target.value)}
                         placeholder="e.g. 0712345678"
                         className="h-12 pl-12 rounded-xl text-sm font-semibold"
                       />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-emerald-600">KE</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold leading-relaxed block">
                       We will trigger a simulated STK Push PIN prompt to this Safaricom line.
                    </span>
                 </div>

                 <Button 
                   onClick={triggerSTKSimulation}
                   className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold h-12 rounded-xl mt-4 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                 >
                    ✓ Simulate M-PESA STK Push
                 </Button>
              </div>
            )}

            {payStep === 'push' && selectedPlan && (
              <div className="py-12 text-center space-y-4">
                 <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
                 <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 text-base">STK Push triggered...</h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                       Check Safaricom line <span className="font-bold text-slate-900">{phoneNumber}</span> for PIN prompt simulation. Do not close this window!
                    </p>
                 </div>
              </div>
            )}

            {payStep === 'success' && selectedPlan && (
              <div className="py-8 text-center space-y-5">
                 <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="h-8 w-8" strokeWidth={3} />
                 </div>
                 <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 text-lg">Transaction successful!</h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                       Store upgraded to <span className="font-extrabold text-slate-900">{selectedPlan.display_name}</span>. Limits synchronized.
                    </p>
                 </div>
                 <Button 
                   onClick={() => setIsPayOpen(false)}
                   className="bg-primary hover:bg-primary/95 text-white font-extrabold h-11 w-full rounded-xl"
                 >
                    Go Back to inventory
                 </Button>
              </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
