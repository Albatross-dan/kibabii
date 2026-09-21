import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Heart, 
  MessageSquare, 
  ShoppingCart, 
  ClipboardList, 
  Star, 
  Trash2, 
  ChevronRight, 
  Send, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { listingService } from '@/services/listingService';
import { toast } from 'sonner';

interface MyMarketplacePanelProps {
  wishlistItems: Array<{ id: string; name: string; price: string; category: string; img: string }>;
  onRemoveWishlist: (id: string) => void;
  productsListed: number;
}

export default function MyMarketplacePanel({ 
  wishlistItems, 
  onRemoveWishlist,
  productsListed 
}: MyMarketplacePanelProps) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'listings' | 'wishlist' | 'messages' | 'purchases' | 'orders' | 'reviews'>('listings');

  // Real user listings & Mark as Sold state
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [productToMarkSold, setProductToMarkSold] = useState<any | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const fetchMyListings = async () => {
    if (!user?.id) return;
    setLoadingListings(true);
    try {
      // Query listings table where owner_id is the authenticated user
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyListings(data);
      } else {
        const fallback = await listingService.getMyListings(null, null);
        setMyListings(fallback || []);
      }
    } catch (err) {
      console.error('Failed to fetch user listings for My Marketplace:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyListings();
    }
  }, [user?.id]);

  const handleConfirmMarkSold = async () => {
    if (!productToMarkSold) return;
    const productId = productToMarkSold.product_id || productToMarkSold.id;
    setIsMarkingSold(true);
    try {
      const { data, error } = await supabase.rpc('mark_product_sold', {
        p_product_id: productId
      });

      if (error) {
        toast.error(error.message || 'Failed to mark product as sold');
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`"${productToMarkSold.title}" marked as sold.`);
      setProductToMarkSold(null);
      await fetchMyListings();
    } catch (err: any) {
      console.error('Error marking product as sold:', err);
      toast.error(err.message || 'Failed to mark product as sold');
    } finally {
      setIsMarkingSold(false);
    }
  };

  // Interactive message state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('msg-1');
  const [chats, setChats] = useState([
    { id: 'msg-1', sender: 'Cynthia Wambui', product: 'Study Desk & Chair', unread: true, messages: [
      { text: 'Is this desk still available near Soweto Hostels?', sender: 'customer', time: '10:15 AM' },
      { text: 'Yes, it is in excellent condition.', sender: 'me', time: '10:20 AM' },
      { text: 'Hey, can we meet at the Kibabii gate A clinic for exchange tomorrow at noon?', sender: 'customer', time: '10:22 AM' }
    ]},
    { id: 'msg-2', sender: 'Felix Juma', product: 'HP EliteBook Laptop', unread: false, messages: [
      { text: 'Is the price negotiable? I have KSh 29,000 cash right now.', sender: 'customer', time: 'Yesterday' }
    ]},
    { id: 'msg-3', sender: 'Bungoma Printers', product: 'Special Printing Papers', unread: false, messages: [
      { text: 'Your ordered bound books are ready for pickup at our Cyber branch!', sender: 'customer', time: '2 days ago' }
    ]}
  ]);
  const [typedMsg, setTypedMsg] = useState('');

  // Interactive Purchases State (including ESCROW and Courier placeholder tracking)
  const [purchases, setPurchases] = useState([
    { id: 'pur-1', name: 'Original Calculus T-Book', price: 'KSh 1,500', seller: 'StudyHub Bookstore', status: 'Delivered', escrowStatus: 'Released', deliveryType: 'Hostel Dropoff' },
    { id: 'pur-2', name: 'Cyberpunk Gaming Mouse', price: 'KSh 2,800', seller: 'TechnoGamer', status: 'In Transit', escrowStatus: 'Held in Escrow', deliveryType: 'Gate A Pickup Point' }
  ]);

  // Interactive Orders State
  const [orders, setOrders] = useState([
    { id: 'ord-104', item: 'Electric Hotplate Cooker', customer: 'Mercy Atieno', amount: 'KSh 3,200', status: 'Awaiting Fulfillment' },
    { id: 'ord-102', item: 'Bedside Night Table', customer: 'Kelvin Kibet', amount: 'KSh 1,800', status: 'Completed' }
  ]);

  // Reviews simulated lists
  const [reviewsList, setReviewsList] = useState([
    { id: 'rev-1', author: 'Dan Kiptoo', rating: 5, date: 'June 10, 2026', comment: 'Very swift transaction. He met me at the library as promised and the hotplate works great!' },
    { id: 'rev-2', author: 'Jane Wanjiku', rating: 4, date: 'May 28, 2026', comment: 'Excellent study guides. A bit highlighted but highly useful.' }
  ]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMsg.trim() || !selectedRoomId) return;

    const updatedChats = chats.map(room => {
      if (room.id === selectedRoomId) {
        const updatedMsgs = [
          ...room.messages,
          { text: typedMsg, sender: 'me', time: 'Just now' }
        ];
        return { ...room, unread: false, messages: updatedMsgs };
      }
      return room;
    });
    setChats(updatedChats);
    const typed = typedMsg;
    setTypedMsg('');

    // Trigger simulated bot responder!
    setTimeout(() => {
      setChats(prevChats => prevChats.map(room => {
        if (room.id === selectedRoomId) {
          return {
            ...room,
            messages: [
              ...room.messages,
              { text: `Thanks comrades! I received: "${typed}". Let me check details and review real soon.`, sender: 'customer', time: 'Just now' }
            ]
          };
        }
        return room;
      }));
      toast.info(`New message from ${chats.find(r => r.id === selectedRoomId)?.sender}`);
    }, 1500);
  };

  const handleEscrowRelease = (id: string) => {
    setPurchases(purchases.map(p => p.id === id ? { ...p, escrowStatus: 'Released', status: 'Delivered' } : p));
    toast.success('🔒 Escrow funds successfully released to the seller!');
  };

  const handleMarkOrderShipped = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'Shipped (In Transit)' } : o));
    toast.success('📦 Order status updated! Student tracking alert dispatched.');
  };

  const handleAddReviewSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const item = {
      id: `rev-${Date.now()}`,
      author: 'You (Comrade)',
      rating: newRating,
      date: 'Today',
      comment: newComment
    };
    setReviewsList([item, ...reviewsList]);
    setNewComment('');
    toast.success('⭐ Simulated review added successfully!');
  };

  const selectedRoom = chats.find(r => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Tab select cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'listings', label: 'My Listings', count: myListings.length || productsListed, icon: <ShoppingBag className="h-4 w-4" /> },
          { id: 'wishlist', label: 'Wishlist', count: wishlistItems.length, icon: <Heart className="h-4 w-4 text-red-500" /> },
          { id: 'messages', label: 'Messages', count: chats.filter(c => c.unread).length || null, icon: <MessageSquare className="h-4 w-4 text-sky-500" /> },
          { id: 'purchases', label: 'My Purchases', count: purchases.length, icon: <ShoppingCart className="h-4 w-4 text-emerald-500" /> },
          { id: 'orders', label: 'My Orders', count: orders.filter(o => o.status !== 'Completed').length || null, icon: <ClipboardList className="h-4 w-4 text-amber-500" /> },
          { id: 'reviews', label: 'Reviews & Ratings', count: reviewsList.length, icon: <Star className="h-4 w-4 text-purple-500" /> }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all relative ${
              activeSubTab === sub.id 
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/15' 
                : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="p-1.5 rounded-xl bg-white border border-slate-100 shadow-sm mb-1">
              {sub.icon}
            </div>
            <span className="text-[11px] font-extrabold leading-none">{sub.label}</span>
            {sub.count !== null && (
              <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-250 text-slate-800 scale-90 border">
                {sub.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Sub Tab Container Panel */}
      <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          
          {/* 1. MY LISTINGS SUB TAB */}
          {activeSubTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm">
                    My Marketplace Listings ({myListings.length || productsListed})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Manage your items, services, and offers posted across KibabiiMarket.
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild className="text-xs h-8 font-bold rounded-lg border-primary text-primary hover:bg-primary/5">
                  <Link to="/dashboard/listings">
                    Manage in Dashboard
                  </Link>
                </Button>
              </div>

              {loadingListings ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold">Loading your listings...</span>
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                  <span className="text-3xl block">📦</span>
                  <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto">
                    You currently have no active listings. Sell unused books, technology gadgets, services, or room share offers.
                  </p>
                  <Button size="sm" asChild className="text-xs font-bold bg-primary text-white rounded-xl h-8">
                    <Link to="/dashboard/listings/new">Post a Listing</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {myListings.map((item) => {
                    const isProduct = item.listing_type === 'product' || !!item.product_id;
                    const isSold = item.status === 'sold';
                    const coverImg = item.images?.[0] || item.image_url;

                    const typeEmoji: Record<string, string> = {
                      product: '📦',
                      accommodation: '🏠',
                      service: '🛠️',
                      event: '🎟️',
                      lost_found: '🔍'
                    };

                    return (
                      <div 
                        key={item.id} 
                        className="flex flex-col justify-between p-3.5 border rounded-2xl bg-white hover:shadow-xs transition-shadow gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 bg-slate-100 border rounded-xl flex items-center justify-center font-bold text-slate-700 shrink-0 overflow-hidden">
                              {coverImg ? (
                                <img src={coverImg} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-lg">{typeEmoji[item.listing_type] || '📦'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase text-indigo-600 block">
                                {item.listing_type || 'Listing'}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                                {item.title}
                              </h5>
                              <p className="text-xs font-semibold text-slate-500 truncate">
                                {item.location || 'Kibabii Campus'}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isSold ? (
                              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                Sold
                              </span>
                            ) : item.status === 'active' ? (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                Active
                              </span>
                            ) : item.status === 'pending_review' ? (
                              <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                Pending Review
                              </span>
                            ) : item.status === 'rejected' ? (
                              <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                                Rejected
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product-specific "Mark as Sold" action button */}
                        {isProduct && !isSold && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">Finished selling?</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setProductToMarkSold(item)}
                              className="text-xs h-7 font-bold border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg px-2.5 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mark as Sold
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. WISHLIST SUB TAB */}
          {activeSubTab === 'wishlist' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-950 text-sm">My Saved Favorites ({wishlistItems.length})</h4>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                  <span className="text-3xl block">❤️</span>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto font-semibold">
                    Your favorites list is empty. Explore products on the homepage and tap heart to save items here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlistItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border bg-slate-50 flex items-center justify-center">
                        {item.img ? (
                          <img src={item.img} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xl">❤️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black uppercase text-primary tracking-wider block">{item.category}</span>
                        <h5 className="font-bold text-secondary text-xs truncate leading-snug">{item.name}</h5>
                        <span className="font-black text-xs text-slate-900 block pt-0.5">{item.price}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onRemoveWishlist(item.id)}
                        className="rounded-full h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MESSAGES SUB TAB */}
          {activeSubTab === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[300px]">
              
              {/* Left sidebar chats list */}
              <div className="md:col-span-5 border-r pr-4 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Comrade Inbox</span>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                  {chats.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedRoomId(item.id)}
                      className={`p-3 rounded-xl cursor-pointer text-left transition-all ${
                        selectedRoomId === item.id 
                          ? 'bg-sky-50 border border-sky-150 text-secondary' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h5 className="text-xs font-black truncate">{item.sender}</h5>
                        {item.unread && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-primary truncate">Ad: {item.product}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-1 leading-normal">
                        {item.messages[item.messages.length - 1]?.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View content */}
              <div className="md:col-span-7 flex flex-col justify-between h-[300px]">
                {selectedRoom ? (
                  <>
                    <div className="border-b pb-2 flex justify-between items-center shrink-0">
                      <div>
                        <h5 className="text-xs font-black text-secondary leading-none">{selectedRoom.sender}</h5>
                        <span className="text-[10px] font-bold text-slate-400">Trading item: {selectedRoom.product}</span>
                      </div>
                      <span className="text-[9px] uppercase font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/50">Simulated Chat</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2.5 my-2 max-h-[180px]">
                      {selectedRoom.messages.map((m, mIdx) => (
                        <div key={mIdx} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs shadow-sm leading-relaxed ${
                            m.sender === 'me' 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-slate-50 border rounded-tl-none text-slate-700'
                          }`}>
                            <p>{m.text}</p>
                            <span className="text-[8px] text-right block mt-1 opacity-70 font-semibold">{m.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t pt-2.5">
                      <Input
                        required
                        placeholder="Say something to checkout coordinates..."
                        className="h-10 text-xs rounded-xl"
                        value={typedMsg}
                        onChange={(e) => setTypedMsg(e.target.value)}
                      />
                      <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-white rounded-xl">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <span className="text-3xl">💬</span>
                    <p className="text-xs text-slate-400 font-semibold">Select an inbox room to verify delivery and address details.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 4. PURCHASES SUB TAB (ESCROW COMPLIANT) */}
          {activeSubTab === 'purchases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="font-extrabold text-slate-950 text-sm">Escrow Wallet Protection Purchases ({purchases.length})</h4>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black bg-blue-50 text-blue-700 border px-2.5 py-1 rounded">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Secure Escrow
                </div>
              </div>

              <div className="space-y-3.5">
                {purchases.map(p => (
                  <div key={p.id} className="p-4 border rounded-2xl bg-white hover:border-slate-200 transition-all space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Seller: {p.seller}</span>
                        <h5 className="text-xs font-black text-slate-900">{p.name}</h5>
                        <p className="text-xs font-bold text-slate-800">{p.price}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-[9px] uppercase font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border block text-center">
                          {p.status}
                        </span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border block text-center ${
                          p.escrowStatus === 'Released' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                        }`}>
                          {p.escrowStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-slate-400" /> Mode: {p.deliveryType}
                      </span>
                      {p.escrowStatus === 'Held in Escrow' ? (
                        <div className="flex gap-2">
                          <Button 
                            size="xs" 
                            variant="destructive" 
                            onClick={() => toast.warning('Dispute filed with safety panel! Escrow holds preserved.')}
                            className="text-[10px] h-7 font-bold rounded-lg"
                          >
                            File Dispute
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => handleEscrowRelease(p.id)}
                            className="text-[10px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                          >
                            Release Funds
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                          ✓ Completed & Closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ORDERS RECEIVED SUB TAB */}
          {activeSubTab === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-950 text-sm">Customer Orders / Bids Received ({orders.length})</h4>
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="p-4 border rounded-2xl bg-white space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">ORDER #{o.id}</span>
                        <h5 className="text-xs font-black text-secondary">{o.item}</h5>
                        <p className="text-xs text-muted-foreground font-semibold">Buyer: {o.customer} • Volume: 1 unit</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">{o.amount}</span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded inline-block mt-1 ${
                          o.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-none' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>

                    {o.status === 'Awaiting Fulfillment' && (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button 
                          size="xs" 
                          variant="outline" 
                          onClick={() => toast.info('WhatsApp buyer link dispatched! Ready coordinate.')}
                          className="h-8 text-[11px] font-bold rounded-lg text-slate-600"
                        >
                          Chat WhatsApp
                        </Button>
                        <Button 
                          size="xs" 
                          onClick={() => handleMarkOrderShipped(o.id)}
                          className="h-8 text-[11px] bg-primary text-white font-black rounded-lg"
                        >
                          Ship Package
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. REVIEWS & RATINGS SUB TAB */}
          {activeSubTab === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form submit simulated review */}
              <form onSubmit={handleAddReviewSim} className="md:col-span-5 border-r pr-5 space-y-3 text-left">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Add Test Review</span>
                
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-705">Rating Stars</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-lg leading-none ${star <= newRating ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="revComment" className="text-xs font-bold text-slate-705">Experience Feedback</label>
                  <Input
                    id="revComment"
                    required
                    placeholder="e.g. He delivered at Lib Block A on time..."
                    className="h-10 text-xs rounded-xl"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full h-9 bg-primary text-white font-bold rounded-xl text-xs shadow-sm">
                  Simulate Posting Review
                </Button>
              </form>

              {/* Reviews Feed items */}
              <div className="md:col-span-7 space-y-3.5 max-h-[280px] overflow-y-auto">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Recent Reviews Received</span>
                {reviewsList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border rounded-2xl relative space-y-1 text-left">
                    <div className="flex justify-between items-baseline">
                      <h5 className="text-xs font-black text-secondary">{item.author}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.date}</span>
                    </div>
                    <div className="text-[10px] text-amber-500 font-black">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                    <p className="text-xs text-slate-500 leading-normal font-medium">{item.comment}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

        </CardContent>
      </Card>

      {/* CONFIRMATION DIALOG: MARK PRODUCT AS SOLD */}
      {productToMarkSold && (
        <Dialog 
          open={!!productToMarkSold} 
          onOpenChange={(open) => !open && !isMarkingSold && setProductToMarkSold(null)}
        >
          <DialogContent className="bg-white rounded-2xl max-w-sm p-6">
            <DialogHeader className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Mark Product as Sold?</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to mark <strong>"{productToMarkSold.title}"</strong> as sold?
                <br /><br />
                This flips the product and its listing to status <em>'sold'</em>. It will automatically disappear from all active browse and campus search queries, while preserving order history and reviews.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 mt-4 flex sm:flex-row">
              <Button
                variant="outline"
                disabled={isMarkingSold}
                onClick={() => setProductToMarkSold(null)}
                className="flex-1 rounded-xl text-xs font-bold h-9 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                disabled={isMarkingSold}
                onClick={handleConfirmMarkSold}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9"
              >
                {isMarkingSold ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Updating...
                  </>
                ) : (
                  'Yes, Mark Sold'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
