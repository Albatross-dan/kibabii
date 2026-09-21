import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Heart, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWishlistStore } from '@/store/wishlistStore';
import { AUTHORITATIVE_CATEGORIES, getSubcategoriesForCategory, getCategoryBySlug } from '@/constants/categories';

// Define standard format price helper
const formatPrice = (price: any) => 
  `KSh ${Number(price).toLocaleString('en-KE')}`;

// ACCOMMODATION type options
const ACC_TYPES = [
  { key: null,          label: 'All'          },
  { key: 'bedsitter',   label: 'Bedsitters'   },
  { key: 'hostel',      label: 'Hostels'      },
  { key: 'apartment',   label: 'Apartments'   },
  { key: 'shared_room', label: 'Shared Rooms' },
];

interface CategoryListingsPageProps {
  category: any;
  onBack: () => void;
}

const fetchCategoryListings = async (category: any, sortBy = 'newest') => {
  const isSpecial = !!category.type; // accommodation/service/etc.
  
  if (isSpecial) {
    // Filter by listing_type
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, listing_type, status, created_at,
        accommodations (
          accommodation_type, price_per_month,
          bedrooms, bathrooms, distance_from_campus_km,
          availability_status,
          accommodation_images (
            image_url, is_primary, display_order
          )
        ),
        services (
          id, price
        ),
        lost_found_items (
          id, item_type, status
        ),
        events (
          id, event_date, ticket_price
        )
      `)
      .eq('listing_type', category.type)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    return { data: data ?? [], error };

  } else {
    // Filter by product category
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, listing_type, status, created_at,
        products!inner (
          id, price, original_price, is_negotiable,
          category_id, subcategory_id, seller_type, store_id,
          product_images (
            image_url, is_primary, display_order
          )
        )
      `)
      .eq('listing_type', 'product')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return { data: data ?? [], error };
  }
};

const SkeletonCard = () => (
  <div className="bg-white rounded-lg overflow-hidden border border-gray-150 shadow-xs animate-pulse flex flex-col">
    <div className="aspect-square bg-gray-200" />
    <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-2">
      <div className="space-y-1">
        <div className="h-2.5 bg-gray-200 rounded w-11/12" />
        <div className="h-2.5 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

export default function CategoryListingsPage({ category, onBack }: CategoryListingsPageProps) {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [accTypeFilter, setAccTypeFilter] = useState<string | null>(null);
  const [productSubFilter, setProductSubFilter] = useState<string | null>(null);

  const { toggleWishlist, hasItem } = useWishlistStore();

  const isSpecial = !!category.type;
  const targetCategorySlug = (category.slug || '').toLowerCase();
  const targetCategoryName = (category.name || '').toLowerCase();

  // Extract authoritative subcategories for this specific category
  const productSubcategories = useMemo(() => {
    if (isSpecial) return [];
    const subs = getSubcategoriesForCategory(category.slug || category.name || category.id);
    return subs.map(s => ({ key: s.slug, label: s.name }));
  }, [category, isSpecial]);

  useEffect(() => {
    setLoading(true);
    fetchCategoryListings(category, sortBy).then(async ({ data }) => {
      let filteredData: any[] = [];

      // Query database categories for resilient UUID-to-slug-to-name lookup
      let categoryMap = new Map<string, { id: string; name: string; slug: string }>();
      try {
        const { data: dbCats } = await supabase.from('categories').select('id, name, slug');
        if (dbCats) {
          dbCats.forEach(c => categoryMap.set(c.id, c));
        }
      } catch (catErr) {
        console.warn('Category map fetch note:', catErr);
      }

      // Filter DB data for this category
      (data || []).forEach((row: any) => {
        if (isSpecial) {
          if (row.listing_type === category.type) {
            filteredData.push(row);
          }
        } else {
          const prod = Array.isArray(row.products) ? row.products[0] : row.products;
          const catId = prod?.category_id || '';
          const matchedDbCat = categoryMap.get(catId);

          const matchesCat =
            catId === category.id || 
            catId === targetCategorySlug || 
            (matchedDbCat && (
              matchedDbCat.slug === targetCategorySlug ||
              matchedDbCat.slug.toLowerCase() === targetCategorySlug.toLowerCase() ||
              matchedDbCat.name.toLowerCase() === targetCategoryName ||
              matchedDbCat.slug.includes(targetCategorySlug) ||
              targetCategorySlug.includes(matchedDbCat.slug)
            )) ||
            catId.toLowerCase() === targetCategoryName ||
            catId.toLowerCase().includes(targetCategorySlug) ||
            targetCategorySlug.includes(catId.toLowerCase());

          if (matchesCat) {
            filteredData.push(row);
          }
        }
      });

      setListings(filteredData);
      setLoading(false);
    });
  }, [category, sortBy, targetCategorySlug, targetCategoryName, isSpecial]);

  // Client-side filtering & sorting
  const getListingPrice = (l: any) => {
    if (l.listing_type === 'product') {
      const prod = Array.isArray(l.products) ? l.products[0] : l.products;
      return prod ? Number(prod.price) : 0;
    }
    if (l.listing_type === 'accommodation') {
      const acc = Array.isArray(l.accommodations) ? l.accommodations[0] : l.accommodations;
      return acc ? Number(acc.price_per_month) : 0;
    }
    if (l.listing_type === 'service') {
      const srv = Array.isArray(l.services) ? l.services[0] : l.services;
      return srv ? Number(srv.price) : 0;
    }
    if (l.listing_type === 'event') {
      const ev = Array.isArray(l.events) ? l.events[0] : l.events;
      return ev ? Number(ev.ticket_price) : 0;
    }
    return 0;
  };

  const getDiscountPercent = (l: any) => {
    if (l.listing_type !== 'product') return 0;
    const prod = Array.isArray(l.products) ? l.products[0] : l.products;
    if (!prod) return 0;
    const price = Number(prod.price);
    const originalPrice = prod.original_price ? Number(prod.original_price) : null;
    if (originalPrice && originalPrice > price) {
      return Math.round((1 - price / originalPrice) * 100);
    }
    return 0;
  };

  const filtered = listings.filter(l => {
    // 1. Search Query
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Accommodation Type Filter
    let matchesType = true;
    if (category.type === 'accommodation' && accTypeFilter) {
      const acc = Array.isArray(l.accommodations) ? l.accommodations[0] : l.accommodations;
      matchesType = (acc?.accommodation_type === accTypeFilter) || (l.accommodation_type === accTypeFilter);
    }

    // 3. Product Subcategory Filter
    let matchesSub = true;
    if (!isSpecial && productSubFilter) {
      const prod = Array.isArray(l.products) ? l.products[0] : l.products;
      const subId = prod?.subcategory_id || l.subcategory_id || '';
      const titleLower = l.title.toLowerCase();
      const queryLower = productSubFilter.toLowerCase();
      
      matchesSub = (subId.toLowerCase() === queryLower) || 
                   (subId.toLowerCase().includes(queryLower)) ||
                   (titleLower.includes(queryLower));
    }

    return matchesSearch && matchesType && matchesSub;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'price_low') {
      return getListingPrice(a) - getListingPrice(b);
    } else if (sortBy === 'popular') {
      const discountA = getDiscountPercent(a);
      const discountB = getDiscountPercent(b);
      if (discountB !== discountA) {
        return discountB - discountA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24 font-sans select-none animate-fade-in">
      
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-800 cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">{category.icon}</span>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            {category.name}
          </h1>
        </div>
      </header>

      {/* 2. SEARCH BAR */}
      <div className="p-3 bg-white border-b border-gray-100">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text"
            placeholder={`Search in ${category.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-full bg-slate-50 pl-11 pr-10 text-sm font-semibold border border-gray-200 focus:border-[#E53E3E] focus:bg-white focus:ring-4 focus:ring-red-500/10 shadow-inner transition-all text-gray-800"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center p-0 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. SUBCATEGORY / TYPE FILTER CHIPS (Only rendered if category has subcategories) */}
      <div className="bg-white border-b border-gray-100 py-2.5 px-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-7xl mx-auto">
          
          {category.type === 'accommodation' ? (
            ACC_TYPES.map(acc => (
              <button
                key={acc.label}
                onClick={() => setAccTypeFilter(acc.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  accTypeFilter === acc.key
                    ? 'bg-[#E53E3E] text-white shadow-sm ring-2 ring-red-500/20 scale-102'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {acc.label}
              </button>
            ))
          ) : productSubcategories.length > 0 ? (
            <>
              <button
                onClick={() => setProductSubFilter(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  productSubFilter === null
                    ? 'bg-[#E53E3E] text-white shadow-sm ring-2 ring-red-500/20 scale-102'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All {category.name}
              </button>

              {productSubcategories.map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setProductSubFilter(sub.key === productSubFilter ? null : sub.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    productSubFilter === sub.key
                      ? 'bg-[#E53E3E] text-white shadow-sm ring-2 ring-red-500/20 scale-102'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </>
          ) : (
            <div className="text-xs font-bold text-gray-500 py-0.5">
              Showing all items in {category.name}
            </div>
          )}

        </div>
      </div>

      {/* 4. SORT BAR */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-black text-gray-600 uppercase tracking-wider">
          {loading ? 'Searching...' : `${sorted.length} Listings Available`}
        </span>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort options"
            className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-1"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Best Deals</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* 5. LISTINGS GRID */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl p-6 border border-gray-150 shadow-xs mt-2">
            <span className="text-4xl block mb-2 opacity-75">📦</span>
            <h3 className="text-sm font-black text-gray-800">
              No Listings Found in {category.name}
            </h3>
            <p className="text-xs font-medium text-gray-500 max-w-sm mx-auto mt-1">
              {searchQuery || productSubFilter || accTypeFilter 
                ? "Try broadening your filter chips or search keywords." 
                : `Be the first seller to list an item in ${category.name}!`}
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setProductSubFilter(null);
                setAccTypeFilter(null);
              }}
              className="mt-4 px-5 py-2 bg-[#E53E3E] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {sorted.map((item) => {
              const isWish = hasItem(item.id);
              
              // Handle image resolution
              let imgUrl = null;
              if (item.products?.product_images?.length) {
                imgUrl = item.products.product_images[0].image_url;
              } else if (item.accommodations?.accommodation_images?.length) {
                imgUrl = item.accommodations.accommodation_images[0].image_url;
              } else if (item.services?.service_images?.length) {
                imgUrl = item.services.service_images[0].image_url;
              } else if (item.lost_found_items?.lost_found_images?.length) {
                imgUrl = item.lost_found_items.lost_found_images[0].image_url;
              } else if (item.events?.event_images?.length) {
                imgUrl = item.events.event_images[0].image_url;
              }

              // Handle Price String
              let priceStr = 'KSh 0';
              let origPrice: number | null = null;
              if (item.listing_type === 'product') {
                const p = Array.isArray(item.products) ? item.products[0] : item.products;
                priceStr = formatPrice(p?.price || 0);
                origPrice = p?.original_price || null;
              } else if (item.listing_type === 'accommodation') {
                const a = Array.isArray(item.accommodations) ? item.accommodations[0] : item.accommodations;
                priceStr = `${formatPrice(a?.price_per_month || 0)}/mo`;
              } else if (item.listing_type === 'service') {
                const s = Array.isArray(item.services) ? item.services[0] : item.services;
                priceStr = `From ${formatPrice(s?.price || 0)}`;
              } else if (item.listing_type === 'event') {
                const e = Array.isArray(item.events) ? item.events[0] : item.events;
                priceStr = e?.ticket_price ? formatPrice(e.ticket_price) : 'Free';
              } else if (item.listing_type === 'lost_found') {
                priceStr = item.lost_found_items?.status === 'found' ? 'Found Item' : 'Lost Item';
              }

              const discount = getDiscountPercent(item);

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/listing/${item.id}`)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative"
                >
                  {/* Image Aspect Box */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden">
                    {imgUrl ? (
                      <img 
                        src={imgUrl} 
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl opacity-70 select-none">
                          {item.listing_type === 'accommodation' ? '🏠' : '📦'}
                        </span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#E53E3E] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                        -{discount}%
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 backdrop-blur-xs text-gray-500 hover:text-red-500 shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Heart 
                        className={`h-3.5 w-3.5 ${isWish ? 'fill-red-500 text-red-500' : 'stroke-[2.5]'}`} 
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1">
                    <div>
                      {/* Price Section */}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-black text-[#E53E3E] group-hover:text-red-600 transition-colors">
                          {priceStr}
                        </span>
                        {origPrice && origPrice > 0 && (
                          <span className="font-mono text-[9px] text-gray-400 line-through font-semibold">
                            {formatPrice(origPrice)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mt-0.5 leading-snug group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {/* Sub Info / Location */}
                    <div className="pt-1 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-bold">
                      <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                        <MapPin className="h-2.5 w-2.5 text-red-500 shrink-0" />
                        <span className="truncate">{item.location || 'Campus'}</span>
                      </span>

                      {item.listing_type === 'product' && item.products?.condition && (
                        <span className="bg-gray-100 text-gray-600 px-1 py-0.2 rounded text-[8px] uppercase">
                          {item.products.condition === 'second_hand' ? '2nd hand' : item.products.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
