import { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RefreshCw,
  Store,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import CategoryListingsPage from '@/components/CategoryListingsPage';
import { useWishlistStore } from '@/store/wishlistStore';
import { listingService, SearchSuggestion } from '@/services/listingService';

// Self-contained countdown timer that only re-renders its own badge
const FlashSaleCountdown = memo(() => {
  const getTimeToMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.max(0, Math.floor(diff / 3600000));
    const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const s = Math.max(0, Math.floor((diff % 60000) / 1000));
    return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
  };

  const [timeStr, setTimeStr] = useState(getTimeToMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(getTimeToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black/25 font-mono text-xs px-2.5 py-1 rounded font-bold tracking-wider">
      TIME LEFT: {timeStr}
    </div>
  );
});

// Define standard format price helper
const formatPrice = (price: any) => 
  `KSh ${Number(price).toLocaleString('en-KE')}`;

const HOMEPAGE_CATEGORIES = [
  { 
    id: 'phones',
    name: 'Phones', 
    icon: '📱', 
    slug: 'phones'
  },
  { 
    id: 'computing',
    name: 'Computing', 
    icon: '💻', 
    slug: 'computing'
  },
  { 
    id: 'fashion',
    name: 'Fashion', 
    icon: '👗', 
    slug: 'fashion'
  },
  { 
    type: 'accommodation',
    name: 'Rooms', 
    icon: '🏠', 
    slug: 'accommodation'
  },
  { 
    id: 'books-notes',
    name: 'Books & Notes', 
    icon: '📚', 
    slug: 'books-notes'
  },
  { 
    type: 'service',
    name: 'Services', 
    icon: '🔧', 
    slug: 'services'
  },
  { 
    type: 'lost_found',
    name: 'Lost & Found', 
    icon: '🔍', 
    slug: 'lost-found'
  },
  { 
    type: 'event',
    name: 'Events', 
    icon: '🎉', 
    slug: 'events'
  }
];

const SkeletonCard = () => (
  <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse flex flex-col justify-between">
    <div className="aspect-[16/10] sm:aspect-video bg-gray-200" />
    <div className="p-3.5 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded w-5/6" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const { toggleWishlist, hasItem } = useWishlistStore();

  // Search Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [homeSuggestions, setHomeSuggestions] = useState<SearchSuggestion[]>([]);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const [isHomeSuggesting, setIsHomeSuggesting] = useState(false);
  const homeSearchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeSearchContainerRef.current && !homeSearchContainerRef.current.contains(event.target as Node)) {
        setShowHomeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete debounced ~300ms, min 2 chars
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setHomeSuggestions([]);
      setShowHomeSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsHomeSuggesting(true);
      try {
        const res = await listingService.searchSuggest(searchQuery.trim(), null, 5);
        setHomeSuggestions(res);
        setShowHomeSuggestions(res.length > 0);
      } catch (err) {
        console.warn('Home search suggest failed:', err);
      } finally {
        setIsHomeSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Category listings page state
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const handleCategoryTap = (category: any) => {
    setSelectedCategory(category);
    setCurrentPage('category-listings');
  };

  const handleCategoryTapByIdOrType = (idOrType: string) => {
    const found = HOMEPAGE_CATEGORIES.find(c => c.id === idOrType || c.type === idOrType);
    if (found) {
      handleCategoryTap(found);
    }
  };

  // Carousel States
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Real DB States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroListings, setHeroListings] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [beiYaComrade, setBeiYaComrade] = useState<any[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([]);

  // Safe fetch helper to ensure individual queries do not break on schema variation
  const safeQuery = async (promise: any) => {
    try {
      const res = await promise;
      if (res.error) {
        console.error('Database query warning:', res.error);
        return [];
      }
      return res.data ?? [];
    } catch (err) {
      console.error('Database query caught failure:', err);
      return [];
    }
  };

  // Main loader for all database sections
  const loadDatabaseData = async () => {
    try {
      // Step A: Parallel fetch for straightforward sections
      const [
        carouselData,
        flashData,
        accommodationData,
        productData,
        serviceData,
        eventData,
        comradeDealsData,
        recentData
      ] = await Promise.all([
        // 1. Carousel Hero Listings (Latest 6 Active)
        safeQuery(
          supabase
            .from('listings')
            .select(`
              id, listing_type, title, status, created_at, description,
              accommodations (
                id, accommodation_type, price_per_month, bedrooms, bathrooms, distance_from_campus_km, availability_status, description,
                accommodation_images (image_url, is_primary, display_order)
              ),
              products (
                id, price, original_price, quantity, is_negotiable, category_id,
                product_images (image_url, is_primary, display_order)
              )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(6)
        ),

        // 2. Flash Sales (is_promoted = true)
        safeQuery(
          supabase
            .from('listings')
            .select(`
              id, title, listing_type, status,
              products (
                id, price, original_price, quantity,
                product_images (image_url, is_primary, display_order)
              ),
              accommodations (
                id, price_per_month,
                accommodation_images (image_url, is_primary, display_order)
              )
            `)
            .eq('status', 'active')
            .eq('is_promoted', true)
            .order('promotion_priority', { ascending: false })
            .limit(6)
        ),

        // 3. Accommodations (reference - kept exactly as-is)
        safeQuery(
          supabase
            .from('listings')
            .select(`
              id, title, listing_type, status,
              accommodations (
                id, accommodation_type, price_per_month, bedrooms, bathrooms, distance_from_campus_km, availability_status, description,
                accommodation_images (image_url, is_primary, display_order)
              )
            `)
            .eq('listing_type', 'accommodation')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(8)
        ),

        // 4. Products Section (contract #1: direct query from products)
        safeQuery(
          supabase
            .from('products')
            .select('id, title, price, currency, original_price, seller_type, store_id, product_images(image_url, is_primary, display_order)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(12)
        ),

        // 5. Services Section (contract #3: direct query from services)
        safeQuery(
          supabase
            .from('services')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(8)
        ),

        // 6. Events Section (contract #4: direct query from events)
        safeQuery(
          supabase
            .from('events')
            .select('*')
            .eq('status', 'upcoming')
            .order('created_at', { ascending: false })
            .limit(8)
        ),

        // 7. Bei Ya Comrade (contract #6: nested select from comrade_deals)
        safeQuery(
          supabase
            .from('comrade_deals')
            .select('*, product:products(*, product_images(image_url, is_primary, display_order))')
            .eq('is_active', true)
            .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(12)
        ),

        // 8. Recently Added (all active listings, limit 6)
        safeQuery(
          supabase
            .from('listings')
            .select(`
              id, title, listing_type, status, created_at,
              accommodations (
                id, accommodation_type, price_per_month, bedrooms, bathrooms, distance_from_campus_km, availability_status, description,
                accommodation_images (image_url, is_primary, display_order)
              ),
              products (
                id, price, original_price, quantity, is_negotiable,
                product_images (image_url, is_primary, display_order)
              )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(6)
        )
      ]);

      // Step B: Trending Section (contract #5: polymorphic two-step fetch)
      let trendingProducts: any[] = [];
      try {
        const { data: scores, error: scoresError } = await supabase
          .from('trending_scores')
          .select('target_id, score')
          .eq('target_type', 'product')
          .eq('time_window', '24h')
          .order('score', { ascending: false })
          .limit(12);

        if (!scoresError && scores && scores.length > 0) {
          const ids = scores.map((s: any) => s.target_id);
          const { data: pData, error: pError } = await supabase
            .from('products')
            .select('id, title, price, currency, original_price, seller_type, store_id, product_images(image_url, is_primary, display_order)')
            .in('id', ids)
            .eq('status', 'active');

          if (!pError && pData) {
            const idOrderMap = new Map(ids.map((id: string, index: number) => [id, index]));
            trendingProducts = [...pData].sort((a: any, b: any) => {
              const orderA = idOrderMap.get(a.id) ?? 999;
              const orderB = idOrderMap.get(b.id) ?? 999;
              return orderA - orderB;
            });
          }
        }
      } catch (trendErr) {
        console.warn('Failed fetching trending products:', trendErr);
      }

      // Products section uses exclusively the database query result
      const sanitizedEvents = (eventData || []).map((ev: any) => {
        if (ev.banner_url && !ev.banner_url.startsWith('http')) {
          return { ...ev, banner_url: null };
        }
        return ev;
      });

      // Retroactively clean up legacy base64 banners in the database
      listingService.fixLegacyEventBanners();

      setHeroListings(carouselData);
      setFlashSales(flashData);
      setAccommodations(accommodationData);
      setProducts(productData || []);
      setServices(serviceData);
      setEvents(sanitizedEvents);
      setTrending(trendingProducts);
      setBeiYaComrade(comradeDealsData);
      setRecentlyAdded(recentData);

    } catch (err) {
      console.error('Failed loading database data for home sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Carousel auto-slide ticking
  useEffect(() => {
    if (heroListings.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroListings.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [heroListings.length, isPaused]);

  // Touch Swipe Handlers for Hero Carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      // Swipe Left -> Next
      setActiveSlide((prev) => (prev + 1) % (heroListings.length || 1));
    } else if (diff < -50) {
      // Swipe Right -> Prev
      setActiveSlide((prev) => (prev - 1 + (heroListings.length || 1)) % (heroListings.length || 1));
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  // Handle Dynamic Search Action
  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  // Simulated pull-to-refresh
  const handleSimulatedRefresh = () => {
    setRefreshing(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Refreshing marketplace feeds...',
        success: () => {
          loadDatabaseData();
          setRefreshing(false);
          return 'Feeds refreshed with latest campus listings!';
        },
        error: 'Failed to update feeds'
      }
    );
  };

  // Carousel Primary Image Extractor
  const getCarouselImage = (listing: any) => {
    const isAcc = listing.listing_type === 'accommodation';
    const acc = Array.isArray(listing.accommodations) ? listing.accommodations[0] : listing.accommodations;
    const prod = Array.isArray(listing.products) ? listing.products[0] : listing.products;
    const images = isAcc ? (acc?.accommodation_images ?? []) : (prod?.product_images ?? []);
    const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
  };

  // Flash Sale Card Render
  const renderFlashSaleCard = (listing: any) => {
    const prod = Array.isArray(listing.products) ? listing.products[0] : listing.products;
    const acc = Array.isArray(listing.accommodations) ? listing.accommodations[0] : listing.accommodations;
    const isAcc = listing.listing_type === 'accommodation';

    const price = isAcc ? Number(acc?.price_per_month) : Number(prod?.price);
    const originalPrice = isAcc ? null : (prod?.original_price ? Number(prod?.original_price) : null);
    const quantity = isAcc ? null : (prod?.quantity ? Number(prod?.quantity) : null);

    const images = isAcc ? (acc?.accommodation_images ?? []) : (prod?.product_images ?? []);
    const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const imageUrl = sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;

    const hasDiscount = originalPrice && originalPrice > price;
    const discount = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;

    const soldCount = quantity ? Math.max(1, Math.round(quantity * 0.35)) : 0;
    const percentSold = quantity ? Math.min(100, Math.round((soldCount / quantity) * 100)) : 0;
    const isWishlisted = hasItem(listing.id);

    return (
      <div 
        key={listing.id}
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
      >
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl opacity-70 select-none">{isAcc ? '🏠' : '📦'}</span>
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-1.5 left-1.5 bg-[#F6AD55] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
              -{discount}%
            </span>
          )}
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(listing.id);
            }}
            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5 text-left">
          <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {listing.title}
          </h4>
          
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono font-black text-red-600 text-xs sm:text-sm">
                KSh {price.toLocaleString('en-KE')}
              </span>
              {originalPrice && (
                <span className="font-mono text-[10px] text-gray-400 line-through">
                  KSh {originalPrice.toLocaleString('en-KE')}
                </span>
              )}
            </div>

            {quantity !== null && quantity > 0 && (
              <div className="mt-1.5 space-y-0.5">
                <div style={{ background: '#eee', height: 3, borderRadius: 2 }}>
                  <div style={{
                    background: '#F6AD55',
                    width: `${percentSold}%`,
                    height: '100%',
                    borderRadius: 2
                  }} />
                </div>
                <p className="text-[9px] text-gray-500 font-bold leading-none">
                  {quantity} items left
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Accommodation Card Render
  const renderAccommodationCard = (listing: any) => {
    const acc = Array.isArray(listing.accommodations) ? listing.accommodations[0] : listing.accommodations;
    if (!acc) return null;

    const images = acc?.accommodation_images ?? [];
    const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const imageUrl = sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;

    const typeLabel = {
      bedsitter: 'Bedsitter',
      hostel: 'Hostel',
      apartment: 'Apartment',
      shared_room: 'Shared Room',
    }[acc.accommodation_type as string] ?? 'House';

    const isAvailable = acc.availability_status === 'available';
    const isWishlisted = hasItem(listing.id);

    return (
      <div 
        key={listing.id}
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
      >
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl opacity-70 select-none">🏠</span>
            </div>
          )}
          <div className="absolute top-1.5 left-1.5">
            <span className={`text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded text-white shadow-xs ${
              isAvailable ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}>
              {isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(listing.id);
            }}
            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 flex-grow flex flex-col justify-between space-y-1">
          <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {listing.title}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate leading-tight">
            {typeLabel}{acc.distance_from_campus_km ? ` · ${acc.distance_from_campus_km}km` : ''}
          </p>
          <p className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm pt-0.5 leading-none">
            KSh {Number(acc.price_per_month).toLocaleString('en-KE')}/mo
          </p>
        </div>
      </div>
    );
  };

  // Products Card Render (Supports direct product row, nested listing.products, or comrade deal)
  const renderProductCard = (item: any, customBadge?: { label: string; colorClass?: string }) => {
    const prod = item?.products 
      ? (Array.isArray(item.products) ? item.products[0] : item.products) 
      : (item?.product ? item.product : item);
    if (!prod) return null;

    const id = prod.id || item.id;
    const title = prod.title || item.title || 'Product';
    const price = Number(item.new_price ?? prod.price ?? item.price ?? 0);
    const originalPrice = item.original_price 
      ? Number(item.original_price) 
      : (prod.original_price ? Number(prod.original_price) : null);
    const hasDiscount = originalPrice && originalPrice > price;
    const discount = hasDiscount 
      ? Math.round((1 - price / originalPrice) * 100) 
      : (item.discount_percent ?? 0);

    const images = prod.product_images ?? item.product_images ?? [];
    const sorted = Array.isArray(images) 
      ? [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      : [];
    const imageUrl = sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? prod.image_url ?? item.image_url ?? null;
    const isWishlisted = hasItem(id);

    const isStore = prod.seller_type === 'store' || item.seller_type === 'store' || Boolean(prod.store_id || item.store_id);

    return (
      <div 
        key={id}
        onClick={() => navigate(`/listing/${id}`)}
        className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
      >
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl opacity-70 select-none">📦</span>
            </div>
          )}

          {/* Top-left Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start">
            {customBadge ? (
              <span className={`text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded text-white shadow-xs ${customBadge.colorClass || 'bg-[#F6AD55]'}`}>
                {customBadge.label}
              </span>
            ) : isStore ? (
              <span className="bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                <Store className="w-2.5 h-2.5 inline shrink-0" />
                Store
              </span>
            ) : (
              <span className="bg-amber-600 text-white text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs">
                🎓 Student
              </span>
            )}
            {hasDiscount && discount > 0 && !customBadge && (
              <span className="bg-[#F6AD55] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                -{discount}%
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(id);
            }}
            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 flex-grow flex flex-col justify-between space-y-1">
          <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {title}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate leading-tight">
            {isStore ? 'Verified Campus Store' : 'Student Seller'}
          </p>
          <div className="pt-0.5">
            <span className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm leading-none block">
              KSh {price.toLocaleString('en-KE')}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="font-mono text-[10px] text-gray-400 line-through leading-none mt-0.5 block">
                KSh {originalPrice.toLocaleString('en-KE')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Services Card Render
  const renderServiceCard = (service: any) => {
    const isWishlisted = hasItem(service.id);
    const images = service.service_images ?? [];
    const imageUrl = service.image_url || images[0]?.image_url || null;
    const price = Number(service.starting_price || service.price || 0);

    return (
      <div 
        key={service.id}
        onClick={() => navigate(`/listing/${service.listing_id || service.id}`)}
        className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
      >
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={service.title || 'Campus Service'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl opacity-70 select-none">🛠️</span>
            </div>
          )}
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded text-white shadow-xs bg-emerald-600">
              Service
            </span>
          </div>
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(service.id);
            }}
            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 flex-grow flex flex-col justify-between space-y-1">
          <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {service.title || service.provider_bio || 'Student Service'}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate leading-tight">
            {service.service_type || 'Campus Service'}
          </p>
          <p className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm pt-0.5 leading-none">
            {price > 0 ? `From KSh ${price.toLocaleString('en-KE')}` : 'Inquire for price'}
          </p>
        </div>
      </div>
    );
  };

  // Events Card Render
  const renderEventCard = (event: any) => {
    const isWishlisted = hasItem(event.id);
    const imageUrl = (event.banner_url && event.banner_url.startsWith('http')) ? event.banner_url : null;
    const price = Number(event.ticket_price || 0);

    return (
      <div 
        key={event.id}
        onClick={() => navigate(`/listing/${event.listing_id || event.id}`)}
        className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
      >
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={event.title || 'Campus Event'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl sm:text-2xl opacity-70 select-none">🎟️</span>
            </div>
          )}
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded text-white shadow-xs bg-purple-600">
              {event.is_free ? 'Free' : 'Event'}
            </span>
          </div>
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(event.id);
            }}
            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 flex-grow flex flex-col justify-between space-y-1">
          <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {event.title || event.organizer_name || 'Campus Event'}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate leading-tight">
            {event.event_date || event.venue || 'Upcoming Event'}
          </p>
          <p className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm pt-0.5 leading-none">
            {event.is_free || price === 0 ? 'Free Entry' : `KSh ${price.toLocaleString('en-KE')}`}
          </p>
        </div>
      </div>
    );
  };

  // Grid Card Render
  const renderGridCard = (listing: any) => {
    const isAcc = listing.listing_type === 'accommodation';
    if (isAcc) {
      const acc = Array.isArray(listing.accommodations) ? listing.accommodations[0] : listing.accommodations;
      if (!acc) return null;

      const images = acc?.accommodation_images ?? [];
      const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const imageUrl = sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;

      const typeLabel = {
        bedsitter: 'Bedsitter',
        hostel: 'Hostel',
        apartment: 'Apartment',
        shared_room: 'Shared Room',
      }[acc.accommodation_type as string] ?? 'House';

      const isAvailable = acc.availability_status === 'available';
      const isWishlisted = hasItem(listing.id);

      return (
        <div 
          key={listing.id}
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
        >
          <div className="relative aspect-square bg-slate-100 overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={listing.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <span className="text-xl sm:text-2xl opacity-70 select-none">🏠</span>
              </div>
            )}
            <div className="absolute top-1.5 left-1.5">
              <span className={`text-[8px] sm:text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded text-white shadow-xs ${
                isAvailable ? 'bg-[#10B981]' : 'bg-[#EF4444]'
              }`}>
                {isAvailable ? 'Available' : 'Occupied'}
              </span>
            </div>
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(listing.id);
              }}
              className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                isWishlisted
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          <div className="p-2 sm:p-2.5 space-y-1 flex-1 flex flex-col justify-between">
            <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
              {listing.title}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate leading-tight">
              {typeLabel}{acc.distance_from_campus_km ? ` · ${acc.distance_from_campus_km}km` : ''}
            </p>
            <p className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm pt-0.5 leading-none">
              KSh {Number(acc.price_per_month).toLocaleString('en-KE')}/mo
            </p>
          </div>
        </div>
      );
    } else {
      const prod = Array.isArray(listing.products) ? listing.products[0] : listing.products;
      if (!prod) return null;

      const price = Number(prod.price);
      const originalPrice = prod.original_price ? Number(prod.original_price) : null;
      const hasDiscount = originalPrice && originalPrice > price;
      const discount = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;

      const images = prod.product_images ?? [];
      const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const imageUrl = sorted.find((i: any) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
      const isWishlisted = hasItem(listing.id);

      return (
        <div 
          key={listing.id}
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="w-full bg-white rounded-lg border border-gray-150 shadow-xs overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group"
        >
          <div className="relative aspect-square bg-slate-50 overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={listing.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <span className="text-xl sm:text-2xl opacity-70 select-none">📦</span>
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-1.5 left-1.5 bg-[#F6AD55] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                -{discount}%
              </span>
            )}
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(listing.id);
              }}
              className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-md backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                isWishlisted
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          <div className="p-2 sm:p-2.5 space-y-1 flex-1 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
              {listing.title}
            </h4>
            <div className="pt-0.5">
              <span className="font-mono font-black text-[#E53E3E] text-xs sm:text-sm leading-none block">
                KSh {price.toLocaleString('en-KE')}
              </span>
              {originalPrice && (
                <span className="font-mono text-[10px] text-gray-400 line-through leading-none mt-0.5 block">
                  KSh {originalPrice.toLocaleString('en-KE')}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  // Dynamic Carousel slide renderer
  const renderCarouselSlide = (slide: any) => {
    const isAcc = slide.listing_type === 'accommodation';
    const acc = Array.isArray(slide.accommodations) ? slide.accommodations[0] : slide.accommodations;
    const prod = Array.isArray(slide.products) ? slide.products[0] : slide.products;

    const price = isAcc
      ? (acc?.price_per_month ? `KSh ${Number(acc.price_per_month).toLocaleString('en-KE')}/mo` : 'Price not set')
      : (prod?.price ? `KSh ${Number(prod.price).toLocaleString('en-KE')}` : 'Price not set');

    const typeLabel = isAcc ? 'ACCOMMODATION' : 'PRODUCT';
    const subtypeLabel = isAcc
      ? ({ bedsitter: 'Bedsitter', hostel: 'Hostel', apartment: 'Apartment', shared_room: 'Shared Room' }[acc?.accommodation_type as string] ?? 'Room')
      : 'Item';

    const imgUrl = getCarouselImage(slide);

    return (
      <div 
        key={slide.id} 
        className="w-full h-full shrink-0 relative overflow-hidden flex-none rounded-[16px]"
      >
        {/* Background image or gradient */}
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={slide.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
            <span className="text-7xl opacity-30 select-none">{isAcc ? '🏠' : '📦'}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top Left Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-[#E53E3E] text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
            {typeLabel}
          </span>
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {subtypeLabel}
          </span>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-6 left-6 right-6 text-left space-y-2">
          <h3 className="text-xl md:text-2xl font-black text-white leading-tight line-clamp-1">
            {slide.title}
          </h3>
          {slide.description && (
            <p className="text-white/80 text-xs md:text-sm line-clamp-2 max-w-xl">
              {slide.description}
            </p>
          )}
          <div className="font-mono font-black text-[#F6AD55] text-lg md:text-xl">
            {price}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => navigate(`/listing/${slide.id}`)}
              className="bg-[#E53E3E] hover:bg-[#C53030] text-white font-extrabold text-xs h-9 px-5 rounded-full shadow-md cursor-pointer transition-all"
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (isAcc) {
                  handleCategoryTapByIdOrType('accommodation');
                } else {
                  navigate('/products');
                }
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs h-9 px-5 rounded-full border border-white/20"
            >
              Explore
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (currentPage === 'category-listings' && selectedCategory) {
    return (
      <CategoryListingsPage
        category={selectedCategory}
        onBack={() => {
          setCurrentPage('home');
          setSelectedCategory(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] -mx-3 sm:-mx-4 px-3 sm:px-4 pt-1.5 sm:pt-2 pb-24 space-y-4 sm:space-y-5 font-sans select-none w-full max-w-full overflow-x-hidden">
      
      {/* [2] TOP QUICK BUTTONS & SEARCH BAR */}
      <div className="max-w-7xl mx-auto w-full space-y-3">
        {/* Two Buttons: Second Hand & Shop Owners */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Second Hand */}
          <button
            type="button"
            onClick={() => navigate('/search?sellerType=student')}
            className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-gray-100 flex items-center gap-2.5 sm:gap-3 text-left hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">Second Hand</h4>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-tight mt-0.5 truncate">Pre-loved items</p>
            </div>
          </button>

          {/* Shop Owners */}
          <button
            type="button"
            onClick={() => navigate('/search?sellerType=store')}
            className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-gray-100 flex items-center gap-2.5 sm:gap-3 text-left hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">Shop Owners</h4>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-tight mt-0.5 truncate">Stores & Businesses</p>
            </div>
          </button>
        </div>

        {/* Search Bar - Exact Kibu Mall Style */}
        <div ref={homeSearchContainerRef} className="relative w-full">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setShowHomeSuggestions(false);
              handleSearchSubmit(searchQuery);
            }}
            className="w-full"
          >
            <div className="w-full h-11 sm:h-12 rounded-full bg-[#F0F1F2] hover:bg-[#EAEBED] focus-within:bg-[#EAEBED] transition-colors flex items-center px-4">
              <button
                type="submit"
                className="text-[#282828] hover:opacity-80 transition-opacity p-0.5 cursor-pointer shrink-0"
                title="Search"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-[#282828] stroke-[2.2]" />
              </button>
              <input 
                type="text"
                placeholder="Search on Kibu Mall"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (homeSuggestions.length > 0) setShowHomeSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setShowHomeSuggestions(false);
                    handleSearchSubmit(searchQuery);
                  } else if (e.key === 'Escape') {
                    setShowHomeSuggestions(false);
                  }
                }}
                className="w-full bg-transparent pl-3 pr-8 text-sm font-normal text-[#282828] placeholder:text-[#282828]/85 focus:outline-none border-none ring-0 focus:ring-0 shadow-none"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowHomeSuggestions(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 text-xs font-bold bg-gray-300/70 rounded-full h-5 w-5 flex items-center justify-center p-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Autocomplete Dropdown in Home */}
          {showHomeSuggestions && homeSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden py-1.5 animate-in fade-in-50 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b pb-1 mb-1">
                <span>Suggested matches</span>
                {isHomeSuggesting && <span className="animate-pulse text-indigo-600">Updating...</span>}
              </div>
              {homeSuggestions.map((sug, i) => (
                <button
                  key={`home-sug-${sug.id || i}`}
                  type="button"
                  onClick={() => {
                    setSearchQuery(sug.suggestion);
                    setShowHomeSuggestions(false);
                    handleSearchSubmit(sug.suggestion);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs text-gray-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <span className="font-semibold truncate text-gray-900 group-hover:text-indigo-600">{sug.suggestion}</span>
                  </div>
                  {sug.type && (
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {sug.type}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        // Pulsing Skeleton Feeds
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="h-[280px] bg-white rounded-3xl animate-pulse border shadow-sm w-full" />
          <div className="bg-white p-6 rounded-2xl animate-pulse h-40 border shadow-sm" />
          <div className="space-y-4">
            <div className="h-8 bg-white rounded w-1/3 animate-pulse border" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

          {/* [3] HERO CAROUSEL */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-[#0F172A] text-white shadow-sm aspect-[16/10] md:aspect-[21/9] w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {heroListings.length === 0 ? (
              // Empty Fallback slide
              <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a]">
                <span className="text-6xl mb-4 animate-bounce">🏪</span>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Campus marketplace is growing!
                </h3>
                <p className="text-xs text-gray-400 mt-2 max-w-md">
                  Be the first to list and connect with thousands of classmates.
                </p>
                <Button 
                  onClick={() => navigate('/dashboard/listings/new')}
                  className="mt-6 bg-[#E53E3E] hover:bg-[#C53030] text-white font-extrabold h-11 px-8 rounded-full shadow-lg cursor-pointer"
                >
                  + Sell Now
                </Button>
              </div>
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                {/* Sliders track */}
                <div 
                  className="flex h-full w-full transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {heroListings.map((slide) => renderCarouselSlide(slide))}
                </div>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {heroListings.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-5 bg-[#E53E3E]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* [5] FLASH SALES SECTION */}
          {flashSales.length > 0 && (
            <section className="space-y-2 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs">
              {/* Header block with red background */}
              <div className="bg-[#E53E3E] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-extrabold text-xs sm:text-sm md:text-base flex items-center gap-1 uppercase tracking-wide">
                    ⚡ Flash Sales
                  </span>
                  <FlashSaleCountdown />
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-white hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                >
                  SEE ALL
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 p-2.5 sm:p-3.5">
                {flashSales.map((listing) => renderFlashSaleCard(listing))}
              </div>
            </section>
          )}

          {/* [6] ACCOMMODATION SECTION */}
          {accommodations.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                    🏠 Dorms & Accommodation
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold leading-tight">
                    Student-approved rooms near campus
                  </p>
                </div>
                <button 
                  onClick={() => handleCategoryTapByIdOrType('accommodation')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {accommodations.map((listing) => renderAccommodationCard(listing))}
              </div>
            </section>
          )}

          {/* [7] PRODUCTS SECTION */}
          {products.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                    📦 Student Marketplace
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold leading-tight">
                    Verified classmate listings & deals
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {products.map((item) => renderProductCard(item))}
              </div>
            </section>
          )}

          {/* TRENDING SECTION */}
          {trending.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    🔥 Trending Today
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold leading-tight">
                    Most active items in the last 24 hours
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {trending.map((item) => renderProductCard(item))}
              </div>
            </section>
          )}

          {/* [8] "BEI YA COMRADE" SECTION */}
          {beiYaComrade.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card with Amber background */}
              <div className="bg-[#F6AD55] text-white px-3 sm:px-4 py-2.5 rounded-lg shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wide">
                    💰 Bei Ya Comrade | Student Deals
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-orange-950/80 font-bold leading-tight">
                    Exclusive discounts & comrade prices
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-white hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {beiYaComrade.map((deal) => {
                  const tagBadge = deal.tag ? ({
                    price_drop: { label: 'Price Drop', colorClass: 'bg-rose-600' },
                    student_deal: { label: 'Comrade Deal', colorClass: 'bg-emerald-600' },
                    clearance: { label: 'Clearance', colorClass: 'bg-amber-600' }
                  }[deal.tag as string] || { label: 'Deal', colorClass: 'bg-orange-500' }) : undefined;

                  return renderProductCard(deal.product || deal, tagBadge);
                })}
              </div>
            </section>
          )}

          {/* SERVICES SECTION */}
          {services.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                    🛠️ Student Services & Skills
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold leading-tight">
                    Tutoring, repairs, salon, photography & more
                  </p>
                </div>
                <button 
                  onClick={() => handleCategoryTapByIdOrType('service')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {services.map((svc) => renderServiceCard(svc))}
              </div>
            </section>
          )}

          {/* EVENTS SECTION */}
          {events.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                    🎟️ Campus Events & Activities
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold leading-tight">
                    Gigs, workshops, matches & parties
                  </p>
                </div>
                <button 
                  onClick={() => handleCategoryTapByIdOrType('event')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {events.map((evt) => renderEventCard(evt))}
              </div>
            </section>
          )}

          {/* [9] RECENTLY ADDED */}
          {recentlyAdded.length > 0 && (
            <section className="space-y-2.5">
              {/* Section Header Card */}
              <div className="bg-white px-3 sm:px-4 py-2.5 rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    🆕 Just Listed
                  </h3>
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  className="text-[#E53E3E] hover:underline text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  SEE ALL →
                </button>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 pb-4">
                {recentlyAdded.map((listing) => renderGridCard(listing))}
              </div>
            </section>
          )}

        </div>
      )}
      
    </div>
  );
}
