import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  fullName: string;
  hostel: string;
  phone: string;
  status: 'held_in_escrow' | 'completed' | 'cancelled';
  otpCode: string;
  timestamp: string;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: 'KIB-4829',
    items: [
      { id: 'p-1', title: 'Premium Wooden Study Desk & Chair', price: 6800, quantity: 1, image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200&q=80' }
    ],
    total: 6800,
    fullName: 'Daniel Kamau',
    hostel: 'Soweto Block B, Room 12',
    phone: '0712345678',
    status: 'held_in_escrow',
    otpCode: '5712',
    timestamp: 'Jun 10, 2026'
  },
  {
    id: 'KIB-3194',
    items: [
      { id: 'p-2', title: 'Calculus & Physics University Guides', price: 1200, quantity: 1, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&q=80' }
    ],
    total: 1200,
    fullName: 'Daniel Kamau',
    hostel: 'Soweto Block B, Room 12',
    phone: '0712345678',
    status: 'completed',
    otpCode: '8412',
    timestamp: 'May 24, 2026'
  }
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTab, setCurrentTab] = useState<'all' | 'escrow' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const local = localStorage.getItem('kb-orders');
    if (local) {
      try {
        setOrders(JSON.parse(local));
      } catch {
        setOrders(INITIAL_ORDERS);
        localStorage.setItem('kb-orders', JSON.stringify(INITIAL_ORDERS));
      }
    } else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('kb-orders', JSON.stringify(INITIAL_ORDERS));
    }
  }, []);

  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('kb-orders', JSON.stringify(updatedOrders));
  };

  const handleConfirmDelivery = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        toast.success(`🎉 Escrow funds released to Seller for Order ${o.id}! Transaction completed.`);
        
        // Add a nice notification
        const notifications = JSON.parse(localStorage.getItem('kb-notifications') || '[]');
        notifications.unshift({
          id: `n-${Date.now()}`,
          title: `💰 Funds Released: ${o.id}`,
          message: `Escrow payment of ${formatPrice(o.total)} has been successfully wired to the seller because you verified delivery.`,
          type: 'system',
          timestamp: 'Just now',
          isRead: false,
          link: `/orders/${o.id}`
        });
        localStorage.setItem('kb-notifications', JSON.stringify(notifications));

        return { ...o, status: 'completed' as const };
      }
      return o;
    });
    saveOrders(updated);
  };

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        toast.info(`🚫 Order ${o.id} Cancelled. M-Pesa refund processed back to phone ${o.phone}.`);
        
        // Add a notification
        const notifications = JSON.parse(localStorage.getItem('kb-notifications') || '[]');
        notifications.unshift({
          id: `n-${Date.now()}`,
          title: `🚫 Order ${o.id} Cancelled`,
          message: `Your Order ${o.id} has been cancelled, and a refund of ${formatPrice(o.total)} was issued.`,
          type: 'alert',
          timestamp: 'Just now',
          isRead: false,
          link: `/orders/${o.id}`
        });
        localStorage.setItem('kb-notifications', JSON.stringify(notifications));

        return { ...o, status: 'cancelled' as const };
      }
      return o;
    });
    saveOrders(updated);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-250 hover:bg-emerald-100/90 font-black">Received & Released</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="font-black bg-red-100 text-red-800 hover:bg-red-100/95 border-red-200">Cancelled & Refunded</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-250 hover:bg-amber-100/90 font-black animate-pulse">🔒 Held in Escrow</Badge>;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (currentTab === 'all') return true;
    if (currentTab === 'escrow') return o.status === 'held_in_escrow';
    if (currentTab === 'completed') return o.status === 'completed';
    return o.status === 'cancelled';
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-left pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/profile">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">Purchase History</h1>
          <p className="text-xs text-muted-foreground font-semibold">Track your campus purchases, view escrow release codes, and confirm safe handovers.</p>
        </div>
      </div>

      {/* Escrow Guarantee Banner */}
      <Card className="border border-indigo-150 bg-indigo-50/15 rounded-3xl overflow-hidden p-4 sm:p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1.5 flex-1 text-xs">
          <h4 className="font-extrabold text-indigo-850 text-sm">Comrade Escrow Protection Activated</h4>
          <p className="text-slate-600 font-semibold leading-relaxed">
            Every transaction is guarded by M-Pesa Escrow. The seller is only wired the funds after they hand over the item and you mark the order as <b>Received</b>. If there is any issue, click cancel to receive an instant refund.
          </p>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex border-b text-xs pb-px gap-6">
        {[
          { id: 'all', name: 'All Orders' },
          { id: 'escrow', name: '🔒 Active Escrow' },
          { id: 'completed', name: '✅ Completed' },
          { id: 'cancelled', name: '🚫 Cancelled' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={`pb-3 font-black transition-all border-b-2 -mb-px px-1 ${
              currentTab === tab.id 
                ? 'border-indigo-650 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-white rounded-3xl border border-dashed">
          <div className="p-6 bg-slate-55 rounded-full text-slate-400 bg-slate-50">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">No Orders Found</h2>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto font-medium">
              You don't have any items matching this filter status under your student account.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 rounded-full text-xs">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border border-slate-100 hover:border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow transition-all bg-white">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-50 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900">{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <Clock className="h-3 w-3" /> Ordered on {order.timestamp}
                    </div>
                  </div>

                  <Button asChild size="sm" variant="outline" className="text-xs h-9 rounded-xl font-bold self-start sm:self-auto">
                    <Link to={`/orders/${order.id}`}>
                      View Full Invoice <ChevronRight className="h-4.5 w-4.5 ml-1 text-slate-400" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-start">
                      <div className="h-16 w-16 bg-slate-50 border rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0">
                        <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold">
                          Quantity: {item.quantity} &bull; Price: {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right font-mono font-black text-slate-900 text-sm shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" /> Dispensing spot: <span className="font-extrabold text-slate-800">{order.hostel}</span>
                  </div>

                  <div className="flex items-baseline gap-2.5 justify-between sm:justify-end">
                    <span className="text-xs text-slate-450 uppercase tracking-widest font-bold font-mono">Invoice Total:</span>
                    <span className="text-xl font-black text-secondary font-mono">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {order.status === 'held_in_escrow' && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mt-2.5">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-850">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-spin" /> Swap OTP Code: <span className="font-mono bg-white border px-2 py-0.5 rounded text-indigo-700 select-all">{order.otpCode}</span>
                      </div>
                      <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                        Share this 4-digit code with the seller <b>only</b> during physical product handover. This guarantees mutual student protection.
                      </p>
                    </div>

                    <div className="flex gap-2 self-stretch md:self-auto">
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmDelivery(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-9 px-4 rounded-xl flex-1 md:flex-initial"
                      >
                        Confirm Delivery Received
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-red-650 border-red-200 hover:bg-red-50 text-xs h-9 px-4 rounded-xl flex-1 md:flex-initial"
                      >
                        Request Refund
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
