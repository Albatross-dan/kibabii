import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Share2, 
  Store,
  CheckCircle2,
  MessageSquare,
  PackageOpen,
  Star,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/services/productService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messagingService';
import { ConversationContextDetails } from '@/types/messaging';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import { reviewService } from '@/services/reviewService';

export default function StoreDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeRecord, setStoreRecord] = useState<any | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'products' | 'reviews'>('products');
  const [sellerReputation, setSellerReputation] = useState<{ seller_rating: number; seller_rating_count: number }>({
    seller_rating: 0,
    seller_rating_count: 0
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadStoreData = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        // 1. Resolve store by UUID or slug
        let storeRow: any = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);

        if (isUuid) {
          const { data: sById } = await supabase
            .from('stores')
            .select('*, owner:public_profiles(*)')
            .eq('id', storeId)
            .maybeSingle();
          storeRow = sById;
        }

        if (!storeRow) {
          const { data: sBySlug } = await supabase
            .from('stores')
            .select('*, owner:public_profiles(*)')
            .eq('slug', storeId)
            .maybeSingle();
          storeRow = sBySlug;
        }

        if (storeRow) {
          setStoreRecord(storeRow);

          // 2. Fetch active products attributed directly to this store (Section 2 contract)
          const { data: storeProdsData, error: prodErr } = await supabase
            .from('products')
            .select('*, product_images(image_url, is_primary), stores(id, name, slug, banner_url, verification_status)')
            .eq('store_id', storeRow.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (!prodErr && storeProdsData) {
            const mapped = storeProdsData.map((row: any) => ({
              ...row,
              images: row.product_images?.map((img: any) => img.image_url) || []
            })) as Product[];
            setStoreProducts(mapped);
          } else {
            setStoreProducts([]);
          }

          // 3. Resolve seller WhatsApp number if configured
          if (storeRow.owner_id) {
            reviewService.getSellerReputation(storeRow.owner_id)
              .then(setSellerReputation)
              .catch(() => {});

            try {
              const { data: waNumber } = await supabase.rpc('get_seller_whatsapp_number', {
                _seller_id: storeRow.owner_id
              });
              setStoreWhatsApp(waNumber || null);
            } catch {
              setStoreWhatsApp(null);
            }
          }
        } else {
          setStoreRecord(null);
          setStoreProducts([]);
        }
      } catch (err) {
        console.error('Error loading store data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Store link copied to clipboard!');
  };

  const handleWhatsApp = () => {
    if (!storeWhatsApp) {
      if (!user) {
        toast.info('Please sign in to view seller WhatsApp contact.');
        navigate('/auth/login');
      } else {
        toast.error('Seller has not provided a WhatsApp contact number.');
      }
      return;
    }
    const cleanNum = storeWhatsApp.replace('+', '').replace(/\D/g, '');
    const storeName = storeRecord?.name || storeRecord?.store_name || 'store';
    const message = encodeURIComponent(`Hi, I'm interested in your store "${storeName}" on KibabiiMart.`);
    window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
  };

  const handleChatStore = async () => {
    if (!user) {
      toast.error('Please sign in to message this store.');
      navigate('/auth/login');
      return;
    }
    if (!storeRecord?.owner_id) {
      toast.error('Store chat is not configured yet.');
      return;
    }
    if (user.id === storeRecord.owner_id) {
      toast.error('This is your own store.');
      return;
    }

    const storeName = storeRecord.name || storeRecord.store_name || 'Official Campus Store';
    const contextDetails: ConversationContextDetails = {
      type: 'store',
      id: storeRecord.id,
      title: storeName,
      imageUrl: storeRecord.logo_url || storeRecord.banner_url || undefined,
      ownerId: storeRecord.owner_id
    };

    messagingService.setContextCache(contextDetails.id, contextDetails);

    const otherParticipantInfo = {
      id: storeRecord.owner_id,
      full_name: storeName,
      username: storeRecord.slug || 'store',
      avatar_url: storeRecord.logo_url || null,
      role: 'seller',
      is_verified: storeRecord.verification_status === 'verified'
    };

    try {
      const convId = await messagingService.startOrGetConversation(
        'store',
        storeRecord.id,
        storeRecord.owner_id,
        user.id
      );

      navigate(`/messages/${convId}`, {
        state: {
          contextDetails,
          otherParticipant: otherParticipantInfo
        }
      });
    } catch (err: any) {
      console.warn('Error starting store chat, falling back to local thread:', err);
      const fallbackId = await messagingService.startOrGetLocalConversation(
        'store',
        storeRecord.id,
        storeRecord.owner_id,
        user.id
      );
      navigate(`/messages/${fallbackId}`, {
        state: {
          contextDetails,
          otherParticipant: otherParticipantInfo
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-semibold mt-4 animate-pulse">Loading store catalog...</p>
      </div>
    );
  }

  if (!storeRecord) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center font-sans">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
          <Store size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Store Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested store profile does not exist or has been deactivated.</p>
        <Button onClick={() => navigate('/products')} className="mt-6 rounded-xl font-bold bg-primary text-white cursor-pointer">
          Browse Marketplace
        </Button>
      </div>
    );
  }

  const storeName = storeRecord.name || storeRecord.store_name || 'Campus Store';
  const isVerified = storeRecord.verification_status === 'verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in font-sans">
      
      {/* BACK NAVIGATION */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold text-sm transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back
      </button>

      {/* STORE HERO BANNER & HEADER */}
      <div className="relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div className="aspect-[21/9] sm:aspect-[24/7] w-full relative overflow-hidden bg-slate-800">
          {storeRecord.banner_url ? (
            <img 
              src={storeRecord.banner_url} 
              alt={storeName} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Info Area Overlay */}
        <div className="p-5 sm:p-7 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Logo */}
          <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white rounded-2xl border-4 border-white/20 shadow-lg flex items-center justify-center text-4xl shrink-0 overflow-hidden select-none bg-slate-50">
            {storeRecord.logo_url ? (
              <img 
                src={storeRecord.logo_url} 
                alt={storeName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-600 bg-indigo-50">
                <Store size={36} />
              </div>
            )}
          </div>

          <div className="flex-grow space-y-1.5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {storeName}
              </h1>
              {isVerified && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border-none shadow-sm inline-flex items-center gap-1">
                  <CheckCircle2 size={12} className="fill-white text-emerald-500" /> Verified Store
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              {storeRecord.category && (
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <Store size={13} className="text-indigo-400" /> {storeRecord.category}
                </span>
              )}
              {storeRecord.location && (
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <MapPin size={13} className="text-rose-400" /> {storeRecord.location}
                </span>
              )}
            </div>

            {/* Ratings & Reputation Trust Signals (Section 3) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {/* Store's own precomputed rating */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs text-white border border-white/15">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="font-bold">
                  {storeRecord.rating_avg && Number(storeRecord.rating_avg) > 0 
                    ? Number(storeRecord.rating_avg).toFixed(1) 
                    : '0.0'}
                </span>
                <span className="text-slate-300">
                  Store Rating ({storeRecord.rating_count || 0})
                </span>
              </div>

              {/* Store Owner combined seller reputation (Section 3) */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 backdrop-blur-xs text-indigo-200 border border-indigo-400/30">
                <ShieldCheck size={13} className="text-indigo-400" />
                <span className="font-bold text-white">
                  {sellerReputation.seller_rating > 0 
                    ? `${sellerReputation.seller_rating.toFixed(1)} ★` 
                    : 'New'}
                </span>
                <span className="text-indigo-200">
                  Owner Trust ({sellerReputation.seller_rating_count} reviews)
                </span>
              </div>
            </div>

            {storeRecord.description && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl pt-0.5 leading-relaxed line-clamp-2">
                {storeRecord.description}
              </p>
            )}
          </div>

          {/* Quick Triggers */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            {storeRecord.owner_id && (
              <Button 
                onClick={handleChatStore}
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white font-bold h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <MessageSquare size={14} /> Message Store
              </Button>
            )}
            {storeWhatsApp && (
              <Button 
                onClick={handleWhatsApp}
                variant="outline"
                className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#20BD5A] text-white border-none font-bold h-10 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
              >
                <Phone size={14} /> WhatsApp
              </Button>
            )}
            <Button 
              onClick={handleShare}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-10 px-3 rounded-xl cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 size={14} /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setCurrentTab('products')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            currentTab === 'products'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Store Catalog ({storeProducts.length})
        </button>
        <button
          onClick={() => setCurrentTab('reviews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span>Store Reviews ({storeRecord.rating_count || 0})</span>
        </button>
      </div>

      {/* PRODUCT GRID SECTION */}
      {currentTab === 'products' ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Products from this Store
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {storeProducts.length} {storeProducts.length === 1 ? 'active product' : 'active products'} available in store inventory
              </p>
            </div>
          </div>

          {/* Empty State Gracefully Handled */}
          {storeProducts.length === 0 ? (
            <div className="py-16 px-6 text-center bg-slate-50/80 rounded-3xl border border-gray-150 flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-1">
                <PackageOpen size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active Products Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {storeName} currently has no active products listed in the catalog. Check back soon or browse other items on the campus marketplace.
              </p>
              <Button 
                onClick={() => navigate('/products')}
                className="mt-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white"
              >
                Browse All Marketplace Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {storeProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2">
          <ReviewsSection
            targetType="store"
            targetId={storeRecord.id}
            targetTitle={storeName}
            targetRatingAvg={storeRecord.rating_avg || 0}
            targetRatingCount={storeRecord.rating_count || 0}
            sellerId={storeRecord.owner_id}
            sellerName={storeName}
            onReviewUpdated={async () => {
              // Refresh store rating
              try {
                const { data: refreshedStore } = await supabase
                  .from('stores')
                  .select('rating_avg, rating_count')
                  .eq('id', storeRecord.id)
                  .maybeSingle();
                if (refreshedStore) {
                  setStoreRecord((prev: any) => ({ ...prev, ...refreshedStore }));
                }
                if (storeRecord.owner_id) {
                  const rep = await reviewService.getSellerReputation(storeRecord.owner_id);
                  setSellerReputation(rep);
                }
              } catch {}
            }}
          />
        </div>
      )}

    </div>
  );
}
