import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  BadgeAlert, 
  Star, 
  GraduationCap, 
  Building, 
  Loader2, 
  Check, 
  Clock, 
  MapPin, 
  ArrowRight,
  RefreshCw, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Settings, 
  Trash2, 
  Image as ImageIcon, 
  FileText,
  Lock,
  MessageCircle,
  LogOut,
  Sliders,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShoppingBag,
  Wrench,
  TrendingUp,
  Award,
  CircleAlert,
  HelpCircle,
  SlidersHorizontal,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore, UserProfile } from '@/store/authStore';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { storeService } from '@/services/storeService';
import { reviewService } from '@/services/reviewService';

// Compact Modular Imports
import StatsPanel, { DashboardMetrics } from '@/components/profile/StatsPanel';
import MyMarketplacePanel from '@/components/profile/MyMarketplacePanel';
import FollowedStoresPanel from '@/components/profile/FollowedStoresPanel';
import BadgesPanel from '@/components/profile/BadgesPanel';
import SellerCenterPanel from '@/components/profile/SellerCenterPanel';
import StoreManagementPanel from '@/components/profile/StoreManagementPanel';
import { AccommodationManager, ServicesManager, EventsManager } from '@/components/profile/FeaturesAndManagers';
import SettingsPanel from '@/components/profile/SettingsPanel';
import SupportPanel from '@/components/profile/SupportPanel';
import AdminPanel from '@/components/profile/AdminPanel';
import DashboardSidebar, { AccountMenuButton, getDashboardSections } from '@/components/profile/DashboardSidebar';
import StoreCreationModal from '@/components/store/StoreCreationModal';
import AccountDetailsDropdowns from '@/components/profile/AccountDetailsDropdowns';

// Traditional imports or utilities inside
import AccountBadge from '@/components/products/AccountBadge';

export default function Profile() {
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    setProfile,
    logoutUser,
    isAdmin
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Real database role and store ownership state
  const [realUserRoles, setRealUserRoles] = useState<string[]>([]);
  const [userStore, setUserStore] = useState<any>(null);
  const [hasStoreRow, setHasStoreRow] = useState<boolean>(false);
  const [dbCampusName, setDbCampusName] = useState<string | null>(null);
  const [subscriptionPlanName, setSubscriptionPlanName] = useState<string | null>(null);
  const [storeFollowersCount, setStoreFollowersCount] = useState<number>(0);
  const [isShopOwner, setIsShopOwner] = useState<boolean>(false);
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(true);
  const [realAuthUser, setRealAuthUser] = useState<any>(null);
  const [realReviews, setRealReviews] = useState<{ rating: number; count: number }>({ rating: 0, count: 0 });
  const [realMetrics, setRealMetrics] = useState<Partial<DashboardMetrics>>({
    listingsPosted: profile?.products_listed || 0,
    productsSold: profile?.products_sold || 0,
  });

  const fetchRealRolesAndStore = async () => {
    try {
      // Get the real authenticated user from Supabase session directly
      let authUser: any = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authUser = sessionData?.session?.user || null;
      } catch (sessErr) {
        console.warn('Session retrieval notice:', sessErr);
      }

      if (!authUser) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          authUser = userData?.user || null;
        } catch (uErr) {
          console.warn('User retrieval notice:', uErr);
        }
      }

      const currentUserId = authUser?.id || user?.id;
      setRealAuthUser(authUser);

      if (!currentUserId) {
        setIsRolesLoading(false);
        return;
      }

      // 1. Fetch real profile directly from profiles table via auth.uid()
      // Pull exactly: full_name, username, phone, whatsapp_number, campus_id, account_type, is_verified, seller_rating, seller_rating_count, created_at
      let profileRow: any = null;
      try {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, phone, whatsapp_number, campus_id, account_type, role, is_verified, seller_rating, seller_rating_count, created_at, is_top_seller, student_verification_status, store_verification_status')
          .eq('id', currentUserId)
          .maybeSingle();

        if (profData) {
          profileRow = profData;
        } else if (profErr) {
          console.warn('Profiles query notice:', profErr);
        }
      } catch (profErr) {
        console.warn('Profile fetch notice:', profErr);
      }

      const activeProfile = profileRow || profile;
      const accountType = activeProfile?.account_type || 'student';
      const isStoreAccount = accountType === 'store';

      // 2. Fetch campus display by joining campus_id to campuses.name
      let resolvedCampusName: string | null = null;
      if (activeProfile?.campus_id) {
        try {
          const { data: campusRow } = await supabase
            .from('campuses')
            .select('name')
            .eq('id', activeProfile.campus_id)
            .maybeSingle();
          if (campusRow?.name) {
            resolvedCampusName = campusRow.name;
          }
        } catch (campErr) {
          console.warn('Campus lookup notice:', campErr);
        }
      }
      setDbCampusName(resolvedCampusName);

      // 3. Seller rating & reviews from seller_rating + seller_rating_count specifically
      const sRating = Number(activeProfile?.seller_rating ?? 0);
      const sRatingCount = Number(activeProfile?.seller_rating_count ?? 0);
      setRealReviews({
        rating: sRating,
        count: sRatingCount
      });

      // 4. Count listings across actual tables
      let accurateListingCount = profile?.products_listed || 0;
      let accurateSoldCount = profile?.products_sold || 0;
      try {
        const [products, services, accommodations, events, lostFound, listingsRes, soldProducts, soldListings] =
          await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', currentUserId),
            supabase.from('services').select('id', { count: 'exact', head: true }).eq('provider_id', currentUserId),
            supabase.from('accommodations').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId),
            supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', currentUserId),
            supabase.from('lost_found_items').select('id', { count: 'exact', head: true }).eq('posted_by', currentUserId),
            supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', currentUserId).eq('status', 'sold'),
            supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId).eq('status', 'sold'),
          ]);

        const totalSubListings = [products, services, accommodations, events, lostFound]
          .reduce((sum, r) => sum + (r.count || 0), 0);
        accurateListingCount = Math.max(totalSubListings, listingsRes?.count || 0);
        accurateSoldCount = Math.max(soldProducts?.count || 0, soldListings?.count || 0);

        setRealMetrics(prev => ({
          ...prev,
          listingsPosted: accurateListingCount,
          productsSold: accurateSoldCount
        }));
      } catch (countErr) {
        console.warn('Listing counts fetch notice:', countErr);
      }

      // 5. Stores table query (only if account_type === 'store', matched on owner_id = auth.uid())
      let activeStore: any = null;
      let realFollowersCount = 0;
      let resolvedPlanName: string | null = null;

      if (isStoreAccount) {
        try {
          const { data: storeRows, error: storeError } = await supabase
            .from('stores')
            .select('id, owner_id, name, store_name, category, location, description, banner_url, follower_count, verification_status, is_verified, subscription_plan')
            .eq('owner_id', currentUserId)
            .order('created_at', { ascending: false });

          if (storeError) {
            console.warn('stores query notice:', storeError);
          }

          activeStore = storeRows && storeRows.length > 0 ? storeRows[0] : null;

          if (activeStore) {
            // Pull follower count from store_followers count
            try {
              const { count: followersCount } = await supabase
                .from('store_followers')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', activeStore.id);
              realFollowersCount = followersCount ?? activeStore.follower_count ?? 0;
            } catch (fErr) {
              realFollowersCount = activeStore.follower_count ?? 0;
            }

            // Pull actual assigned plan from store_subscriptions -> subscription_plans
            try {
              const { data: subData } = await supabase
                .from('store_subscriptions')
                .select('plan_id, status')
                .eq('store_id', activeStore.id)
                .maybeSingle();

              if (subData?.plan_id) {
                const { data: planData } = await supabase
                  .from('subscription_plans')
                  .select('display_name, plan_name')
                  .eq('id', subData.plan_id)
                  .maybeSingle();
                if (planData) {
                  resolvedPlanName = planData.display_name || planData.plan_name;
                }
              }

              // Fallback to activeStore.subscription_plan if store_subscriptions has no plan record
              if (!resolvedPlanName && activeStore.subscription_plan) {
                const { data: planByName } = await supabase
                  .from('subscription_plans')
                  .select('display_name, plan_name')
                  .ilike('plan_name', activeStore.subscription_plan)
                  .maybeSingle();
                resolvedPlanName = planByName?.display_name || activeStore.subscription_plan;
              }
            } catch (subErr) {
              console.warn('Store subscription fetch notice:', subErr);
            }
          }
        } catch (sErr) {
          console.warn('Stores fetch notice:', sErr);
        }
      }

      setUserStore(activeStore);
      setHasStoreRow(Boolean(activeStore));
      setStoreFollowersCount(realFollowersCount);
      setSubscriptionPlanName(resolvedPlanName);
      setIsShopOwner(isStoreAccount && Boolean(activeStore));

      // 6. User roles table
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUserId);
        const roleList = roles?.map(r => r.role) || [];
        setRealUserRoles(roleList);
      } catch (rolesErr) {
        console.warn('User roles fetch notice:', rolesErr);
      }

      // Synchronize profile state with real live data from profiles table
      if (profile && activeProfile) {
        if (setProfile) {
          setProfile({
            ...profile,
            full_name: activeProfile.full_name ?? profile.full_name,
            username: activeProfile.username ?? profile.username,
            phone: activeProfile.phone ?? null,
            whatsapp_number: activeProfile.whatsapp_number ?? null,
            campus_id: activeProfile.campus_id ?? null,
            campus: resolvedCampusName,
            account_type: accountType,
            is_verified: Boolean(activeProfile.is_verified),
            seller_rating: sRating,
            seller_rating_count: sRatingCount,
            products_listed: accurateListingCount,
            products_sold: accurateSoldCount,
            role: isStoreAccount && Boolean(activeStore) ? 'shop_owner' : (activeProfile.role || profile.role),
            is_store: isStoreAccount && Boolean(activeStore),
            store_name: activeStore?.name || activeStore?.store_name || null
          });
        }
      }
    } catch (err) {
      console.warn('Notice checking user roles & store:', err);
    } finally {
      setIsRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchRealRolesAndStore();
  }, [user?.id]);

  // Visibility flags for sections 8, 9, 10
  const [showAccommodation, setShowAccommodation] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Collapsible section states (Record mapping section id to true if collapsed)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'account-stats': true,
    'my-marketplace': true,
    'followed-stores': true,
    'verification-badges': true,
    'seller-center': true,
    'store-management': true,
    'accommodation-management': true,
    'services-management': true,
    'events-management': true,
    'settings': true,
    'help-support': true,
    'administration': true
  });

  // Wishlist local list mirror
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  const handleRemoveWishlist = (id: string) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
    toast.info('Item removed from wishlist.');
  };

  const handleToggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    Object.keys(collapsedSections).forEach(key => {
      allExpanded[key] = false;
    });
    setCollapsedSections(allExpanded);
    toast.info('All vertical sections expanded!');
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    Object.keys(collapsedSections).forEach(key => {
      allCollapsed[key] = true;
    });
    setCollapsedSections(allCollapsed);
    toast.info('All vertical sections collapsed!');
  };

  const handleLogoutAction = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    logoutUser();
    setShowLogoutModal(false);
    toast.success('Logged out successfully.');
    navigate('/auth/login');
  };

  // Login Gate if user is not authenticated inside workspace
  if (!user || !profile) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-4xl text-center font-sans">
        <Card className="rounded-3xl border border-slate-100 p-8 py-16 flex flex-col items-center space-y-6 bg-white shadow-xl">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl animate-bounce">
            🛍️
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-secondary">Sign In to See Your Profile</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unlock your verified student badge, follow order statistics, set up store details, and build peer trust.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-primary/20">
              <Link to="/auth/login">Login Now</Link>
            </Button>
            <Button asChild variant="outline" className="font-bold rounded-xl px-8 h-12">
              <Link to="/auth/signup">Create Account</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isStudent = profile.account_type !== 'store';
  const isStore = profile.account_type === 'store';

  const badgeLabel = isStore
    ? 'STORE ACCOUNT'
    : 'STUDENT ACCOUNT';

  const visibleDashboardSections = getDashboardSections({
    isStore: isStore && hasStoreRow,
    isAdmin,
    showAccommodation,
    showServices,
    showEvents
  }).filter(sec => sec.show);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl font-sans relative selection:bg-primary/20">
      
      {/* Vertical Header & Collapse Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Unified Account Dashboard</h2>
          <p className="text-xs text-muted-foreground font-semibold">Your personal, high-contrast control center for Kibu Market transactions.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <AccountMenuButton onClick={() => setIsNavMenuOpen(true)} />
          <Button size="xs" variant="outline" onClick={handleExpandAll} className="text-[11px] font-bold h-8 rounded-lg">
            Expand All Sections
          </Button>
          <Button size="xs" variant="outline" onClick={handleCollapseAll} className="text-[11px] font-bold h-8 rounded-lg">
            Collapse All
          </Button>
        </div>
      </div>

      {/* Dual Content Grid Layout with Sidebar Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left column: Sticky Navigation Sidebar Tracker (Visible on Desktop) */}
        <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-[80px]">
          <DashboardSidebar 
            isStore={isStore && hasStoreRow}
            isAdmin={isAdmin}
            showAccommodation={showAccommodation}
            showServices={showServices}
            showEvents={showEvents}
            onLogoutClick={() => setShowLogoutModal(true)}
            isMenuOpen={isNavMenuOpen}
            setIsMenuOpen={setIsNavMenuOpen}
          />
        </div>

        {/* Right column: Vertical Stacked sections of unified dashboard */}
        <div className="lg:col-span-3 space-y-6">

          {/* Mobile Quick Jump Bar (Compact menu button replacing the tall static card on phones) */}
          <div className="lg:hidden p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-tight">Control Center</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{visibleDashboardSections.length} Dashboard Sections</span>
              </div>
            </div>
            <AccountMenuButton onClick={() => setIsNavMenuOpen(true)} />
          </div>

          {/* ======================= SECTION 1: PROFILE HEADER ======================= */}
          <section id="profile-header" className="scroll-mt-6">
            <div className="relative rounded-3xl overflow-hidden border bg-white shadow-sm hover:shadow transition-shadow">
              
              {/* Cover Banner Image */}
              <div 
                className="h-44 sm:h-52 w-full relative" 
                style={{ 
                  background: (isStore && hasStoreRow && (userStore?.banner_url || profile.store_banner_image)) 
                    ? undefined 
                    : 'linear-gradient(135deg, #1e1b4b, #311042)' 
                }}
              >
                {(isStore && hasStoreRow && (userStore?.banner_url || profile.store_banner_image)) && (
                  <img 
                    src={userStore?.banner_url || profile.store_banner_image} 
                    className="w-full h-full object-cover opacity-80 absolute inset-0" 
                    alt="Dashboard Banner" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                
                {/* Primary Account Type Badge on top right of banner */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  {isStore ? (
                    hasStoreRow ? (
                      <div 
                        id="profile-header-account-type-badge"
                        className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 backdrop-blur-md border bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-black/20"
                      >
                        <StoreIcon className="h-4 w-4 stroke-[2.5]" />
                        <span>STORE ACCOUNT</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsStoreModalOpen(true)}
                        className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 backdrop-blur-md bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 ring-2 ring-black/20 transition-all cursor-pointer"
                      >
                        <span>Complete Store Setup</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )
                  ) : (
                    <div 
                      id="profile-header-account-type-badge"
                      className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 backdrop-blur-md border bg-blue-600 text-white border-blue-400 ring-2 ring-black/20"
                    >
                      <GraduationCap className="h-4 w-4 stroke-[2.5]" />
                      <span>STUDENT ACCOUNT</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar picture and descriptors Overlay row */}
              <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 sm:-mt-14 text-left z-10">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-white bg-white shadow overflow-hidden shrink-0">
                  <img 
                    src={profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=KibuUser'} 
                    className="h-full w-full object-cover" 
                    alt={profile.full_name || 'Profile'} 
                  />
                </div>

                <div className="flex-1 space-y-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                      {isStore && hasStoreRow 
                        ? (userStore?.name || userStore?.store_name || profile.full_name || 'My Store') 
                        : (profile.full_name || 'Student Account')}
                    </h1>
                    {isStore ? (
                      hasStoreRow ? (
                        <span 
                          id="profile-account-type-chip"
                          className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 bg-amber-100 text-amber-950 border-amber-300"
                        >
                          <StoreIcon className="h-3.5 w-3.5 text-amber-700" />
                          <span>Store Account</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsStoreModalOpen(true)}
                          className="text-[11px] font-black tracking-wider px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 cursor-pointer"
                        >
                          <span>⚠️ Setup Required</span>
                        </button>
                      )
                    ) : (
                      <span 
                        id="profile-account-type-chip"
                        className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 bg-blue-100 text-blue-950 border-blue-300"
                      >
                        <GraduationCap className="h-3.5 w-3.5 text-blue-700" />
                        <span>Student Account</span>
                      </span>
                    )}
                    {profile.is_top_seller && (
                      <span className="text-[10px] bg-amber-150/80 text-amber-800 border-amber-250 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        ⭐ Top Seller
                      </span>
                    )}
                    {profile.is_verified && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 text-[11px] sm:text-xs font-semibold flex flex-wrap items-center gap-2">
                    <span>{profile.username ? `@${profile.username}` : '@user'}</span>
                    {((profile as any)?.created_at || realAuthUser?.created_at) ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Joined {
                            new Date((profile as any)?.created_at || realAuthUser?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          }
                        </span>
                      </>
                    ) : null}
                    <span>•</span>
                    {dbCampusName ? (
                      <span className="flex items-center gap-1 text-primary">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {dbCampusName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 italic">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> Campus: Not added yet
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black pt-1">
                    {realReviews.count > 0 ? (
                      <>
                        {'★'.repeat(Math.min(5, Math.max(1, Math.round(realReviews.rating))))}
                        <span className="text-slate-900 ml-1">{realReviews.rating.toFixed(1)} Rating</span>
                        <span className="text-slate-400 font-semibold text-[10.5px]">({realReviews.count} reviews)</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-semibold text-xs flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-slate-300" /> No reviews yet (0 reviews)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 mt-2 sm:mt-0">
                  <AccountBadge 
                    emailVerified={Boolean(realAuthUser?.email_confirmed_at)}
                    isVerified={Boolean(profile.is_verified)}
                    hasStore={hasStoreRow}
                    studentVerificationStatus={profile.student_verification_status}
                    storeVerificationStatus={userStore?.verification_status || (userStore?.is_verified ? 'approved' : 'unverified')}
                    isTopSeller={profile.is_top_seller}
                    role={profile.role}
                    size="md"
                    showAll={true}
                  />
                </div>
              </div>

              {/* Complete Store Setup Prompt banner for store accounts without a registered store row */}
              {isStore && !hasStoreRow && (
                <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md shrink-0">
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Complete your store setup</h3>
                      <p className="text-xs text-slate-600 font-medium">Your account type is set to Business Owner, but your store is not registered in the marketplace yet. Register your store name, stall spot, and category to unlock merchant tools.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsStoreModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shrink-0 cursor-pointer"
                  >
                    Complete Store Setup
                  </Button>
                </div>
              )}

              {/* Account Details & Credentials Dropdowns */}
              <div className="px-6 pb-6">
                <AccountDetailsDropdowns 
                  profile={profile}
                  realAuthUser={realAuthUser}
                  userStore={userStore}
                  campusName={dbCampusName}
                  subscriptionPlanName={subscriptionPlanName}
                  storeFollowersCount={storeFollowersCount}
                  realReviews={realReviews}
                  realMetrics={realMetrics}
                  isStore={isStore}
                  hasStoreRow={hasStoreRow}
                  wishlistCount={wishlistItems.length}
                  onOpenStoreModal={() => setIsStoreModalOpen(true)}
                />
              </div>

              {/* Become a Shop Owner Banner for non-store accounts */}
              {!isStore && (
                <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Become a Verified Shop Owner</h3>
                      <p className="text-xs text-slate-600 font-medium">Create your official campus store on Kibabii Market to reach thousands of comrades and unlock exclusive merchant features.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsStoreModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shrink-0 cursor-pointer"
                  >
                    Open Store Now
                  </Button>
                </div>
              )}
            </div>
          </section>


          {/* ======================= SECTION 2: ACCOUNT STATS ======================= */}
          <section id="account-stats" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('account-stats')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" /> Account Metrics Stats
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Daily performance indices matching your current active profile type.</p>
                </div>
                {collapsedSections['account-stats'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>
              
              {!collapsedSections['account-stats'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50 bg-stone-50/5">
                  <StatsPanel 
                    profile={profile} 
                    wishlistCount={wishlistItems.length} 
                    metrics={realMetrics} 
                  />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 3: MY MARKETPLACE ======================= */}
          <section id="my-marketplace" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('my-marketplace')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="h-4.5 w-4.5 text-indigo-500" /> My Marketplace
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Review current listings, messages, saved wishlist items, and order history.</p>
                </div>
                {collapsedSections['my-marketplace'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['my-marketplace'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <MyMarketplacePanel 
                    wishlistItems={wishlistItems}
                    onRemoveWishlist={handleRemoveWishlist}
                    productsListed={realMetrics.listingsPosted ?? profile.products_listed ?? 0}
                  />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 4: FOLLOWED STORES ======================= */}
          <section id="followed-stores" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('followed-stores')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="h-4.5 w-4.5 text-rose-500" /> Followed Stores
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Quick horizontal scroll indices representing your subscribed campus shops.</p>
                </div>
                {collapsedSections['followed-stores'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['followed-stores'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <FollowedStoresPanel />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 5: VERIFICATION & BADGES ======================= */}
          <section id="verification-badges" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('verification-badges')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-505 text-emerald-600" /> Verification & Badge Index
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">View your account verification status, student credentials, and seller badges.</p>
                </div>
                {collapsedSections['verification-badges'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['verification-badges'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <BadgesPanel profile={profile} />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 6: SELLER CENTER ======================= */}
          <section id="seller-center" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('seller-center')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-sky-505 text-sky-655 text-primary" /> Active Seller Center
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Visible to all. Launch product listing ads and view graphical interest spikes.</p>
                </div>
                {collapsedSections['seller-center'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['seller-center'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <SellerCenterPanel />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 7: STORE MANAGEMENT ======================= */}
          {isStore && hasStoreRow && (
            <section id="store-management" className="scroll-mt-6 text-left">
              <Card className="border border-indigo-150 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleToggleCollapse('store-management')}
                  className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                      <StoreIcon className="h-4.5 w-4.5 text-indigo-500" /> Store Management Front
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-bold leading-none">Complete checkout management, promo configurations and followers monitoring.</p>
                  </div>
                  {collapsedSections['store-management'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                </button>

                {!collapsedSections['store-management'] && (
                  <CardContent className="p-6 pt-0 border-t border-slate-50">
                    <StoreManagementPanel />
                  </CardContent>
                )}
              </Card>
            </section>
          )}


          {/* ======================= SECTION 8: ACCOMMODATION MANAGEMENT ======================= */}
          {showAccommodation && (
            <section id="accommodation-management" className="scroll-mt-6 text-left">
              <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleToggleCollapse('accommodation-management')}
                  className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                      <Building className="h-4.5 w-4.5 text-sky-505 text-sky-600" /> Hostel & Accommodation
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Manage hostel vacancies, student room listings, and rental availability.</p>
                  </div>
                  {collapsedSections['accommodation-management'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                </button>

                {!collapsedSections['accommodation-management'] && (
                  <CardContent className="p-6 pt-0 border-t border-slate-50">
                    <AccommodationManager />
                  </CardContent>
                )}
              </Card>
            </section>
          )}


          {/* ======================= SECTION 9: SERVICES MANAGEMENT ======================= */}
          {showServices && (
            <section id="services-management" className="scroll-mt-6 text-left">
              <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleToggleCollapse('services-management')}
                  className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="h-4.5 w-4.5 text-teal-600" /> Services Management
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Manage digital repairs, typing cyber gigs, or clothes laundry services.</p>
                  </div>
                  {collapsedSections['services-management'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                </button>

                {!collapsedSections['services-management'] && (
                  <CardContent className="p-6 pt-0 border-t border-slate-50">
                    <ServicesManager />
                  </CardContent>
                )}
              </Card>
            </section>
          )}


          {/* ======================= SECTION 10: EVENTS MANAGEMENT ======================= */}
          {showEvents && (
            <section id="events-management" className="scroll-mt-6 text-left">
              <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleToggleCollapse('events-management')}
                  className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-purple-600" /> Events Organizers Desk
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Compile ticket registrations, print rosters, and audit student attendees list.</p>
                  </div>
                  {collapsedSections['events-management'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                </button>

                {!collapsedSections['events-management'] && (
                  <CardContent className="p-6 pt-0 border-t border-slate-50">
                    <EventsManager />
                  </CardContent>
                )}
              </Card>
            </section>
          )}


          {/* ======================= SECTION 11: SETTINGS ======================= */}
          <section id="settings" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('settings')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="h-4.5 w-4.5 text-slate-655 text-slate-700" /> Settings Panel
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Customize display name, update target WhatsApp, and setup security verification alerts.</p>
                </div>
                {collapsedSections['settings'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['settings'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <SettingsPanel 
                    profile={profile}
                    setProfile={setProfile}
                    showAccommodation={showAccommodation}
                    setShowAccommodation={setShowAccommodation}
                    showServices={showServices}
                    setShowServices={setShowServices}
                    showEvents={showEvents}
                    setShowEvents={setShowEvents}
                  />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 12: SUPPORT ======================= */}
          <section id="help-support" className="scroll-mt-6 text-left">
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <button 
                onClick={() => handleToggleCollapse('help-support')}
                className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-sky-500" /> Help & Support Panel
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Contact support via WhatsApp hotline and read transaction safety guidelines.</p>
                </div>
                {collapsedSections['help-support'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
              </button>

              {!collapsedSections['help-support'] && (
                <CardContent className="p-6 pt-0 border-t border-slate-50">
                  <SupportPanel />
                </CardContent>
              )}
            </Card>
          </section>


          {/* ======================= SECTION 13: ADMINISTRATION ======================= */}
          {isAdmin && (
            <section id="administration" className="scroll-mt-6 text-left">
              <Card className="border border-slate-900 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/5">
                <button 
                  onClick={() => handleToggleCollapse('administration')}
                  className="w-full text-left p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="h-4.5 w-4.5 text-rose-500" /> Administration Panel
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-bold">Approve student IDs scans, monitor complaints board, and view platform metrics ledger.</p>
                  </div>
                  {collapsedSections['administration'] ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                </button>

                {!collapsedSections['administration'] && (
                  <CardContent className="p-6 pt-0 border-t border-slate-900/10">
                    <AdminPanel />
                  </CardContent>
                )}
              </Card>
            </section>
          )}


          {/* ======================= SECTION 14: LOGOUT ======================= */}
          <section id="logout" className="scroll-mt-6 text-left">
            <Card className="border border-red-100 rounded-3xl overflow-hidden shadow-sm bg-red-50/10 hover:bg-red-50/20 transition-colors">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-700 flex items-center gap-1.5 leading-none">
                    <LogOut className="h-4 w-4" /> Comrade Session End
                  </h4>
                  <p className="text-[10.5px] font-semibold text-slate-400">Safely log out of Kibu Market workspace and clear session cookies.</p>
                </div>

                <Button 
                  id="unified-logout-button"
                  variant="destructive"
                  onClick={() => setShowLogoutModal(true)}
                  className="h-10 text-xs font-black rounded-xl bg-red-650 hover:bg-red-700 text-white shrink-0 shadow-lg shadow-red-500/15 font-sans"
                >
                  🚪 Secure Logout Session
                </Button>
              </CardContent>
            </Card>
          </section>

        </div>

      </div>

      {/* ======================= COMRADE CONFIRMATION LOGOUT MODAL ======================= */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="max-w-md w-full border border-slate-100 rounded-3xl p-6 bg-white shadow-2xl space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-4xl block leading-none">🚪</span>
              <h3 className="text-xl font-black text-secondary">End Your Comrade Session?</h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Are you sure you want to log out of Kibabii Market? You will need to re-authenticate to file bids or edit ads.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 h-11 font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                id="unified-logout-modal-confirm"
                onClick={handleLogoutAction}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-650/15"
              >
                Yes, Log Me Out
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Store Creation Modal for upgrading to Shop Owner */}
      <StoreCreationModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSuccess={(newStore) => {
          setIsStoreModalOpen(false);
          setUserStore(newStore);
          setIsShopOwner(true);
          fetchRealRolesAndStore();
          toast.success(`Store "${newStore.name}" activated! Welcome to your Shop Owner dashboard.`);
        }}
      />

    </div>
  );
}
