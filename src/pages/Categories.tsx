import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Search,
  Heart,
  MessageCircle,
  MapPin,
  Home as HomeIcon,
  Calendar,
  Sparkles,
  Tag,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/services/listingService';
import { useWishlistStore } from '@/store/wishlistStore';
import { categoryService, CategoryNode } from '@/services/categoryService';
import { 
  getCategoryLucideIcon, 
  getCategoryBadgeColor, 
  getCategoryDescription 
} from '@/lib/categoryIcons';
import { WhatsAppListingButton } from '@/components/common/WhatsAppListingButton';

export interface CategoryItem {
  id: string;
  name: string;
  shortName?: string;
  slug: string;
  icon: any;
  categoryType: 'product' | 'accommodation' | 'service' | 'lost_found' | 'event';
  productCategoryName?: string;
  badgeColor: string;
  description: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    display_order?: number;
  }[];
}

// Campus-specific listing categories to preserve student accommodations, lost & found, and events
const CAMPUS_SPECIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'accommodation',
    name: 'Accommodation',
    shortName: 'Rooms',
    slug: 'accommodation',
    icon: HomeIcon,
    categoryType: 'accommodation',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Vacant bedsitters, campus hostels, and shared rooms listed directly by operators.',
    subcategories: []
  },
  {
    id: 'lost-found',
    name: 'Lost & Found',
    shortName: 'Lost & Found',
    slug: 'lost-found',
    icon: Search,
    categoryType: 'lost_found',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Campus lost items and found recoveries posted to help fellow comrades.',
    subcategories: []
  },
  {
    id: 'events',
    name: 'Campus Events',
    shortName: 'Events',
    slug: 'events',
    icon: Calendar,
    categoryType: 'event',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Inter-hostel sports tournaments, parties, seminars, and academic workshops.',
    subcategories: []
  }
];

export default function Categories() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleWishlist, hasItem } = useWishlistStore();

  // Dynamic category tree from Supabase
  const [categoryTree, setCategoryTree] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  // Expanded categories in sidebar
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Active Category & Subcategory
  const initialCat = searchParams.get('cat') || searchParams.get('slug') || 'books-notes';
  const initialSub = searchParams.get('sub') || 'all';

  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCat);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>(initialSub);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'newest'>('featured');
  
  // Data states for listings
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isChanging, setIsChanging] = useState<boolean>(false);

  // 1. Fetch live categories from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategoryTree() {
      setCategoriesLoading(true);
      try {
        const nodes: CategoryNode[] = await categoryService.getCategoryTree();
        
        // Transform Supabase category nodes to CategoryItem
        const transformed: CategoryItem[] = nodes.map((node) => ({
          id: node.id,
          name: node.name,
          shortName: node.name,
          slug: node.slug,
          icon: getCategoryLucideIcon(node.icon, node.slug),
          categoryType: node.slug === 'services' ? 'service' : 'product',
          productCategoryName: node.name,
          badgeColor: getCategoryBadgeColor(node.slug),
          description: getCategoryDescription(node.slug, node.name),
          subcategories: (node.subcategories || []).map((sub) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            display_order: sub.display_order
          }))
        }));

        // Append campus-specific listing types (Accommodation, Lost & Found, Events)
        const combined = [...transformed, ...CAMPUS_SPECIAL_CATEGORIES];

        if (isMounted) {
          setCategoryTree(combined);

          // Find current active category
          const found = combined.find(c => c.id === initialCat || c.slug === initialCat);
          const currentId = found ? (found.slug || found.id) : (combined[0]?.slug || 'books-notes');
          setActiveCategoryId(currentId);

          // If the category has subcategories, auto-expand it
          if (found && found.subcategories.length > 0) {
            setExpandedCategories(prev => new Set([...prev, found.id, found.slug]));
          }
        }
      } catch (err) {
        console.warn('Error loading dynamic category tree:', err);
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    }
    loadCategoryTree();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize with URL searchParams if they change
  useEffect(() => {
    const slugParam = searchParams.get('slug') || searchParams.get('cat');
    const subParam = searchParams.get('sub') || 'all';

    if (slugParam && slugParam !== activeCategoryId) {
      setActiveCategoryId(slugParam);
      // Auto expand in sidebar
      setExpandedCategories(prev => new Set([...prev, slugParam]));
    }
    if (subParam !== activeSubcategoryId) {
      setActiveSubcategoryId(subParam);
    }
  }, [searchParams]);

  // Determine current active CategoryItem
  const activeCategory = useMemo(() => {
    if (categoryTree.length === 0) {
      return {
        id: 'books-notes',
        name: 'Books & Notes',
        slug: 'books-notes',
        icon: Package,
        categoryType: 'product' as const,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Course textbooks and academic reference guides.',
        subcategories: []
      };
    }
    const target = (activeCategoryId || '').toLowerCase().trim();
    return (
      categoryTree.find(c => 
        c.id.toLowerCase() === target || 
        c.slug.toLowerCase() === target || 
        c.name.toLowerCase() === target
      ) ||
      categoryTree[0]
    );
  }, [categoryTree, activeCategoryId]);

  // Load all active items from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const { data: dbListings, error: queryErr } = await supabase
          .from('listings')
          .select(`
            id, title, description, listing_type, status, created_at,
            products (
              id, price, original_price, condition_id, category_id, subcategory_id, seller_type, store_id,
              product_images (image_url, is_primary)
            ),
            accommodations (
              id, accommodation_type, price_per_month, distance_from_campus_km,
              accommodation_images (image_url, is_primary)
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
          .eq('status', 'active');

        if (queryErr) {
          console.error('Failed to fetch listings in Categories.tsx:', queryErr);
        }

        const transformedDb: Listing[] = (dbListings || []).map((row: any) => {
          const prod = Array.isArray(row.products) ? row.products[0] : row.products;
          const acc = Array.isArray(row.accommodations) ? row.accommodations[0] : row.accommodations;
          const svc = Array.isArray(row.services) ? row.services[0] : row.services;
          const lf = Array.isArray(row.lost_found_items) ? row.lost_found_items[0] : row.lost_found_items;
          const evt = Array.isArray(row.events) ? row.events[0] : row.events;

          let images: string[] = [];
          if (prod?.product_images?.length) {
            images = prod.product_images.map((img: any) => img.image_url);
          } else if (acc?.accommodation_images?.length) {
            images = acc.accommodation_images.map((img: any) => img.image_url);
          } else if (svc?.service_images?.length) {
            images = svc.service_images.map((img: any) => img.image_url);
          }

          return {
            id: row.id,
            owner_id: 'comrade-seller',
            listing_type: row.listing_type,
            status: row.status,
            title: row.title,
            description: row.description || '',
            location: 'Kibabii Campus',
            views_count: 0,
            favorites_count: 0,
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.created_at || new Date().toISOString(),
            images: images.length ? images : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'],
            product_price: prod?.price,
            product_condition: 'Good',
            product_category: prod?.category_id || '',
            product_subcategory: prod?.subcategory_id || '',
            seller_type: prod?.seller_type || 'student',
            store_id: prod?.store_id || null,
            accommodation_rent: acc?.price_per_month,
            accommodation_type: acc?.accommodation_type,
            accommodation_distance: acc?.distance_from_campus_km ? `${acc.distance_from_campus_km} km` : 'Near Gate A',
            service_starting_price: svc?.price,
            lost_found_mode: lf?.status === 'found' ? 'found' : 'lost',
            event_ticket_price: evt?.ticket_price,
            event_venue: 'Campus Grounds'
          };
        });

        if (isMounted) {
          setAllListings(transformedDb);
        }
      } catch (err) {
        console.warn('Error loading category listings:', err);
        if (isMounted) {
          setAllListings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Category switch with smooth transition
  const handleSelectCategory = (cat: CategoryItem) => {
    const catIdentifier = cat.slug || cat.id;
    if (catIdentifier === activeCategoryId && activeSubcategoryId === 'all') {
      // Toggle expand if it has subcategories
      if (cat.subcategories.length > 0) {
        toggleCategoryExpansion(catIdentifier);
      }
      return;
    }

    setIsChanging(true);
    setActiveSubcategoryId('all');
    setSearchQuery('');
    setSearchParams({ slug: catIdentifier });
    
    // Expand category if it has subcategories
    if (cat.subcategories.length > 0) {
      setExpandedCategories(prev => new Set([...prev, cat.id, cat.slug]));
    }

    setTimeout(() => {
      setActiveCategoryId(catIdentifier);
      setIsChanging(false);
    }, 150);
  };

  // Subcategory select
  const handleSelectSubcategory = (e: React.MouseEvent, parentCat: CategoryItem, subIdOrSlug: string) => {
    e.stopPropagation();
    const parentIdentifier = parentCat.slug || parentCat.id;

    if (activeCategoryId !== parentIdentifier) {
      setIsChanging(true);
      setActiveCategoryId(parentIdentifier);
      setTimeout(() => setIsChanging(false), 150);
    }

    setActiveSubcategoryId(subIdOrSlug);
    setSearchQuery('');
    setSearchParams({ slug: parentIdentifier, sub: subIdOrSlug });
  };

  // Toggle expand / collapse of a category's subcategories
  const toggleCategoryExpansion = (catIdentifier: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catIdentifier)) {
        next.delete(catIdentifier);
      } else {
        next.add(catIdentifier);
      }
      return next;
    });
  };

  // Check if an item matches a category and optional subcategory
  const isItemMatch = (item: Listing, cat: CategoryItem, subIdOrSlug: string = 'all'): boolean => {
    if (item.status !== 'active') return false;

    if (cat.categoryType === 'product') {
      if (item.listing_type !== 'product') return false;

      const itemCat = (item.product_category || '').toLowerCase();
      const itemSub = (item.product_subcategory || '').toLowerCase();
      const targetId = (cat.id || '').toLowerCase();
      const targetSlug = (cat.slug || '').toLowerCase();
      const targetName = (cat.name || '').toLowerCase();

      // Check parent category match: UUID, slug, name, or if subcategory belongs to this parent
      const matchesParent = 
        itemCat === targetId ||
        itemCat === targetSlug ||
        itemCat === targetName ||
        (cat.subcategories && cat.subcategories.some(s => 
          s.id.toLowerCase() === itemSub || 
          s.slug.toLowerCase() === itemSub ||
          s.id.toLowerCase() === itemCat ||
          s.slug.toLowerCase() === itemCat
        ));

      if (!matchesParent) return false;

      // If a specific subcategory is selected:
      if (subIdOrSlug && subIdOrSlug !== 'all') {
        const targetSub = cat.subcategories.find(
          s => s.id === subIdOrSlug || s.slug === subIdOrSlug
        );
        if (!targetSub) return false;

        const subId = targetSub.id.toLowerCase();
        const subSlug = targetSub.slug.toLowerCase();
        const subName = targetSub.name.toLowerCase();

        return (
          itemSub === subId ||
          itemSub === subSlug ||
          itemSub === subName ||
          item.title.toLowerCase().includes(subName) ||
          (item.description && item.description.toLowerCase().includes(subName))
        );
      }

      return true;
    } else if (cat.categoryType === 'service') {
      return item.listing_type === 'service' || item.product_category === cat.id || item.product_category === cat.slug;
    } else {
      return item.listing_type === cat.categoryType;
    }
  };

  // Filter listings strictly for the active category
  const categoryItems = useMemo(() => {
    return allListings.filter(l => isItemMatch(l, activeCategory, activeSubcategoryId));
  }, [allListings, activeCategory, activeSubcategoryId]);

  // Apply search query and sorting
  const displayItems = useMemo(() => {
    let items = [...categoryItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'price_low') {
      items.sort((a, b) => {
        const priceA = a.product_price ?? a.accommodation_rent ?? a.service_starting_price ?? a.event_ticket_price ?? 0;
        const priceB = b.product_price ?? b.accommodation_rent ?? b.service_starting_price ?? b.event_ticket_price ?? 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_high') {
      items.sort((a, b) => {
        const priceA = a.product_price ?? a.accommodation_rent ?? a.service_starting_price ?? a.event_ticket_price ?? 0;
        const priceB = b.product_price ?? b.accommodation_rent ?? b.service_starting_price ?? b.event_ticket_price ?? 0;
        return priceB - priceA;
      });
    } else if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return items;
  }, [categoryItems, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 font-sans">
      
      {/* HEADER HERO BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <SlidersHorizontal size={18} strokeWidth={2.5} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Marketplace Categories
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse verified campus items across live categories & student services.
          </p>
        </div>

        {/* Action Button: Post listing in current category */}
        <Button
          onClick={() => navigate(`/dashboard/listings/new?type=${activeCategory.categoryType}&cat=${activeCategory.slug}`)}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs shadow-sm h-9 px-4 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          Sell / Post Listing
        </Button>
      </div>

      {/* DUAL-PANEL LAYOUT CONTAINER */}
      <div className="flex bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[580px] h-[calc(100vh-170px)]">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-[110px] sm:w-[250px] md:w-[280px] flex-shrink-0 bg-slate-50/80 border-r border-gray-100 overflow-y-auto scrollbar-none py-2 selection:bg-transparent">
          <div className="px-1.5 sm:px-3 space-y-1">
            <div className="hidden sm:flex items-center justify-between px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <span>All Categories</span>
              <span>({categoryTree.length})</span>
            </div>

            {categoriesLoading ? (
              // Loading Skeleton for Categories
              <div className="space-y-2 p-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-200/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              categoryTree.map((cat) => {
                const IconComp = cat.icon;
                const isActive = cat.id === activeCategoryId || cat.slug === activeCategoryId;
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                const isExpanded = expandedCategories.has(cat.id) || expandedCategories.has(cat.slug);

                // Parent category item count
                const parentCount = allListings.filter(l => isItemMatch(l, cat, 'all')).length;

                return (
                  <div key={cat.id || cat.slug} className="space-y-0.5">
                    {/* Top Level Category Button */}
                    <button
                      id={`cat-nav-${cat.slug || cat.id}`}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 text-center sm:text-left rounded-xl sm:rounded-2xl transition-all duration-150 relative group cursor-pointer ${
                        isActive 
                          ? 'bg-white shadow-sm text-primary font-black border-l-4 border-l-primary sm:border-l-0' 
                          : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeSidePill"
                          className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r-full hidden sm:block"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}

                      <div className={`p-1.5 sm:p-2 rounded-xl transition-transform ${
                        isActive 
                          ? 'bg-primary text-white scale-105 shadow-sm' 
                          : 'bg-white border border-gray-200/60 text-gray-500 group-hover:scale-105 group-hover:text-slate-800'
                      }`}>
                        <IconComp size={16} strokeWidth={isActive ? 2.5 : 2} className="sm:w-[17px] sm:h-[17px]" />
                      </div>

                      <div className="flex-1 min-w-0 text-left hidden sm:block">
                        <div className="text-[13px] leading-tight truncate">
                          {cat.name}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {parentCount} {parentCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <span className="text-[10px] leading-tight block sm:hidden truncate max-w-full">
                        {cat.shortName || cat.name}
                      </span>

                      {/* Expand / Collapse Chevron for categories with subcategories */}
                      {hasSubs ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryExpansion(cat.slug || cat.id);
                          }}
                          className={`ml-auto p-1 rounded hover:bg-slate-200/60 hidden sm:block transition-transform ${
                            isExpanded ? 'text-primary' : 'text-gray-400'
                          }`}
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} strokeWidth={2.5} />
                          ) : (
                            <ChevronRight size={14} strokeWidth={2} />
                          )}
                        </div>
                      ) : (
                        <ChevronRight 
                          size={14} 
                          className={`ml-auto hidden sm:block transition-transform ${
                            isActive ? 'text-primary translate-x-0.5' : 'text-gray-300 opacity-0 group-hover:opacity-100'
                          }`} 
                        />
                      )}
                    </button>

                    {/* Subcategories (Expanded view with clean tree indentation) */}
                    {hasSubs && isExpanded && (
                      <div className="ml-2 sm:ml-5 pl-2 sm:pl-3 border-l-2 border-primary/20 space-y-0.5 py-0.5">
                        {cat.subcategories.map((sub) => {
                          const isSubActive = isActive && (activeSubcategoryId === sub.id || activeSubcategoryId === sub.slug);
                          const subCount = allListings.filter(l => isItemMatch(l, cat, sub.id || sub.slug)).length;

                          return (
                            <button
                              key={sub.id || sub.slug}
                              id={`sub-nav-${sub.slug}`}
                              onClick={(e) => handleSelectSubcategory(e, cat, sub.id || sub.slug)}
                              className={`w-full flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isSubActive
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                              }`}
                            >
                              <span className="truncate pr-1">
                                {sub.name}
                              </span>
                              <span className={`text-[9px] font-mono px-1 rounded ${
                                isSubActive ? 'bg-primary/20 text-primary' : 'text-gray-400'
                              }`}>
                                {subCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT MAIN LISTINGS PANEL */}
        <main className="flex-1 bg-white overflow-y-auto flex flex-col p-3 sm:p-5 lg:p-6">
          
          <AnimatePresence mode="wait">
            {isChanging ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="space-y-4 flex-1"
              >
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-1/3" />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory.id || activeCategory.slug}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                {/* 1. CATEGORY BANNER HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-gray-100 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {activeCategory.name}
                      </h2>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${activeCategory.badgeColor}`}>
                        {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeCategory.description}
                    </p>
                  </div>

                  {/* In-category Search & Sort controls */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-56">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${activeCategory.name.toLowerCase()}...`}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      aria-label="Sort listings by"
                      className="py-1.5 px-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option value="featured">Featured</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>

                {/* 2. SUBCATEGORY FILTER CHIPS (Dynamic from category.subcategories) */}
                {activeCategory.subcategories && activeCategory.subcategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 shrink-0">
                    {/* 'All' Chip */}
                    <button
                      onClick={() => {
                        setActiveSubcategoryId('all');
                        setSearchParams({ slug: activeCategory.slug });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        activeSubcategoryId === 'all'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-gray-200/80 hover:bg-slate-100'
                      }`}
                    >
                      All {activeCategory.name}
                    </button>

                    {/* Individual Subcategory Chips */}
                    {activeCategory.subcategories.map((sub) => {
                      const isSelected = activeSubcategoryId === sub.id || activeSubcategoryId === sub.slug;
                      return (
                        <button
                          key={sub.id || sub.slug}
                          onClick={() => {
                            setActiveSubcategoryId(sub.id || sub.slug);
                            setSearchParams({ slug: activeCategory.slug, sub: sub.slug || sub.id });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-gray-200/80 hover:bg-slate-100'
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. ITEMS GRID */}
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 flex-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="aspect-square bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : displayItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                    <span className="text-4xl mb-2 opacity-75">🔍</span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      No items found in {activeCategory.name}
                      {activeSubcategoryId !== 'all' && (
                        <span className="text-primary block mt-0.5 font-bold">
                          {activeCategory.subcategories.find(s => s.id === activeSubcategoryId || s.slug === activeSubcategoryId)?.name}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      {searchQuery || activeSubcategoryId !== 'all'
                        ? 'Try clearing your search or switching to "All" above.'
                        : `Be the first comrade to post an item in ${activeCategory.name}!`}
                    </p>
                    {(searchQuery || activeSubcategoryId !== 'all') ? (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActiveSubcategoryId('all');
                          setSearchParams({ slug: activeCategory.slug });
                        }}
                        className="mt-4 px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-black cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <Button
                        onClick={() => navigate(`/dashboard/listings/new?type=${activeCategory.categoryType}&cat=${activeCategory.slug}`)}
                        className="mt-4 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        + Post First {activeCategory.name} Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 flex-1 content-start">
                    {displayItems.map((item) => {
                      const isWishlisted = hasItem(item.id);
                      const imageUrl = (item.images && item.images.length > 0)
                        ? item.images[0]
                        : null;
                      
                      let priceDisplay = 'KSh 0';
                      if (item.product_price !== undefined) {
                        priceDisplay = `KSh ${Number(item.product_price).toLocaleString('en-KE')}`;
                      } else if (item.accommodation_rent !== undefined) {
                        priceDisplay = `KSh ${Number(item.accommodation_rent).toLocaleString('en-KE')}/mo`;
                      } else if (item.service_starting_price !== undefined) {
                        priceDisplay = `From KSh ${Number(item.service_starting_price).toLocaleString('en-KE')}`;
                      } else if (item.event_ticket_price !== undefined) {
                        priceDisplay = item.event_ticket_price === 0 ? 'Free' : `KSh ${Number(item.event_ticket_price).toLocaleString('en-KE')}`;
                      } else if (item.listing_type === 'lost_found') {
                        priceDisplay = item.lost_found_mode === 'found' ? 'Found Item' : 'Lost Item';
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/listing/${item.id}`)}
                          className="bg-white rounded-lg border border-gray-150 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer overflow-hidden relative"
                        >
                          <div className="aspect-square bg-slate-50 relative overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl opacity-70 select-none">
                                  {item.listing_type === 'accommodation' ? '🏠' : '📦'}
                                </span>
                              </div>
                            )}

                            {item.is_promoted && (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 text-white font-black text-[8px] sm:text-[9px] uppercase tracking-wider rounded shadow-xs">
                                Featured
                              </span>
                            )}

                            {item.product_condition && (
                              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white font-bold text-[8px] rounded uppercase">
                                {item.product_condition === 'second_hand' ? '2nd hand' : item.product_condition}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(item.id);
                              }}
                              className={`absolute top-1.5 right-1.5 p-1 rounded-md backdrop-blur-xs transition-all cursor-pointer ${
                                isWishlisted 
                                  ? 'bg-rose-500 text-white shadow-xs' 
                                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
                              }`}
                              title="Wishlist"
                              aria-label="Wishlist toggle"
                            >
                              <Heart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>
                          </div>

                          <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1">
                            <div>
                              <div className="flex items-baseline gap-1 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm font-black text-slate-900 group-hover:text-primary transition-colors">
                                  {priceDisplay}
                                </span>
                                {item.flash_sale_original_price && (
                                  <span className="font-mono text-[9px] text-gray-400 line-through">
                                    KSh {Number(item.flash_sale_original_price).toLocaleString('en-KE')}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mt-0.5 group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                            </div>

                            <div className="pt-1 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-500">
                              <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                                <MapPin size={10} className="text-primary shrink-0" />
                                <span className="truncate">{item.location || 'Campus'}</span>
                              </span>

                              <WhatsAppListingButton
                                listingId={item.id}
                                title={item.title}
                                variant="icon"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

    </div>
  );
}
