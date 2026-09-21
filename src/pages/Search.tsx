import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  MapPin, 
  SlidersHorizontal,
  X, 
  ChevronRight, 
  Home as HomeIcon, 
  Package, 
  Wrench, 
  Calendar, 
  HelpCircle as LostIcon,
  Sliders,
  Store,
  RefreshCw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { listingService, ListingType, SearchSuggestion } from '@/services/listingService';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as ListingType) || 'product';

  // Entry scope detection:
  // 'student' = Second Hand tile
  // 'store'   = Shop Owners tile
  // null      = General / Unified search
  const sellerTypeParam = searchParams.get('sellerType');
  const isScopedSellerSearch = sellerTypeParam === 'student' || sellerTypeParam === 'store';
  const scopedSellerType: 'student' | 'store' | null = isScopedSellerSearch ? (sellerTypeParam as 'student' | 'store') : null;

  const { user } = useAuth();

  // Search input and category state
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<ListingType>(initialType);
  const [campusFilter, setCampusFilter] = useState('all');
  
  // Custom Filters
  const [priceRange, setPriceRange] = useState([0, 80000]);
  const [accommodationClass, setAccommodationClass] = useState<'hostel' | 'bedsitter' | 'apartment' | 'shared_room' | 'all'>('all');
  const [lostFoundModeCode, setLostFoundModeCode] = useState<'lost' | 'found' | 'all'>('all');
  const [eventDateFilter, setEventDateFilter] = useState('');
  
  // Seller registry filter ONLY for General Search
  const initialSellerType = (searchParams.get('generalSellerType') as any) || 'all';
  const [sellerTypeFilter, setSellerTypeFilter] = useState<'all' | 'student' | 'store'>(initialSellerType);

  // Scoped search filter toggle
  const [showScopedFilters, setShowScopedFilters] = useState(false);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [scopedProducts, setScopedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const list = localStorage.getItem('kbumart_recent_searches');
    return list ? JSON.parse(list) : ['hostel near Gate C', 'HP Elitebook', 'Calculus guides', 'kettle'];
  });

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Wire search_suggest autocomplete: debounced ~300ms, query length >= 2
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const campId = campusFilter === 'all' ? null : campusFilter;
        const res = await listingService.searchSuggest(query.trim(), campId, 5);
        setSuggestions(res);
        setShowSuggestions(res.length > 0);
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, campusFilter]);

  // Execute Search
  const handlePerformSearch = async (
    targetQuery: string = query, 
    targetType: ListingType = activeType
  ) => {
    setLoading(true);
    try {
      const campId = campusFilter === 'all' ? null : campusFilter;

      if (isScopedSellerSearch && scopedSellerType) {
        // SIMPLIFIED ENTRY: Pass fixed _seller_type ('student' | 'store')
        const data = await listingService.searchMarketplace(
          targetQuery || null,
          campId,
          scopedSellerType,
          50
        );

        // Filter products by price ceiling
        const productsList = (data.products || []).filter((p: any) => {
          const itemPrice = p.price !== undefined 
            ? p.price 
            : (p.product_price !== undefined ? p.product_price : (p.product_details?.price || 0));
          return itemPrice >= priceRange[0] && itemPrice <= priceRange[1];
        });

        setScopedProducts(productsList);

        if (targetQuery.trim() && !recentSearches.includes(targetQuery.trim())) {
          const next = [targetQuery.trim(), ...recentSearches.slice(0, 5)];
          setRecentSearches(next);
          localStorage.setItem('kbumart_recent_searches', JSON.stringify(next));
        }
      } else {
        // GENERAL SEARCH: Call without _seller_type to keep all categories
        const data = await listingService.searchAllListings(
          targetQuery || null,
          targetType,
          campId,
          40,
          0,
          user?.id
        );

        // Apply client-side detailed view filters
        let filtered = data || [];
        if (targetType === 'product') {
          filtered = filtered.filter((item: any) => {
            const detail = item.product_details || {};
            const itemPrice = item.product_price !== undefined ? item.product_price : (detail.price || 0);
            const matchesPrice = itemPrice >= priceRange[0] && itemPrice <= priceRange[1];
            const isStore = item.owner?.role === 'store' || item.product_seller_type === 'store' || item.seller_type === 'store' || Boolean(item.store_id);
            const matchesSeller = sellerTypeFilter === 'all' || 
              (sellerTypeFilter === 'store' && isStore) ||
              (sellerTypeFilter === 'student' && !isStore);
            return matchesPrice && matchesSeller;
          });
        } else if (targetType === 'accommodation') {
          filtered = filtered.filter((item: any) => {
            const detail = (Array.isArray(item.accommodation_details) ? item.accommodation_details[0] : item.accommodation_details) || {};
            const rentVal = Number(item.accommodation_price ?? detail.price_per_month ?? detail.rent_amount ?? detail.price ?? 0);
            const classVal = item.accommodation_type || detail.accommodation_type || detail.property_type || 'bedsitter';
            const matchesPrice = rentVal >= priceRange[0] && rentVal <= priceRange[1];
            const matchesClass = accommodationClass === 'all' || classVal === accommodationClass;
            return matchesPrice && matchesClass;
          });
        } else if (targetType === 'service') {
          filtered = filtered.filter((item: any) => {
            const detail = item.service_details || {};
            const priceVal = item.service_price !== undefined ? item.service_price : (detail.starting_price || 0);
            return priceVal >= priceRange[0] && priceVal <= priceRange[1];
          });
        } else if (targetType === 'lost_found') {
          filtered = filtered.filter((item: any) => {
            const detail = item.lost_found_details || {};
            const modeVal = item.lost_found_mode || detail.listing_mode;
            return lostFoundModeCode === 'all' || modeVal === lostFoundModeCode;
          });
        } else if (targetType === 'event') {
          filtered = filtered.filter((item: any) => {
            const detail = item.event_details || {};
            const dateVal = item.event_date || detail.event_date;
            return !eventDateFilter || dateVal === eventDateFilter;
          });
        }

        setResults(filtered);

        if (targetQuery.trim() && !recentSearches.includes(targetQuery.trim())) {
          const next = [targetQuery.trim(), ...recentSearches.slice(0, 5)];
          setRecentSearches(next);
          localStorage.setItem('kbumart_recent_searches', JSON.stringify(next));
        }
      }
    } catch (err) {
      console.error('Search query error:', err);
      toast.error('Search query failed');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on mount and when filter criteria change
  useEffect(() => {
    handlePerformSearch(initialQuery, initialType);
  }, [
    initialQuery, 
    initialType, 
    activeType, 
    campusFilter, 
    priceRange, 
    accommodationClass, 
    lostFoundModeCode, 
    eventDateFilter, 
    sellerTypeFilter,
    sellerTypeParam
  ]);

  const handleSearchSubmit = (searchTerm: string) => {
    setShowSuggestions(false);
    if (isScopedSellerSearch && scopedSellerType) {
      setSearchParams({ sellerType: scopedSellerType, q: searchTerm });
    } else {
      setSearchParams({ q: searchTerm, type: activeType });
    }
    handlePerformSearch(searchTerm, activeType);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleRecentClick = (text: string) => {
    setQuery(text);
    handleSearchSubmit(text);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setQuery(suggestionText);
    handleSearchSubmit(suggestionText);
  };

  const handleResultClick = async (item: any) => {
    const targetId = item.id || item.listing_id;
    if (results.length > 0 && targetId) {
      listingService.logSearchClick(user?.id, query, targetId).catch(console.warn);
    }
    if (targetId) {
      navigate(`/listing/${targetId}`);
    }
  };

  const getListingCardDetails = (item: any) => {
    let price = 0;
    let subtitle = '';
    let image = null;

    if (item.listing_type === 'product') {
      const details = item.product_details || {};
      price = item.product_price !== undefined ? item.product_price : (details.price || 0);
      subtitle = `Condition: ${(item.product_condition || details.condition) === 'new' ? 'New' : 'Used'}`;
      image = details.images?.[0] || item.product_images?.[0]?.image_url || (item.images && item.images[0]) || null;
    } else if (item.listing_type === 'accommodation') {
      const details = (Array.isArray(item.accommodation_details) ? item.accommodation_details[0] : item.accommodation_details) || {};
      const imagesList = details.accommodation_images || item.accommodation_images || [];
      const primaryImage = imagesList.find((img: any) => img.is_primary)?.image_url 
        || imagesList[0]?.image_url 
        || (details.images && details.images[0]) 
        || (item.images && item.images[0])
        || null;

      const distanceVal = details.distance_from_campus_km !== null && details.distance_from_campus_km !== undefined
        ? `${details.distance_from_campus_km} km`
        : (details.distance_from_campus || 'Near Campus');

      price = Number(item.accommodation_price ?? details.price_per_month ?? details.rent_amount ?? details.price ?? 0);
      subtitle = `${item.accommodation_type || details.accommodation_type || details.property_type || 'Bedsitter'} • ${distanceVal}`;
      image = primaryImage;
    } else if (item.listing_type === 'service') {
      const details = item.service_details || item.service_type_details || {};
      price = item.service_price !== undefined ? item.service_price : (details.starting_price || details.price || 0);
      subtitle = `Gigs: ${details.working_hours || item.service_category || 'Flexible'}`;
      image = (item.images && item.images[0]) || details.service_images?.[0]?.image_url || null;
    } else if (item.listing_type === 'lost_found') {
      const details = item.lost_found_details || {};
      price = 0;
      const mode = item.lost_found_mode || details.listing_mode;
      subtitle = `Mode: ${mode === 'lost' ? '🎒 Lost' : '🟢 Found'} at ${details.exact_location || item.location || 'Campus'}`;
      image = (item.images && item.images[0]) || details.lost_found_images?.[0]?.image_url || null;
    } else if (item.listing_type === 'event') {
      const details = item.event_details || {};
      price = item.ticket_price !== undefined ? item.ticket_price : (details.ticket_price || 0);
      const date = item.event_date || details.event_date;
      subtitle = `${date || 'TBD'} • By ${details.organizer_name || 'Comrades'}`;
      const rawImg = details.banner_url || (item.images && item.images[0]) || details.event_images?.[0]?.image_url || null;
      image = (rawImg && rawImg.startsWith('http')) ? rawImg : null;
    }

    return { price, subtitle, image };
  };

  // Scoped search filter count
  const activeScopedFiltersCount = (priceRange[1] < 80000 ? 1 : 0) + (campusFilter !== 'all' ? 1 : 0);

  // Scoped UI search placeholder
  const scopedPlaceholder = scopedSellerType === 'student' 
    ? 'Search second-hand items...' 
    : 'Search store products...';

  // Scoped UI header info
  const scopedHeader = scopedSellerType === 'student' ? {
    title: 'Second Hand Marketplace',
    subtitle: 'Pre-loved electronics, books, and hostel items sold by verified comrades',
    icon: RefreshCw,
    badgeText: 'Student Comrades',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } : {
    title: 'Shop Owners & Stores',
    subtitle: 'Verified campus stores, retail merchants, and local business inventory',
    icon: Store,
    badgeText: 'Verified Stores',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full text-left font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* SIMPLIFIED ENTRY UI (Second Hand / Shop Owners)               */}
      {/* ------------------------------------------------------------- */}
      {isScopedSellerSearch ? (
        <div className="space-y-6">
          {/* Header with breadcrumb and badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500">
                <Link to="/" className="hover:text-slate-900 flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </Link>
                <span>/</span>
                <span className="text-slate-900 font-bold">{scopedHeader.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                  <scopedHeader.icon className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {scopedHeader.title}
                    </h1>
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${scopedHeader.badgeColor}`}>
                      {scopedHeader.badgeText}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    {scopedHeader.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick link to unified search */}
            <Link 
              to="/search" 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 self-start sm:self-auto py-1.5 px-3 bg-indigo-50/60 rounded-full hover:bg-indigo-100/60 transition-colors"
            >
              Browse all categories <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Scoped Search Bar with Autocomplete */}
          <div ref={searchContainerRef} className="relative w-full max-w-2xl">
            <div className="w-full h-12 rounded-full bg-[#F0F1F2] hover:bg-[#EAEBED] focus-within:bg-[#EAEBED] transition-colors flex items-center px-4">
              <button
                type="button"
                onClick={() => handleSearchSubmit(query)}
                className="text-[#282828] hover:opacity-80 transition-opacity p-0.5 cursor-pointer shrink-0"
                title="Search"
                aria-label="Search"
              >
                <SearchIcon className="w-5 h-5 text-[#282828] stroke-[2.2]" />
              </button>
              <input 
                placeholder={scopedPlaceholder} 
                className="w-full bg-transparent pl-3 pr-8 text-sm font-normal text-[#282828] placeholder:text-[#282828]/85 focus:outline-none border-none ring-0 focus:ring-0 shadow-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    handleSearchSubmit('');
                  }}
                  className="text-gray-500 hover:text-gray-800 text-xs font-bold bg-gray-300/70 rounded-full h-5 w-5 flex items-center justify-center p-0 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1.5 animate-in fade-in-50 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b pb-1 mb-1">
                  <span>Suggested matches</span>
                  {isSuggesting && <span className="animate-pulse text-indigo-600">Updating...</span>}
                </div>
                {suggestions.map((sug, i) => (
                  <button
                    key={`sug-${sug.id || i}`}
                    type="button"
                    onClick={() => handleSuggestionClick(sug.suggestion)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                      <span className="font-semibold truncate text-slate-900 group-hover:text-indigo-600">{sug.suggestion}</span>
                    </div>
                    {sug.type && (
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {sug.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compact Filters Button & Collapsible Sheet */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowScopedFilters(!showScopedFilters)}
                className={`rounded-full px-4 h-9 text-xs font-bold border transition-colors flex items-center gap-2 ${
                  showScopedFilters || activeScopedFiltersCount > 0
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeScopedFiltersCount > 0 && (
                  <Badge className="ml-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0 h-4 border-none">
                    {activeScopedFiltersCount}
                  </Badge>
                )}
              </Button>

              {activeScopedFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceRange([0, 80000]);
                    setCampusFilter('all');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}

              {/* Status counter */}
              <span className="text-xs font-semibold text-slate-400 ml-auto">
                {scopedProducts.length} {scopedProducts.length === 1 ? 'item' : 'items'} available
              </span>
            </div>

            {/* Collapsed Filter Panel */}
            {showScopedFilters && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs max-w-xl animate-in fade-in-50 duration-150 space-y-4">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Filter Criteria
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScopedFilters(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Price ceiling slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Price ceiling</span>
                    <span className="font-mono text-indigo-700 font-bold">{formatPrice(priceRange[1])}</span>
                  </div>
                  <Slider 
                    defaultValue={[0, 80000]} 
                    max={80000} 
                    step={500} 
                    value={priceRange} 
                    onValueChange={(val) => setPriceRange(Array.isArray(val) ? val : [val])}
                  />
                </div>

                {/* Campus selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Campus</label>
                  <select 
                    value={campusFilter} 
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="w-full border rounded-xl bg-slate-50 h-10 px-3 text-xs font-bold outline-none text-slate-800"
                  >
                    <option value="all">All Campus Areas</option>
                    <option value="8e08c135-e6ec-4387-af3e-110b11d37c07">Kibabii University (Main)</option>
                    <option value="c0f1b4c9-7c1a-4ad1-916d-6ecee18e04bc">Moi University</option>
                    <option value="7618bc9c-7617-4d4c-9e46-ae5b9d052947">MMUST Kakamega</option>
                    <option value="2427759a-1981-45db-8eb5-31599f72e114">Kenyatta University</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results: Simple Product Grid (Products-Only Context) */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={`scoped-skel-${i}`} className="aspect-3/4 rounded-xl bg-slate-100 animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : scopedProducts.length === 0 ? (
              <div className="p-16 bg-white border border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                  <SearchIcon className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <p className="font-extrabold text-slate-900 text-base">No matching products found</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                    {query 
                      ? `We couldn't find items matching "${query}". Try searching for broader terms or adjusting your filters.` 
                      : 'No items are currently listed matching your criteria. Check back soon!'}
                  </p>
                  {(priceRange[1] < 80000 || campusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPriceRange([0, 80000]);
                        setCampusFilter('all');
                      }}
                      className="mt-4 text-xs font-bold rounded-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                {scopedProducts.map((product, idx) => (
                  <ProductCard 
                    key={`scoped-prod-${product.id || product.listing_id || 'item'}-${idx}`} 
                    product={product} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* GENERAL SEARCH (Unified Experience: All 4 Categories & Tabs)  */
        /* ------------------------------------------------------------- */
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Unified Listings Search</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Direct indexed query across products, services, events, and vacant properties.
            </p>
          </div>

          {/* Unified Search Bar with Autocomplete */}
          <div ref={searchContainerRef} className="relative w-full max-w-3xl mb-6">
            <div className="w-full h-12 rounded-full bg-[#F0F1F2] hover:bg-[#EAEBED] focus-within:bg-[#EAEBED] transition-colors flex items-center px-4">
              <button
                type="button"
                onClick={() => handleSearchSubmit(query)}
                className="text-[#282828] hover:opacity-80 transition-opacity p-0.5 cursor-pointer shrink-0"
                title="Search"
                aria-label="Search"
              >
                <SearchIcon className="w-5 h-5 text-[#282828] stroke-[2.2]" />
              </button>
              <input 
                placeholder="Search across all campus listings..." 
                className="w-full bg-transparent pl-3 pr-8 text-sm font-normal text-[#282828] placeholder:text-[#282828]/85 focus:outline-none border-none ring-0 focus:ring-0 shadow-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    handleSearchSubmit('');
                  }}
                  className="text-gray-500 hover:text-gray-800 text-xs font-bold bg-gray-300/70 rounded-full h-5 w-5 flex items-center justify-center p-0 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1.5 animate-in fade-in-50 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b pb-1 mb-1">
                  <span>Suggested matches</span>
                  {isSuggesting && <span className="animate-pulse text-indigo-600">Updating...</span>}
                </div>
                {suggestions.map((sug, i) => (
                  <button
                    key={`gen-sug-${sug.id || i}`}
                    type="button"
                    onClick={() => handleSuggestionClick(sug.suggestion)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                      <span className="font-semibold truncate text-slate-900 group-hover:text-indigo-600">{sug.suggestion}</span>
                    </div>
                    {sug.type && (
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {sug.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recents list */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Recent Searches:</span>
              {recentSearches.map((rec, i) => (
                <Badge 
                  key={`recent-${rec}-${i}`} 
                  variant="secondary" 
                  onClick={() => handleRecentClick(rec)}
                  className="px-3.5 py-1 text-xs font-bold rounded-full bg-slate-100/80 hover:bg-slate-200/50 cursor-pointer text-slate-600 transition-all border-none"
                >
                  {rec}
                </Badge>
              ))}
              <button 
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('kbumart_recent_searches');
                }} 
                className="text-[10px] font-bold text-red-500 hover:underline px-2 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex border-b text-xs pb-px gap-6 mb-8 overflow-x-auto whitespace-nowrap">
            {[
              { id: 'product', name: 'Products / Items', icon: Package },
              { id: 'accommodation', name: 'Accommodations / Hostels', icon: HomeIcon },
              { id: 'service', name: 'Cyber & Gigs', icon: Wrench },
              { id: 'lost_found', name: 'Lost & Found', icon: LostIcon },
              { id: 'event', name: 'Events & Expos', icon: Calendar }
            ].map((type) => {
              const CompIcon = type.icon;
              const active = activeType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveType(type.id as ListingType);
                    setSearchParams({ q: query, type: type.id });
                  }}
                  className={`pb-3 font-black transition-all border-b-2 -mb-px px-1 flex items-center gap-1.5 cursor-pointer ${
                    active 
                      ? 'border-indigo-600 text-indigo-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CompIcon className="w-4 h-4" />
                  {type.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Faceted Sidebar filters with Seller Registry */}
            <aside className="lg:col-span-1 space-y-6">
              <Card className="border rounded-2xl p-6 bg-white space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" /> Filter Criteria
                  </span>
                  <button 
                    onClick={() => {
                      setPriceRange([0, 80000]);
                      setAccommodationClass('all');
                      setLostFoundModeCode('all');
                      setEventDateFilter('');
                      setSellerTypeFilter('all');
                      setCampusFilter('all');
                    }} 
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Price section */}
                {(activeType === 'product' || activeType === 'accommodation' || activeType === 'service') && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Price ceiling (KES)</span>
                      <span className="font-mono text-indigo-700 font-bold">{formatPrice(priceRange[1])}</span>
                    </div>
                    <Slider 
                      defaultValue={[0, 80000]} 
                      max={80000} 
                      step={500} 
                      value={priceRange} 
                      onValueChange={(val) => setPriceRange(Array.isArray(val) ? val : [val])}
                    />
                  </div>
                )}

                {/* Seller Registry checkbox group (Kept for General Search) */}
                {activeType === 'product' && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Seller Registry</span>
                    <div className="space-y-2">
                      {[
                        { id: 'all', name: 'All Members' },
                        { id: 'student', name: 'Verified Comrades' },
                        { id: 'store', name: 'Verified Store Accounts' }
                      ].map((sl) => (
                        <label key={sl.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <Checkbox 
                            checked={sellerTypeFilter === sl.id} 
                            onCheckedChange={() => setSellerTypeFilter(sl.id as any)}
                            className="w-4.5 h-4.5 rounded"
                          />
                          {sl.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accommodation specific filter */}
                {activeType === 'accommodation' && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Property Class</span>
                    <select 
                      value={accommodationClass} 
                      onChange={(e) => setAccommodationClass(e.target.value as any)}
                      className="w-full border rounded-xl bg-slate-50 h-10 px-3 text-xs font-bold outline-none"
                    >
                      <option value="all">All Properties</option>
                      <option value="hostel">Hostel Complex</option>
                      <option value="bedsitter">Bedsitter Annex</option>
                      <option value="apartment">Full Suite / Apartment</option>
                      <option value="shared_room">Shared Comrade Room</option>
                    </select>
                  </div>
                )}

                {/* Lost and found toggle */}
                {activeType === 'lost_found' && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Lost / Found state</span>
                    <div className="flex gap-2">
                      <Button 
                        variant={lostFoundModeCode === 'lost' ? 'default' : 'outline'} 
                        onClick={() => setLostFoundModeCode('lost')}
                        className="flex-1 text-[11px] h-9 rounded-lg font-bold"
                      >
                        🎒 Lost
                      </Button>
                      <Button 
                        variant={lostFoundModeCode === 'found' ? 'default' : 'outline'} 
                        onClick={() => setLostFoundModeCode('found')}
                        className="flex-1 text-[11px] h-9 rounded-lg font-bold"
                      >
                        🟢 Found
                      </Button>
                    </div>
                  </div>
                )}

                {/* Event Specific */}
                {activeType === 'event' && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Target Event Date</span>
                    <Input 
                      type="date" 
                      className="h-10 text-xs text-slate-800"
                      value={eventDateFilter}
                      onChange={(e) => setEventDateFilter(e.target.value)}
                    />
                  </div>
                )}

                {/* Campus selector cluster */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Campus Division</span>
                  <select 
                    value={campusFilter} 
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="w-full border rounded-xl bg-slate-50 h-10 px-3 text-xs font-bold outline-none text-slate-800"
                  >
                    <option value="all">All Campus Areas</option>
                    <option value="8e08c135-e6ec-4387-af3e-110b11d37c07">Kibabii University (Main)</option>
                    <option value="c0f1b4c9-7c1a-4ad1-916d-6ecee18e04bc">Moi University</option>
                    <option value="7618bc9c-7617-4d4c-9e46-ae5b9d052947">MMUST Kakamega</option>
                    <option value="2427759a-1981-45db-8eb5-31599f72e114">Kenyatta University</option>
                  </select>
                </div>
              </Card>
            </aside>

            {/* Results Display */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={`general-skel-${i}`} className="aspect-square rounded-lg bg-slate-100 animate-pulse border border-slate-100" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="p-16 bg-white border border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <SearchIcon className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <p className="font-extrabold text-slate-900 text-base">No matching indexed items</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                      We scanned across our listings tables, but couldn't find items matching "{query || 'criteria'}". Try broadening query words.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                  {results.map((item, idx) => {
                    const itemId = item.id || item.listing_id || `item-${idx}`;
                    const spec = getListingCardDetails(item);
                    return (
                      <Card 
                        key={`result-${itemId}-${idx}`} 
                        onClick={() => handleResultClick(item)}
                        className="overflow-hidden border border-slate-100 hover:border-slate-200 transition-all rounded-lg bg-white flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 group shrink-0 cursor-pointer"
                      >
                        <div>
                          <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                            {spec.image ? (
                              <img 
                                src={spec.image} 
                                alt={item.title} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl opacity-70 select-none">
                                  {item.listing_type === 'accommodation' ? '🏠' : 
                                   item.listing_type === 'product' ? '📦' :
                                   item.listing_type === 'service' ? '🛠' :
                                   item.listing_type === 'lost_found' ? '🎒' : '📅'}
                                </span>
                              </div>
                            )}
                            {item.is_promoted && (
                              <Badge className="absolute top-1.5 left-1.5 bg-amber-500 border-none text-white font-black text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs">
                                FEATURED
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-2 sm:p-2.5 text-left space-y-1">
                            <span className="text-[8px] uppercase font-black text-indigo-600 bg-indigo-50/70 px-1.5 py-0.2 rounded inline-block">
                              {item.listing_type}
                            </span>
                            
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-slate-500 text-[10px] sm:text-[11px] line-clamp-1 leading-tight font-medium">
                                {item.description}
                              </p>
                            )}
                          </CardContent>
                        </div>

                        <div className="px-2 sm:px-2.5 pb-2 sm:pb-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="truncate pr-1">
                            {spec.price > 0 ? (
                              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 leading-tight block">{formatPrice(spec.price)}</span>
                            ) : (
                              <span className="text-[10px] font-black text-emerald-600 uppercase leading-tight block">FREE</span>
                            )}
                            <p className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5 truncate">{spec.subtitle}</p>
                          </div>

                          <Button asChild size="sm" variant="ghost" className="rounded-md h-7 px-2 text-[10px] font-bold text-indigo-600 hover:bg-slate-50 shrink-0">
                            <Link to={`/listing/${itemId}`}>
                              View <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
