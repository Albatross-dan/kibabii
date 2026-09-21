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

      // 1. Fetch real profile from profiles / public_profiles to ensure account_type is accurate
      let dbAccountType = profile?.account_type;
      try {
        let profileRow: any = null;
        const { data: profData } = await supabase
          .from('profiles')
          .select('account_type, role, is_store, store_name')
          .eq('id', currentUserId)
          .maybeSingle();

        if (profData) {
          profileRow = profData;
        } else {
          const { data: pubProfileRow } = await supabase
            .from('public_profiles')
            .select('account_type, role, is_store')
            .eq('id', currentUserId)
            .maybeSingle();
          profileRow = pubProfileRow;
        }

        if (profileRow?.account_type) {
          dbAccountType = profileRow.account_type;
        }
      } catch (profErr) {
        console.warn('Profile verification notice:', profErr);
      }

      // 2. Read precomputed seller reputation from profiles (Section 3 backend contract)
      try {
        const rep = await reviewService.getSellerReputation(currentUserId);
        setRealReviews({
          rating: rep.seller_rating,
          count: rep.seller_rating_count
        });
      } catch (revErr) {
        console.warn('Reviews fetch notice:', revErr);
        setRealReviews({ rating: 0, count: 0 });
      }

      // 3. Count listings across all 5 listing types as requested:
      // products, services, accommodations, events, lost & found
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

      // 4. Check real roles from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId);

      if (rolesError) {
        console.warn('user_roles query notice:', rolesError);
      }

      const roleList = roles?.map(r => r.role) || [];
      setRealUserRoles(roleList);

      // 5. Check real store ownership from stores table
      const { data: storeRows, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', currentUserId)
        .order('created_at', { ascending: false });

      if (storeError) {
        console.warn('stores query notice:', storeError);
      }

      let activeStore = storeRows && storeRows.length > 0 ? storeRows[0] : null;
      if (!activeStore) {
        activeStore = await storeService.getUserStore(currentUserId);
      }
      setUserStore(activeStore);

      const isStoreAccount = dbAccountType === 'store' || profile?.account_type === 'store' || roleList.includes('shop_owner') || roleList.includes('store') || profile?.role === 'shop_owner' || profile?.is_store || Boolean(activeStore);
      const isOwner = isStoreAccount;

      setIsShopOwner(isOwner);

      // Keep profile state aligned with real database values
      if (profile && (
        profile.products_listed !== accurateListingCount ||
        profile.products_sold !== accurateSoldCount ||
        (dbAccountType && profile.account_type !== dbAccountType) ||
        (isOwner && profile.account_type !== 'store')
      )) {
        if (setProfile) {
          setProfile({
            ...profile,
            products_listed: accurateListingCount,
            products_sold: accurateSoldCount,
            account_type: dbAccountType || (isOwner ? 'store' : profile.account_type),
            role: isOwner ? 'shop_owner' : profile.role,
            is_store: isOwner ? true : profile.is_store,
            store_name: activeStore?.name || profile.store_name
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

  // Simulation flags for sections 8, 9, 10
  const [showAccommodation, setShowAccommodation] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Collapsible section states (Record mapping section id to true if collapsed)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'store-management': false,
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

  const isStudent = profile.role === 'student' || profile.role === 'both' || profile.account_type === 'student';
  const isStore = profile.account_type === 'store' || isShopOwner || profile.role === 'shop_owner' || profile.role === 'store' || profile.is_store === true;

  const badgeLabel = profile.account_type === 'store'
    ? 'STORE ACCOUNT'
    : 'STUDENT ACCOUNT';

  const visibleDashboardSections = getDashboardSections({
    isStore,
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
            isStore={isStore}
            isAdmin={isAdmin}
            showAccommodation={showAccommodation}
            showServices={showServices}
            showEvents={showEvents}
            onLogoutClick={() => setShowLogoutModal(true)}
            isMenuOpen={isNavMenuOpen}
            setIsMenuOpen={setIsNavMenuOpen}
          />

          {/* Quick Stats sidebar banner */}
          <div className="mt-4 p-4 rounded-3xl border border-dashed bg-stone-50/40 text-left space-y-2 hidden lg:block">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Futuristic Add-ons Info</span>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-[10px] leading-tight font-semibold text-indigo-700">
              ⚡ All payments on Kibabii Market are protected by our automatic release Escrow and immediate Courier Dispatch services.
            </div>
          </div>
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
              <div className="h-44 sm:h-52 w-full relative" style={{ background: (userStore?.banner_url || profile.store_banner_image) ? undefined : 'linear-gradient(135deg, #1e1b4b, #311042)' }}>
                {(userStore?.banner_url || profile.store_banner_image) && (
                  <img 
                    src={userStore?.banner_url || profile.store_banner_image} 
                    className="w-full h-full object-cover opacity-80 absolute inset-0" 
                    alt="Dashboard Banner" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                
                {/* Primary Account Type Badge — The single, unambiguous, most prominent element */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <div 
                    id="profile-header-account-type-badge"
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2 backdrop-blur-md border transition-all ${
                      profile.account_type === 'store'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-black/20'
                        : 'bg-blue-600 text-white border-blue-400 ring-2 ring-black/20'
                    }`}
                  >
                    {profile.account_type === 'store' ? (
                      <StoreIcon className="h-4 w-4 stroke-[2.5]" />
                    ) : (
                      <GraduationCap className="h-4 w-4 stroke-[2.5]" />
                    )}
                    <span>{badgeLabel}</span>
                  </div>
                </div>
              </div>

              {/* Avatar picture and descriptors Overlay row */}
              <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 sm:-mt-14 text-left z-10">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-white bg-white shadow overflow-hidden shrink-0">
                  <img 
                    src={profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=KibuUser'} 
                    className="h-full w-full object-cover" 
                    alt={profile.full_name} 
                  />
                </div>

                <div className="flex-1 space-y-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                      {isStore ? (userStore?.name || profile.store_name || 'Comrade Store') : profile.full_name}
                    </h1>
                    <span 
                      id="profile-account-type-chip"
                      className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 ${
                        profile.account_type === 'store'
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : 'bg-blue-100 text-blue-950 border-blue-300'
                      }`}
                    >
                      {profile.account_type === 'store' ? (
                        <StoreIcon className="h-3.5 w-3.5 text-amber-700" />
                      ) : (
                        <GraduationCap className="h-3.5 w-3.5 text-blue-700" />
                      )}
                      <span>{badgeLabel}</span>
                    </span>
                    {profile.is_top_seller && (
                      <span className="text-[10px] bg-amber-150/80 text-amber-800 border-amber-250 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        ⭐ Top Seller
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 text-[11px] sm:text-xs font-semibold flex flex-wrap items-center gap-2">
                    <span>@{profile.username}</span>
                    {((profile as any)?.created_at || realAuthUser?.created_at) ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Joined {
                            new Date((profile as any)?.created_at || realAuthUser?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          }
                        </span>
                      </>
                    ) : (profile.join_date ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Joined {profile.join_date}
                        </span>
                      </>
                    ) : null)}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-primary">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {profile.campus || profile.store_location || 'Kibabii University'}
                    </span>
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
                    studentVerificationStatus={profile.student_verification_status}
                    storeVerificationStatus={userStore?.is_verified ? 'approved' : 'unverified'}
                    isTopSeller={profile.is_top_seller}
                    role={profile.role}
                    size="md"
                    showAll={true}
                  />
                </div>
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
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Review current ads, check simulated customer inbox rooms, and trace your purchases.</p>
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
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Submit verification papers or browse unlocked peer credentials.</p>
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
          {isStore && (
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
                    <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Simulate vacancy registrations, block listings, and track student search counts.</p>
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
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">Submit immediate dispute feedback and read regular transaction safety guides.</p>
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
