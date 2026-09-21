import * as React from 'react';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'stk' | 'success'>('form');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [hostel, setHostel] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }
    
    setIsProcessing(true);
    setPaymentStep('stk');
    
    // Simulate STK Push
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      toast.success('M-Pesa payment authorized successfully!');
      
      // Save order details to local storage for real state interaction
      const newOrder = {
        id: `KIB-${Math.floor(1000 + Math.random() * 9000)}`,
        items: [...items],
        total,
        fullName: fullName || 'Daniel Kamau',
        hostel: hostel || 'Grace Hostel, Room 4B',
        phone: phone,
        status: 'held_in_escrow',
        otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      
      try {
        const localOrders = JSON.parse(localStorage.getItem('kb-orders') || '[]');
        localOrders.unshift(newOrder); // Add to beginning
        localStorage.setItem('kb-orders', JSON.stringify(localOrders));
        
        // Push a nice notification
        const notifications = JSON.parse(localStorage.getItem('kb-notifications') || '[]');
        notifications.unshift({
          id: `n-${Date.now()}`,
          title: `🛍️ Order ${newOrder.id} Created`,
          message: `Your Escrow order of ${items.map(i => i.title).join(', ')} total ${formatPrice(total)} is held safely. Delivery code: ${newOrder.otpCode}`,
          type: 'order',
          timestamp: 'Just now',
          isRead: false,
          link: '/orders'
        });
        localStorage.setItem('kb-notifications', JSON.stringify(notifications));
      } catch (err) {
        console.error('Error writing order storage:', err);
      }

      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 3000);
    }, 5000);
  };

  if (items.length === 0 && paymentStep !== 'success') {
    return <div className="text-center py-20">Your cart is empty. Please add items before checking out.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-black">Checkout</h1>

      {paymentStep === 'success' ? (
        <div className="text-center py-20 space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-green-100 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
          <p className="text-muted-foreground">Redirecting to your orders...</p>
        </div>
      ) : paymentStep === 'stk' ? (
        <Card className="rounded-3xl border shadow-xl py-12">
          <CardContent className="flex flex-col items-center text-center space-y-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Check your phone</h2>
              <p className="text-muted-foreground">
                We've sent an M-Pesa STK push prompt to <b>{phone}</b>.<br />
                Enter your PIN to complete the payment of <b>{formatPrice(total)}</b>.
              </p>
            </div>
            <Button variant="ghost" onClick={() => setPaymentStep('form')}>Cancel & Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
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
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup defaultValue="mpesa">
                  <div className="flex items-center space-x-3 p-4 border rounded-xl bg-muted/20">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label htmlFor="mpesa" className="flex items-center gap-3 cursor-pointer">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-8" alt="M-Pesa" />
                      <span className="font-bold">M-Pesa Express (STK Push)</span>
                    </Label>
                  </div>
                </RadioGroup>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="mpesa-phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="07XX XXX XXX" 
                      className="pl-10 h-12"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enter the number you will use to pay</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border bg-white sticky top-32">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex gap-2 items-center">
                         <span className="font-bold">{item.quantity}x</span>
                         <span className="truncate max-w-[150px]">{item.title}</span>
                      </div>
                      <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-3xl font-black text-primary font-mono">{formatPrice(total)}</span>
                </div>
                
                <Button 
                  onClick={handlePayment} 
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary text-white font-bold text-lg mt-4 shadow-lg shadow-primary/20"
                >
                  {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Pay {formatPrice(total)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
