import * as React from 'react';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Phone, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [hostel, setHostel] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your contact phone number');
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Order request placed successfully!');
      
      // Save order details to local storage
      const newOrder = {
        id: `KIB-${Math.floor(1000 + Math.random() * 9000)}`,
        items: [...items],
        total,
        fullName: fullName || 'Daniel Kamau',
        hostel: hostel || 'Grace Hostel, Room 4B',
        phone: phone,
        status: 'pending',
        otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      
      try {
        const localOrders = JSON.parse(localStorage.getItem('kb-orders') || '[]');
        localOrders.unshift(newOrder); // Add to beginning
        localStorage.setItem('kb-orders', JSON.stringify(localOrders));
        
        // Push notification
        const notifications = JSON.parse(localStorage.getItem('kb-notifications') || '[]');
        notifications.unshift({
          id: `n-${Date.now()}`,
          title: `🛍️ Order Request ${newOrder.id} Created`,
          message: `Your order for ${items.map(i => i.title).join(', ')} total ${formatPrice(total)} was created. Coordinate meetup and handover directly with the seller via WhatsApp or Chat.`,
          type: 'order',
          timestamp: 'Just now',
          isRead: false,
          link: '/orders'
        });
        localStorage.setItem('kb-notifications', JSON.stringify(notifications));
      } catch (err) {
        console.error('Error writing order storage:', err);
      }

      clearCart();
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    }, 700);
  };

  if (items.length === 0 && !isSuccess) {
    return <div className="text-center py-20 font-medium text-slate-500">Your cart is empty. Please add items before checking out.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left py-4 sm:py-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Checkout & Meetup Request</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Coordinate handover and direct payment with sellers on campus</p>
      </div>

      {isSuccess ? (
        <div className="text-center py-20 space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-green-100 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Order Request Placed Successfully!</h2>
          <p className="text-muted-foreground font-medium">Redirecting to your orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Delivery & Handover Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostel">Hostel / Location on Campus</Label>
                  <Input 
                    id="hostel" 
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="Grace Hostel, Room 4B" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone (for WhatsApp & Calls)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base font-bold">Payment & Coordination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/50 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-sm text-emerald-950">Campus Meetup & Direct Payment</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Transactions are coordinated directly via WhatsApp and in-app chat. Inspect your items upon campus meetup and pay directly upon handover.
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="contact-phone">Confirm Contact Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="contact-phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="07XX XXX XXX" 
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Sellers will use this line to connect on WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border bg-white sticky top-32">
              <CardHeader>
                <CardTitle className="text-base font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className="font-medium truncate max-w-[180px]">{item.title}</span>
                        <span className="text-muted-foreground text-xs font-bold">x{item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator />
                
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Campus Delivery</span>
                  <span className="text-emerald-600 font-bold text-xs">DIRECT COORDINATION</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-2xl sm:text-3xl font-black text-primary font-mono">{formatPrice(total)}</span>
                </div>
                
                <Button 
                  onClick={handlePayment} 
                  disabled={isProcessing}
                  className="w-full h-13 bg-primary hover:bg-primary/95 text-white font-bold text-base mt-4 shadow-lg shadow-primary/20 cursor-pointer rounded-xl"
                >
                  {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Confirm Order Request ({formatPrice(total)})
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
