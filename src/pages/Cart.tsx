import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { triggerListingWhatsApp } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/common/WhatsAppCardButton';

export default function Cart() {
  const { items, removeItem, updateQuantity, fetchCart, loading, total } = useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);

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

  const handleChatOnWhatsApp = async (item: any) => {
    if (contactingId) return;
    setContactingId(item.id);

    try {
      const targetId = item.productId || item.product_id;
      const sellerId = item.sellerId || item.product?.seller_id;
      const qty = item.quantity || 1;
      const titleWithQty = qty > 1 ? `${item.title} (Qty: ${qty})` : item.title;
      const totalPrice = item.price * qty;

      const opened = await triggerListingWhatsApp({
        listingId: targetId,
        productId: targetId,
        sellerId,
        title: titleWithQty,
        imageUrl: item.image,
        price: totalPrice
      });

      if (!opened) {
        toast.info("Seller hasn't set up WhatsApp contact for this listing yet. You can view the listing to contact them.");
      }
    } catch (err) {
      console.warn('Cart item WhatsApp contact error:', err);
      toast.error('Unable to open WhatsApp at this moment.');
    } finally {
      setContactingId(null);
    }
  };

  const handleContactMain = async () => {
    if (items.length === 0) return;
    if (items.length === 1) {
      await handleChatOnWhatsApp(items[0]);
    } else {
      toast.info('Opening chat for your first cart item. You can chat sellers individually for each item below.');
      await handleChatOnWhatsApp(items[0]);
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

                  {/* Direct Contact Buttons */}
                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleChatOnWhatsApp(item)}
                      disabled={contactingId === item.id}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs h-9 px-3.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                    >
                      {contactingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      )}
                      Chat Seller on WhatsApp
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs font-semibold h-9 rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      <Link to={`/products/${item.productId || item.product_id}`}>
                        View Listing
                        <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm sticky top-32">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold">Cart Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Saved Items</span>
                  <span className="font-bold text-slate-900">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Campus Delivery</span>
                  <span className="font-semibold text-emerald-600">DIRECT MEETUP</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary font-mono">{formatPrice(total)}</p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Contact Button - No Checkout */}
              <div className="space-y-3">
                <Button 
                  onClick={handleContactMain}
                  disabled={!!contactingId || items.length === 0}
                  className="w-full h-13 text-base font-bold bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {contactingId ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <WhatsAppIcon className="w-5 h-5" />
                  )}
                  {items.length === 1 ? 'Chat Seller on WhatsApp' : 'Contact on WhatsApp'}
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="w-full h-11 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  <Link to="/products">
                    Continue Browsing Products
                  </Link>
                </Button>
              </div>

              {/* Safe Campus Meetup Advisory - No M-Pesa / No Checkout needed */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-2 text-left">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No Checkout or Prepayment Needed</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Kibumall is a direct campus marketplace. Connect with sellers on WhatsApp or in-app chat to coordinate meetup, inspect your items in person, and pay directly upon handover.
                </p>
                <div className="pt-1 flex flex-col gap-1.5 text-[10.5px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Meet at safe campus spots (Hostels, Student Centre, Library)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Inspect items before paying
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Pay cash or direct upon meetup
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
