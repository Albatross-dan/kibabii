import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore, WishlistListingRow } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  ShoppingCart, 
  ArrowLeft, 
  Heart, 
  Home as HomeIcon, 
  Package, 
  ExternalLink,
  MapPin,
  Calendar,
  LogIn
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface EnrichedWishlistItem extends WishlistListingRow {
  image_url: string;
  price: number | null;
  original_price: number | null;
  price_suffix?: string;
  badge_label: string;
  product_id?: string;
  accommodation_type?: string;
  distance_km?: number | null;
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, wishlistRows, isLoading: storeLoading, toggleFavorite, fetchWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [enrichedItems, setEnrichedItems] = useState<EnrichedWishlistItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'product' | 'accommodation'>('all');

  // Load user wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Enrich wishlist rows with product and accommodation media / pricing
  useEffect(() => {
    const enrichRows = async () => {
      // Collect IDs from both wishlistRows and cached items
      const listingIds = Array.from(new Set([
        ...wishlistRows.map(r => r.listing_id),
        ...items
      ])).filter(Boolean);

      if (listingIds.length === 0) {
        setEnrichedItems([]);
        return;
      }

      setLoadingDetails(true);
      try {
        const { data: listingsData, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            location,
            status,
            listing_type,
            created_at,
            products (
              id, price, original_price, condition_id,
              product_images (image_url, is_primary, display_order)
            ),
            accommodations (
              id, accommodation_type, price_per_month, distance_from_campus_km,
              accommodation_images (image_url, is_primary, display_order)
            )
          `)
          .in('id', listingIds);

        if (error) {
          console.warn('Could not fetch details for wishlist listings:', error);
          // Fallback to bare rows if listings query fails
          const fallback = wishlistRows.map(r => ({
            ...r,
            image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80',
            price: null,
            original_price: null,
            badge_label: r.listing_type.toUpperCase(),
          }));
          setEnrichedItems(fallback);
          return;
        }

        const mapById = new Map((listingsData || []).map(l => [l.id, l]));

        const enriched: EnrichedWishlistItem[] = listingIds
          .map(id => {
            const rawRow = wishlistRows.find(r => r.listing_id === id);
            const listing = mapById.get(id);

            if (!listing && !rawRow) return null;

            const isAcc = (listing?.listing_type || rawRow?.listing_type) === 'accommodation';
            const prod = listing?.products ? (Array.isArray(listing.products) ? listing.products[0] : listing.products) : null;
            const acc = listing?.accommodations ? (Array.isArray(listing.accommodations) ? listing.accommodations[0] : listing.accommodations) : null;

            let imageUrl = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80';
            let price: number | null = null;
            let originalPrice: number | null = null;
            let priceSuffix = '';
            let badgeLabel = 'ITEM';

            if (isAcc) {
              badgeLabel = acc?.accommodation_type ? acc.accommodation_type.toUpperCase() : 'HOSTEL / HOUSING';
              price = acc?.price_per_month ? Number(acc.price_per_month) : null;
              priceSuffix = '/mo';
              const accImages = acc?.accommodation_images || [];
              const sorted = [...accImages].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
              const primary = sorted.find((img: any) => img.is_primary)?.image_url || sorted[0]?.image_url;
              if (primary) imageUrl = primary;
              else imageUrl = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80';
            } else {
              badgeLabel = 'PRODUCT';
              price = prod?.price ? Number(prod.price) : null;
              originalPrice = prod?.original_price ? Number(prod.original_price) : null;
              const prodImages = prod?.product_images || [];
              const sorted = [...prodImages].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
              const primary = sorted.find((img: any) => img.is_primary)?.image_url || sorted[0]?.image_url;
              if (primary) imageUrl = primary;
            }

            return {
              listing_id: id,
              listing_type: listing?.listing_type || rawRow?.listing_type || 'product',
              title: listing?.title || rawRow?.title || 'Saved Item',
              description: listing?.description || rawRow?.description || null,
              location: listing?.location || rawRow?.location || 'Kibabii Campus',
              status: listing?.status || rawRow?.status || 'active',
              views_count: rawRow?.views_count || 0,
              favorites_count: rawRow?.favorites_count || 0,
              published_at: rawRow?.published_at || listing?.created_at || '',
              wishlisted_at: rawRow?.wishlisted_at || '',
              image_url: imageUrl,
              price,
              original_price: originalPrice,
              price_suffix: priceSuffix,
              badge_label: badgeLabel,
              product_id: prod?.id,
              accommodation_type: acc?.accommodation_type,
              distance_km: acc?.distance_from_campus_km
            };
          })
          .filter(Boolean) as EnrichedWishlistItem[];

        setEnrichedItems(enriched);
      } catch (err) {
        console.error('Error enriching wishlist items:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    enrichRows();
  }, [wishlistRows, items]);

  const handleAddToCart = async (item: EnrichedWishlistItem) => {
    const targetId = item.product_id || item.listing_id;
    if (!targetId || addingId) return;

    setAddingId(item.listing_id);
    try {
      await addItem(targetId, 1);
      toast.success(`"${item.title}" added to your Cart!`);
    } catch (err: any) {
      console.error('Failed to add item from wishlist to cart:', err);
      if (err?.message && !err.message.includes('Authentication required')) {
        toast.error(err.message || 'Failed to add item to cart');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveFromWishlist = async (listingId: string, title: string) => {
    // Optimistically filter from local view
    setEnrichedItems(prev => prev.filter(i => i.listing_id !== listingId));
    await toggleFavorite(listingId);
  };

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return enrichedItems;
    return enrichedItems.filter(i => i.listing_type === filterType);
  }, [enrichedItems, filterType]);

  const productCount = enrichedItems.filter(i => i.listing_type === 'product').length;
  const accommodationCount = enrichedItems.filter(i => i.listing_type === 'accommodation').length;

  if (storeLoading && enrichedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-secondary font-bold text-sm animate-pulse">Loading your saved items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-left px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link to="/products" aria-label="Back to products">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Saved Wishlist</h1>
              <Badge variant="secondary" className="bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                {enrichedItems.length}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real-time saved student textbooks, electronics, and rental accommodations.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        {enrichedItems.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({enrichedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('product')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'product'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Products ({productCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('accommodation')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === 'accommodation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hostels ({accommodationCount})
            </button>
          </div>
        )}
      </div>

      {/* Unauthenticated Prompt Banner */}
      {!user && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Sign in to sync your wishlist</p>
              <p className="text-xs text-amber-800">
                Log in with your Kibabii University student account to keep your saved items synchronized across all your devices.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shrink-0">
            <Link to="/auth/login">Sign In</Link>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {enrichedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-dashed border-slate-200 max-w-2xl mx-auto p-6">
          <div className="p-6 bg-rose-50 rounded-full text-rose-500">
            <Heart className="h-12 w-12 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tap the heart icon on any campus textbook, electronic item, or bedsitter listing to save it here for fast access!
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-2xl">
              <Link to="/products">Browse Products</Link>
            </Button>
            <Button asChild variant="outline" className="font-bold h-11 px-6 rounded-2xl border-slate-200">
              <Link to="/accommodations">Find Hostels & Bedsitters</Link>
            </Button>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isAcc = item.listing_type === 'accommodation';
            const detailUrl = `/listing/${item.listing_id}`;

            return (
              <Card 
                key={item.listing_id} 
                className="overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all rounded-3xl bg-white flex flex-col justify-between group"
              >
                {/* Media Header */}
                <div className="relative aspect-4/3 bg-slate-50 w-full overflow-hidden flex items-center justify-center">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => navigate(detailUrl)}
                    referrerPolicy="no-referrer"
                  />

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge 
                      variant="secondary" 
                      className={`font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-lg text-white shadow-xs ${
                        isAcc ? 'bg-indigo-600' : 'bg-slate-900'
                      }`}
                    >
                      {isAcc ? <HomeIcon className="h-3 w-3 mr-1 inline" /> : <Package className="h-3 w-3 mr-1 inline" />}
                      {item.badge_label}
                    </Badge>
                  </div>

                  {/* Remove Button */}
                  <button 
                    type="button"
                    onClick={() => handleRemoveFromWishlist(item.listing_id, item.title)}
                    aria-label={`Remove ${item.title} from favorites`}
                    className="absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-100 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{item.location || 'Kibabii Main Campus'}</span>
                      {item.distance_km && (
                        <span className="text-slate-400">· {item.distance_km}km</span>
                      )}
                    </div>

                    <h3 
                      onClick={() => navigate(detailUrl)}
                      className="font-extrabold text-base text-slate-900 line-clamp-1 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description || 'No additional description provided.'}
                    </p>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {isAcc ? 'Monthly Rent' : 'Price'}
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-rose-600 font-mono">
                          {item.price !== null ? `${formatPrice(item.price)}${item.price_suffix || ''}` : 'Contact'}
                        </span>
                        {item.original_price && item.original_price > (item.price || 0) && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {formatPrice(item.original_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold text-xs h-9 px-3 border-slate-200 hover:bg-slate-50"
                      >
                        <Link to={detailUrl}>
                          View
                        </Link>
                      </Button>

                      {!isAcc && (
                        <Button 
                          onClick={() => handleAddToCart(item)}
                          disabled={addingId === item.listing_id}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> 
                          {addingId === item.listing_id ? 'Adding...' : 'Cart'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
