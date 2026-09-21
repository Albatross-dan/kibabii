import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Package,
  Heart,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Crown,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { listingService, Listing, Draft } from '@/services/listingService';
import { ListingAnalyticsCard, StorePromotionCard } from '@/components/dashboard/CreationComponents';
import { toast } from 'sonner';

export default function Listings() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab states
  const [activeTab, setActiveTab] = useState('active');

  // Stats state
  const [stats, setStats] = useState({
    active_listings: 0,
    pending_listings: 0,
    sold_listings: 0,
    expired_listings: 0,
    archived_listings: 0,
    draft_listings: 0
  });

  // Promoter Modal states
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoTargetId, setPromoTargetId] = useState('');
  const [selectedPromoType, setSelectedPromoType] = useState('featured');

  // Store Banner Customizer State
  const [storeBanner, setStoreBanner] = useState(profile?.store_banner_image || 'https://images.unsplash.com/photo-1562774053-f5a02f6a7c93?w=1200&q=80');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState(storeBanner);

  // Authentication flags
  const isStore = profile?.account_type === 'store' || profile?.role === 'store' || profile?.role === 'shop_owner' || profile?.is_store === true;
  const sellerId = profile?.id || user?.id || '';
  
  // Read subscription plan from localStorage, fall back to profile type
  const savedPlanId = localStorage.getItem(`sub_plan_${sellerId}`);
  const activePlanId = savedPlanId || (isStore ? 'partner' : 'free');

  const activePlan = activePlanId === 'partner' || activePlanId === 'elite'
    ? { id: activePlanId, name: 'Premium Partner', display_name: 'Store Pro', limit: 100, promotion_limit: 10 }
    : { id: 'free', name: 'Comrade Free', display_name: 'Student Free', limit: 10, promotion_limit: 1 };

  const planInfo = { days_remaining: 30 };

  useEffect(() => {
    fetchListingsData();
    fetchStats();
  }, [sellerId, activeTab, searchQuery]);

  const fetchStats = async () => {
    try {
      const liveStats = await listingService.getDashboardStats();
      if (liveStats) {
        setStats({
          active_listings: liveStats.active_listings || 0,
          pending_listings: liveStats.pending_listings || 0,
          sold_listings: liveStats.sold_listings || 0,
          expired_listings: liveStats.expired_listings || 0,
          archived_listings: liveStats.archived_listings || 0,
          draft_listings: liveStats.draft_listings || 0
        });
      }
    } catch (err) {
      console.warn('Error fetching live stats:', err);
    }
  };

  const fetchListingsData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'drafts') {
        const myDrafts = await listingService.getMyDrafts(sellerId);
        setDrafts(myDrafts || []);
      } else {
        let p_status: any = null;
        if (activeTab === 'active') p_status = 'active';
        else if (activeTab === 'pending') p_status = 'pending_review';
        else if (activeTab === 'sold') p_status = 'sold';
        else if (activeTab === 'expired') p_status = 'expired';
        else if (activeTab === 'archived') p_status = 'archived';

        const myItems = await listingService.getMyListings(
          p_status,
          null,
          'newest',
          searchQuery || null,
          50,
          0
        );
        setListings(myItems || []);
      }
    } catch (e) {
      console.error('Failed to fetch via listingService:', e);
      toast.error('Could not fetch listings. Showing empty state.');
      setListings([]);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await listingService.updateListingStatus(id, newStatus);
      toast.success(`Listing marked as ${newStatus}`);
    } catch (err) {
      console.error('Error changing listing status:', err);
      toast.error('Could not update listing status in database.');
    }
    fetchListingsData();
    fetchStats();
  };

  const handleMarkAsSold = async (item: Listing) => {
    const productId = (item as any).product_id || item.id;
    try {
      const res = await listingService.markProductSold(productId);
      if (!res.success) {
        toast.error(res.error || 'Failed to mark product as sold');
        return;
      }
      toast.success(`"${item.title}" marked as sold.`);
      fetchListingsData();
      fetchStats();
    } catch (err: any) {
      console.error('Error marking product as sold:', err);
      toast.error(err.message || 'Failed to mark product as sold');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing permanently from campus search?')) return;
    try {
      await listingService.updateListingStatus(id, 'archived');
      toast.success('Listing permanently deleted');
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error('Failed to delete listing. Please try again.');
    }
    fetchListingsData();
    fetchStats();
  };

  const handleOrphanDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this orphaned listing permanently? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Orphaned listing permanently deleted');
      fetchListingsData();
      fetchStats();
    } catch (err) {
      console.error('Error deleting orphaned listing:', err);
      toast.error('Failed to delete orphaned listing.');
    }
  };

  const handlePromoteSubmit = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          is_promoted: true,
          promotion_type: selectedPromoType,
          promotion_expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', promoTargetId);
      if (error) throw error;
      toast.success(`🎉 Upgrade activated! Added standard tag: ${selectedPromoType}`);
    } catch (err) {
      console.error('Error promoting listing:', err);
      toast.error('Could not active promotion in database.');
    }
    setIsPromoOpen(false);
    fetchListingsData();
    fetchStats();
  };

  const handleSaveBanner = () => {
    if (tempBannerUrl) {
      setStoreBanner(tempBannerUrl);
      setIsBannerModalOpen(false);
      toast.success('Store profile banner image updated!');
    }
  };

  const resumeDraftItem = (draft: Draft) => {
    navigate('/dashboard/listings/new');
  };

  const deleteDraftItem = async (id: string) => {
    try {
      await listingService.deleteDraft(id);
      setDrafts(drafts.filter(d => d.id !== id));
      toast.info('Draft deleted');
      fetchStats();
    } catch (err) {
      console.error('Error deleting draft:', err);
      toast.error('Failed to delete draft from database.');
    }
  };

  const getFilteredItems = () => {
    if (activeTab === 'drafts') return drafts;
    return listings;
  };

  const displayItems = getFilteredItems();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 text-left antialiased overflow-hidden">
      {/* Store Banner & Subscriptions overview */}
      {isStore && (
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100 flex flex-col relative group">
          <div className="h-36 sm:h-48 w-full bg-slate-100 relative">
            <img src={storeBanner} className="w-full h-full object-cover" alt="Store Banner" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent"></div>
            
            {/* Upgrade banner controls */}
            <Button
              onClick={() => {
                setTempBannerUrl(storeBanner);
                setIsBannerModalOpen(true);
              }}
              size="sm"
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white font-extrabold text-[10px] sm:text-xs rounded-lg sm:rounded-xl h-7 sm:h-9 px-2.5 sm:px-3.5 backdrop-blur-md border-none cursor-pointer"
            >
              Configure Banner
            </Button>
            
            {/* Meta details */}
            <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-6 right-3 flex gap-2.5 sm:gap-4 items-end text-white">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center p-1 shrink-0 shadow-lg select-none">
                <span className="text-xl sm:text-2xl">🏬</span>
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="font-black text-base sm:text-xl text-white truncate">{profile?.store_name || 'Official Store'}</h2>
                  <Badge className="bg-primary/95 text-white font-extrabold uppercase text-[8px] sm:text-[9px] tracking-wider py-0.5 px-1.5">
                    {activePlan.display_name}
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-1">
                  {profile?.store_description || 'Active business provider at Kibabii University Marketplace.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3.5 sm:p-5 bg-slate-50/60 border-t items-center">
            <div className="flex gap-2.5 items-center">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Crown className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Plan Status</span>
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm truncate block">{activePlan.display_name} &bull; {planInfo.days_remaining}d</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <StorePromotionCard 
                count={listings.filter(l => l.is_promoted).length} 
                planName={activePlan.display_name} 
                limit={activePlan.promotion_limit} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Primary header & Create cta */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-2">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Button variant="ghost" size="icon" asChild className="rounded-full border border-slate-200 bg-white shadow-sm shrink-0 h-9 w-9 hover:bg-slate-50 transition">
            <Link to="/dashboard" title="Back to Dashboard">
              <ArrowLeft className="h-4.5 w-4.5 text-slate-700" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
               My Listings
            </h1>
            <p className="text-slate-500 font-medium text-xs truncate">
              {isStore ? 'Manage store inventory & promotion campaigns' : 'Manage your items, notes, hostels & draft listings'}
            </p>
          </div>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/95 text-white font-extrabold h-10 sm:h-11 px-4 sm:px-5 rounded-xl shadow-md shadow-primary/20 shrink-0 w-full sm:w-auto text-xs sm:text-sm">
          <Link to="/dashboard/listings/new">
            <Plus className="mr-1 h-4 w-4 stroke-[3]" /> Add Campus Listing
          </Link>
        </Button>
      </div>

      {/* Tabs configuration list */}
      <Tabs defaultValue="active" onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-slate-100 pb-2">
          {/* Horizontally scrollable pill tabs for mobile */}
          <TabsList className="bg-transparent border-none gap-1.5 sm:gap-2 h-auto p-0 justify-start flex flex-nowrap overflow-x-auto no-scrollbar scroll-smooth touch-pan-x w-full md:w-auto pb-1">
            {[
              { id: 'active', label: 'Active', count: stats.active_listings, color: 'bg-emerald-500' },
              { id: 'pending', label: 'In Review', count: stats.pending_listings, color: 'bg-amber-500' },
              { id: 'sold', label: 'Sold', count: stats.sold_listings, color: 'bg-slate-500' },
              { id: 'expired', label: 'Paused', count: stats.expired_listings, color: 'bg-rose-500' },
              { id: 'archived', label: 'Rejected', count: stats.archived_listings, color: 'bg-red-600' },
              { id: 'drafts', label: 'Drafts', count: stats.draft_listings, color: 'bg-indigo-600' }
            ].map(t => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider border border-slate-200/80 bg-white data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {t.label} 
                <span className="bg-slate-100 data-[state=active]:bg-white/20 data-[state=active]:text-white text-slate-700 h-4.5 min-w-[18px] px-1 rounded-full text-[9px] font-black font-mono flex items-center justify-center">
                  {t.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings..."
              className="pl-9 h-9 sm:h-10 rounded-xl text-xs sm:text-sm bg-white"
            />
          </div>
        </div>

        {/* Dynamic renders */}
        {loading ? (
          <div className="p-12 sm:p-20 text-center animate-pulse flex flex-col items-center gap-3">
            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Syncing listings...</p>
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {displayItems.map((item) => {
              const isDraft = activeTab === 'drafts';
              const coverUrl = isDraft ? (item.draft_images?.[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80') : (item.images?.[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80');
              const priceLabel = isDraft ? 'Draft Price' : item.listing_type === 'product' ? formatPrice(item.product_price || 0) : item.listing_type === 'accommodation' ? `${formatPrice(item.accommodation_rent || 0)}/mo` : item.listing_type === 'service' ? `From ${formatPrice(item.service_starting_price || 0)}` : 'FREE';
              const isOrphan = !isDraft && item.listing_type === 'product' && !item.product_id;
              const isProduct = !isDraft && (item.listing_type === 'product' || !!(item as any).product_id);

              return (
                <Card key={item.id} className="overflow-hidden border border-slate-100 hover:border-slate-200 transition-all rounded-2xl sm:rounded-3xl bg-white flex flex-col justify-between shadow-xs hover:shadow-md">
                  <div>
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img src={coverUrl} className="w-full h-full object-cover" alt="" />
                      
                      {/* Floating status badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                        <Badge className="bg-slate-900/90 backdrop-blur-xs text-white font-extrabold uppercase text-[8px] px-2 py-0.5 rounded-md">
                           {item.listing_type}
                        </Badge>
                        {isOrphan && (
                          <Badge className="bg-rose-600 text-white font-extrabold uppercase text-[8px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            Missing Data
                          </Badge>
                        )}
                        {item.is_promoted && (
                          <Badge className="bg-amber-500 text-white font-extrabold uppercase text-[8px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                             <Sparkles className="h-2.5 w-2.5" /> {item.promotion_type}
                          </Badge>
                        )}
                      </div>

                      {/* Top right tools dropdown */}
                      <div className="absolute top-2.5 right-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-lg h-7 w-7 bg-white/95 backdrop-blur-md shadow-sm hover:bg-white">
                              <MoreVertical className="h-4 w-4 text-slate-800" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100 w-44 shadow-lg p-1 space-y-0.5 text-left">
                            {isDraft ? (
                              <>
                                <DropdownMenuItem onClick={() => resumeDraftItem(item)} className="cursor-pointer py-2">
                                  <Sliders className="h-4 w-4 mr-2" /> Resume Wizard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteDraftItem(item.id)} className="text-rose-600 focus:text-rose-600 cursor-pointer py-2 font-bold">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Draft
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem asChild className="cursor-pointer py-2">
                                  <Link to={`/products/${item.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View Public
                                  </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem asChild className="cursor-pointer py-2">
                                  <Link to={`/dashboard/listings/${item.id}/edit`}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                                  </Link>
                                </DropdownMenuItem>

                                {item.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'paused')} className="cursor-pointer py-2">
                                    <Clock className="h-4 w-4 mr-2" /> Pause Post
                                  </DropdownMenuItem>
                                )}

                                {isProduct && item.status !== 'sold' && (
                                  <DropdownMenuItem onClick={() => handleMarkAsSold(item)} className="cursor-pointer py-2 text-emerald-600 font-bold focus:text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Mark as Sold
                                  </DropdownMenuItem>
                                )}

                                {item.status === 'paused' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'active')} className="cursor-pointer py-2">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Resume Listing
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setPromoTargetId(item.id);
                                    setIsPromoOpen(true);
                                  }}
                                  className="text-amber-600 font-bold focus:text-amber-650 cursor-pointer py-2"
                                >
                                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" /> Promote Listing
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-rose-600 focus:text-rose-600 cursor-pointer py-2 font-bold">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 space-y-2">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 line-clamp-1">{item.title}</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{item.location}</span>
                        </p>
                      </div>

                      <div className="flex justify-between items-baseline pt-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Price</span>
                        <span className="font-mono font-black text-slate-900 text-base sm:text-lg leading-none">{priceLabel}</span>
                      </div>

                      {/* Action buttons directly accessible on card for mobile sellers */}
                      {!isDraft && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild 
                              className="h-8 rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50"
                            >
                              <Link to={`/products/${item.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Link>
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              asChild 
                              className="h-8 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800"
                            >
                              <Link to={`/dashboard/listings/${item.id}/edit`}>
                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                              </Link>
                            </Button>
                          </div>
                          {isProduct && item.status !== 'sold' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsSold(item)}
                              className="w-full h-8 rounded-lg text-xs font-bold border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mark as Sold
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic stats footer block */}
                  {!isDraft && (
                    <div className="p-3 border-t bg-slate-50/60 rounded-b-2xl sm:rounded-b-3xl">
                      <ListingAnalyticsCard views={item.views_count || 12} favorites={item.favorites_count || 2} />
                    </div>
                  )}

                  {isDraft && (
                    <div className="p-3 border-t flex justify-between gap-2 items-center bg-slate-50/60 rounded-b-2xl sm:rounded-b-3xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black truncate">Saved Draft</span>
                      <Button
                        size="sm"
                        onClick={() => navigate('/dashboard/listings/new')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl h-7 px-3 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        Resume <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-10 sm:p-16 text-center flex flex-col items-center gap-4 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <p className="font-extrabold text-slate-800 text-base">No listings here</p>
              <p className="text-xs text-slate-400">You do not have any items matching this filter category.</p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-10 px-5 rounded-xl shadow-md shadow-primary/20">
              <Link to="/dashboard/listings/new">
                <Plus className="mr-1 h-4 w-4" /> Create First Listing
              </Link>
            </Button>
          </div>
        )}
      </Tabs>

      {/* QUICK UPGRADE PROMOTER DRAWER */}
      <Dialog open={isPromoOpen} onOpenChange={setIsPromoOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6">
          <DialogHeader className="text-left border-b pb-4">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-1.5">
               <Sparkles className="h-5.5 w-5.5 text-amber-500 animate-spin" /> Boost Listing Campaign
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-slate-400">
               Select standard priority upgrade package
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-left">
            <RadioGroup
              value={selectedPromoType}
              onValueChange={setSelectedPromoType}
              className="space-y-3"
            >
              {[
                { 
                  id: 'featured', 
                  title: '✨ Featured Package', 
                  price: 'KSh 250.00 / 7 Days', 
                  desc: 'Priority placement inside search, persistent visual badge.' 
                },
                { 
                  id: 'premium', 
                  title: '👑 Premium Package', 
                  price: 'KSh 490.00 / 14 Days', 
                  desc: 'Banner promotion, eligibility in trending recommendations.' 
                }
              ].map(promo => (
                <div key={promo.id}>
                  <RadioGroupItem value={promo.id} id={`p-${promo.id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`p-${promo.id}`}
                    className="block p-4 border-2 rounded-2xl cursor-pointer hover:bg-slate-50/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all space-y-1 text-slate-850"
                  >
                    <div className="flex justify-between font-black text-sm">
                      <span>{promo.title}</span>
                      <span className="text-primary font-mono">{promo.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">{promo.desc}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1 text-xs">
              <span className="font-extrabold text-slate-400 uppercase text-[9.5px]">M-PESA checkout simulator</span>
              <p className="text-slate-500 leading-relaxed">
                Upgrades will automatically trigger Safaricom STK Push simulation on phone contact associated with profile!
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" className="font-bold rounded-xl" onClick={() => setIsPromoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteSubmit} className="bg-primary text-white font-extrabold h-11 px-6 rounded-xl shadow-md shadow-primary/20">
              ✓ Pay & Activate Boost
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BANNER CUSTOMIZER MODAL */}
      <Dialog open={isBannerModalOpen} onOpenChange={setIsBannerModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6">
          <DialogHeader className="text-left border-b pb-4">
            <DialogTitle className="text-lg font-black text-slate-900">Configure Business Header Banner</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
               Update your official storefront cover photo url
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Banner Image URL</Label>
              <Input
                value={tempBannerUrl}
                onChange={(e) => setTempBannerUrl(e.target.value)}
                placeholder="Paste landscape image URL here..."
                className="h-12 rounded-xl"
              />
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 border relative">
              <img src={tempBannerUrl || 'https://images.unsplash.com/photo-1562774053-f5a02f6a7c93?w=600&q=80'} className="w-full h-full object-cover" alt="Preview Banner" />
              <span className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 text-[9px] uppercase font-black text-white rounded">Live Preview</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" className="font-bold rounded-xl" onClick={() => setIsBannerModalOpen(false)}>
              Discard
            </Button>
            <Button onClick={handleSaveBanner} className="bg-secondary text-white font-extrabold h-11 px-6 rounded-xl">
              ✓ Save Cover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
