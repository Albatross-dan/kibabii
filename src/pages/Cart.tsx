import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function Cart() {
  const { items, removeItem, updateQuantity, fetchCart, loading, total } = useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err: any) {
      console.error('Failed to update quantity:', err);
      toast.error(err?.message || 'Failed to update item quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string, title?: string) => {
    setUpdatingId(itemId);
    try {
      await removeItem(itemId);
      toast.info(`Removed ${title ? `"${title}"` : 'item'} from cart`);
    } catch (err: any) {
      console.error('Failed to remove item:', err);
      toast.error(err?.message || 'Failed to remove item from cart');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-secondary font-bold text-sm">Loading your cart from database...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-dashed">
        <div className="p-6 bg-muted rounded-full">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black">Your Cart is Empty</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet. Let's find some great deals!
          </p>
        </div>
        <Button asChild className="bg-primary text-white font-bold h-12 px-8 rounded-full">
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/products"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-3xl font-black">Shopping Cart</h1>
        <Badge variant="secondary" className="bg-primary text-white">{items.length} Items</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border shadow-sm">
              <CardContent className="p-4 sm:p-6 flex gap-4 sm:gap-6">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden border bg-white flex items-center justify-center p-2 sm:p-3 shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div className="space-y-1">
                      <Link to={`/products/${item.productId || item.product_id}`} className="hover:text-primary transition-colors">
                        <h3 className="font-bold text-base sm:text-lg line-clamp-2">{item.title}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        {item.product?.location ? `Location: ${item.product.location}` : 'Campus Marketplace'}
                      </p>
                      {item.availableQuantity !== undefined && item.availableQuantity > 0 ? (
                        <p className="text-[11px] text-emerald-600 font-medium">
                          In Stock ({item.availableQuantity} available)
                        </p>
                      ) : item.availableQuantity === 0 ? (
                        <p className="text-[11px] text-red-500 font-bold">
                          Out of Stock
                        </p>
                      ) : null}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-red-500 disabled:opacity-50" 
                      disabled={updatingId === item.id}
                      onClick={() => handleRemoveItem(item.id, item.title)}
                    >
                      {updatingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </Button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="flex items-center border rounded-lg h-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-full rounded-none disabled:opacity-50" 
                        disabled={updatingId === item.id || item.quantity <= 1}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-bold">
                        {updatingId === item.id ? '...' : item.quantity}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-full rounded-none disabled:opacity-50" 
                        disabled={updatingId === item.id || (item.availableQuantity !== undefined && item.quantity >= item.availableQuantity)}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-secondary font-mono">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatPrice(item.price)} each</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm sticky top-32">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono text-secondary font-bold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                   <span>Tax</span>
                   <span className="font-mono text-secondary font-bold font-mono">KES 0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary font-mono">{formatPrice(total)}</p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>

              <div className="pt-2 text-center">
                 <p className="text-xs text-muted-foreground">Accepted Payments</p>
                 <div className="flex justify-center gap-2 mt-2 grayscale opacity-50">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-6" alt="M-Pesa" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
