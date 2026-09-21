import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag,
  Coins,
  Ticket,
  HelpCircle,
  FileText
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order, OrderItem } from './Orders';
import { toast } from 'sonner';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const local = localStorage.getItem('kb-orders');
      if (local) {
        const parsed: Order[] = JSON.parse(local);
        const found = parsed.find(o => o.id === id);
        if (found) {
          setOrder(found);
        }
      }
    } catch (error) {
      console.error('Error fetching order detail from local storage:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleManualEscrowConfirm = () => {
    if (!order) return;
    try {
      const local = localStorage.getItem('kb-orders');
      if (local) {
        const parsed: Order[] = JSON.parse(local);
        const updated = parsed.map(o => {
          if (o.id === order.id) {
            return { ...o, status: 'completed' as const };
          }
          return o;
        });
        localStorage.setItem('kb-orders', JSON.stringify(updated));
        setOrder({ ...order, status: 'completed' as const });
        toast.success(`🎉 Delivery confirmed! Funds released.`);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-secondary font-bold text-sm animate-pulse">Loading invoice receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h1 className="text-3xl font-black">Order Not Found</h1>
        <p className="text-muted-foreground text-sm">We couldn't retrieve the specified invoice order matching receipt ID: <b>{id}</b>.</p>
        <Button asChild className="rounded-full bg-primary text-white font-bold text-xs h-10">
          <Link to="/orders">Return to Transactions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-left pb-16">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/orders">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">Tax Invoice Receipt</h1>
          <p className="text-xs text-muted-foreground font-semibold">Order ID: #{order.id} &bull; Safe M-Pesa Escrow Ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left main pane */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 p-5 sm:p-6 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-base font-black">Receipt Details</CardTitle>
                <span className="text-[10px] text-muted-foreground font-bold font-mono">AUTHORIZED COMRADE MERCHANT HUB</span>
              </div>
              <Badge className={
                order.status === 'completed' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : order.status === 'cancelled' 
                    ? 'bg-red-105 text-red-700 bg-red-50' 
                    : 'bg-amber-100 text-amber-800 animate-pulse'
              }>
                {order.status === 'completed' ? 'RELEASED & CLOSED' : order.status === 'cancelled' ? 'REFUNDED' : '🔒 ACTIVE ESCROW'}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              {/* Order items */}
              <div className="space-y-4">
                <span className="text-[9.5px] uppercase font-black tracking-widest text-slate-400 block">Listed Items Bundle</span>
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl border bg-slate-50 overflow-hidden flex items-center justify-center p-2.5 shrink-0">
                      <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-450 font-bold">Qty: {item.quantity} &bull; {formatPrice(item.price)} each</p>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-900 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total calculations */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>Cart Subtotal</span>
                  <span className="font-mono">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>Student Coupon Code Delivery Discount</span>
                  <span className="font-semibold text-green-600">FREE COMRADE DISPENSE</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>M-Pesa Escrow Handling Protection Fee</span>
                  <span className="font-semibold text-indigo-600 block bg-indigo-50 px-2 py-0.5 rounded-[6px]">KSH 0.00 GUARANTEED</span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-black text-slate-900 text-sm">Grand Total Checkout Paid</span>
                  <span className="font-mono text-xl font-black text-secondary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & handover info */}
          <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm p-5 sm:p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-905 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-primary" /> Delivery & Coordination Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Comrade Consignee</span>
                <p className="text-slate-850 font-extrabold text-sm text-slate-800">{order.fullName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Meetup Campus Hostel Area</span>
                <p className="text-slate-850 font-extrabold text-sm text-slate-850">{order.hostel}</p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-1 border-t">
                <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">M-Pesa Verification Mobile</span>
                <p className="text-slate-850 font-bold flex items-center gap-2 text-slate-800">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {order.phone}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right timeline pane */}
        <div className="space-y-6">
          <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm p-4 sm:p-5 space-y-4">
            <span className="text-[9.5px] uppercase font-black tracking-widest text-slate-400 block">Ledger Verification Status</span>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-300"></div>
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Payment Escrow Locked</h4>
                  <p className="text-slate-450 font-medium">STK Push triggered. KSh {order.total} held securely under M-Pesa account reserve.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {order.status === 'completed' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="w-0.5 h-10 bg-slate-200"></div>
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Handover Spot Coordinating</h4>
                  <p className="text-slate-450 font-medium">Both student seller and buyer coordinating at spot: {order.hostel}.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 border bg-white border-slate-200">
                  {order.status === 'completed' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> : <ShieldCheck className="h-4 w-4 text-slate-400" />}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Funds Released Release</h4>
                  <p className="text-slate-450 font-medium">Released to Seller bank once verified.</p>
                </div>
              </div>
            </div>
            
            {order.status === 'held_in_escrow' && (
              <div className="pt-2 border-t space-y-3">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-indigo-700 font-extrabold uppercase block">Swap Verification PIN</span>
                  <span className="font-mono text-2xl font-black text-indigo-850 select-all block tracking-widest">{order.otpCode}</span>
                </div>
                
                <Button 
                  onClick={handleManualEscrowConfirm}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white rounded-xl h-10 shadow-md shadow-emerald-600/10"
                >
                  Confirm Safe Handover
                </Button>
              </div>
            )}
          </Card>

          {/* Customer support dispatch */}
          <Card className="border border-slate-100 rounded-3xl bg-slate-50/15 p-4 text-center space-y-3">
            <HelpCircle className="h-8 w-8 text-indigo-650 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-xs">Need Escrow Assistance?</h4>
              <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                If the seller doesn't meet up, or sells incorrect goods, campus reps can arbitrate instantly. Contact our Help desk.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full h-9 rounded-xl font-bold text-xs bg-white text-slate-705">
              <Link to="/profile">Chat Arbitrator</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
