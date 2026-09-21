import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  CheckSquare,
  AlertOctagon,
  FileCheck2,
  School,
  FolderTree,
  Activity,
  Sparkles,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  X,
  Check,
  Eye,
  Menu,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Home,
  Store,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import { supabase, requireAuth } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  adminService, 
  ModerationItem, 
  ProductReport, 
  UserVerification, 
  CampusMembership, 
  AuditLog, 
  AdminBrand,
  AdminAdPromo,
  AdminFlashSale 
} from '@/services/adminService';

// Interactive Admin Dashboard Page
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'reports' | 'user_verifications' | 'campus' | 'users' | 'catalog' | 'audit' | 'promotions'>('overview');
  
  // Listings Moderation States
  const [adminListings, setAdminListings] = useState<any[]>([]);
  const [selectedListingTab, setSelectedListingTab] = useState<'pending_review' | 'active' | 'sold' | 'rejected' | 'all'>('pending_review');
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [listingToDeletePermanently, setListingToDeletePermanently] = useState<any | null>(null);
  const [deletingListing, setDeletingListing] = useState(false);

  // Dynamic Datasets
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [memberships, setMemberships] = useState<CampusMembership[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [promoAds, setPromoAds] = useState<AdminAdPromo[]>([]);
  const [flashSales, setFlashSales] = useState<AdminFlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters States
  const [userSearchText, setUserSearchText] = useState('');
  const [auditSearchText, setAuditSearchText] = useState('');
  const [moderationFilter, setModerationFilter] = useState<'open' | 'resolved'>('open');
  const [reportFilter, setReportFilter] = useState<'open' | 'resolved' | 'dismissed'>('open');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');

  // Dynamic weekly compliance metrics based on real database records
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, { verifications: number; reports: number }> = {
      Mon: { verifications: 0, reports: 0 },
      Tue: { verifications: 0, reports: 0 },
      Wed: { verifications: 0, reports: 0 },
      Thu: { verifications: 0, reports: 0 },
      Fri: { verifications: 0, reports: 0 },
      Sat: { verifications: 0, reports: 0 },
      Sun: { verifications: 0, reports: 0 },
    };

    (verifications || []).forEach(v => {
      if (v.created_at) {
        const d = new Date(v.created_at);
        const day = days[d.getDay()];
        if (counts[day]) counts[day].verifications += 1;
      }
    });

    (reports || []).forEach(r => {
      if (r.created_at) {
        const d = new Date(r.created_at);
        const day = days[d.getDay()];
        if (counts[day]) counts[day].reports += 1;
      }
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      verifications: counts[day].verifications,
      reports: counts[day].reports
    }));
  }, [verifications, reports]);

  // Interactive Review States (Modal States)
  const [selectedListing, setSelectedListing] = useState<ModerationItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<ProductReport | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<UserVerification | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // JSON Logs Collapsed states
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // CRUD Creation states
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatParent, setNewCatParent] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newFlashTitle, setNewFlashTitle] = useState('');
  const [newFlashDiscount, setNewFlashDiscount] = useState('10');
  const [newFlashStarts, setNewFlashStarts] = useState('');
  const [newFlashEnds, setNewFlashEnds] = useState('');

  // Critical Confirm Guard modal state
  const [confirmGuard, setConfirmGuard] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Fetch admin listings via moderation_queue (for pending) or listings table
  const fetchAdminListings = async (statusFilter: string | null = null) => {
    const user = await requireAuth();
    if (!user) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    if (statusFilter === 'pending_review') {
      try {
        const queueItems = await adminService.getModerationQueue('pending');

        const mappedQueue: any[] = queueItems.map(item => ({
          id: item.listing_id || item.item_id || item.id,
          listing_id: item.listing_id || item.item_id || item.id,
          queue_id: item.id,
          item_id: item.item_id,
          product_id: (item.item_type === 'product' || item.item_type === 'product_approval') ? item.item_id : undefined,
          accommodation_id: (item.item_type === 'accommodation' || item.item_type === 'accommodation_approval') ? item.item_id : undefined,
          service_id: (item.item_type === 'service' || item.item_type === 'service_approval') ? item.item_id : undefined,
          lost_found_id: (item.item_type === 'lost_found' || item.item_type === 'lost_found_approval') ? item.item_id : undefined,
          event_id: (item.item_type === 'event' || item.item_type === 'event_approval') ? item.item_id : undefined,
          title: item.item_details?.title || 'Untitled Item',
          description: item.item_details?.description || '',
          listing_type: item.item_details?.listing_type || item.item_type?.replace('_approval', '') || 'product',
          status: 'pending_review',
          price: item.item_details?.price,
          price_display: item.item_details?.price_display,
          image_url: item.item_details?.images?.[0] || null,
          images: item.item_details?.images || [],
          owner_name: item.item_details?.seller_name || 'Student Poster',
          owner_email: item.item_details?.seller_email,
          created_at: item.created_at,
          meta: item.item_details?.meta_info || {},
          priority: item.priority || 'medium'
        }));

        // Include any listings in `listings` table with status = 'pending_review'
        const { data: pendingListings } = await supabase
          .from('listings')
          .select(`
            id,
            owner_id,
            listing_type,
            status,
            title,
            description,
            location,
            product_id,
            accommodation_id,
            service_id,
            lost_found_id,
            event_id,
            created_at,
            owner:public_profiles(full_name)
          `)
          .eq('status', 'pending_review')
          .order('created_at', { ascending: false });

        if (pendingListings && pendingListings.length > 0) {
          const knownListingIds = new Set(mappedQueue.map(q => q.listing_id));
          for (const pl of pendingListings) {
            if (!knownListingIds.has(pl.id)) {
              const ownerObj = Array.isArray(pl.owner) ? pl.owner[0] : pl.owner;
              mappedQueue.push({
                id: pl.id,
                listing_id: pl.id,
                queue_id: pl.id,
                item_id: pl.product_id || pl.accommodation_id || pl.service_id || pl.lost_found_id || pl.event_id || pl.id,
                product_id: pl.product_id,
                accommodation_id: pl.accommodation_id,
                service_id: pl.service_id,
                lost_found_id: pl.lost_found_id,
                event_id: pl.event_id,
                title: pl.title || 'Untitled Listing',
                description: pl.description || '',
                listing_type: pl.listing_type || 'product',
                status: 'pending_review',
                price: 0,
                price_display: '',
                image_url: null,
                images: [],
                owner_name: ownerObj?.full_name || 'Student Poster',
                owner_email: undefined,
                created_at: pl.created_at,
                meta: {},
                priority: 'medium'
              });
            }
          }
        }

        setAdminListings(mappedQueue);
      } catch (qErr: any) {
        console.error('Error loading pending queue:', qErr);
        toast.error('Failed to load moderation queue');
        setAdminListings([]);
      }
      return;
    }

    // Active, rejected, or all
    try {
      let query = supabase
        .from('listings')
        .select(`
          id,
          owner_id,
          listing_type,
          status,
          title,
          description,
          location,
          product_id,
          accommodation_id,
          service_id,
          lost_found_id,
          event_id,
          created_at,
          owner:public_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Admin listings fetch error:', error);
        toast.error(error.message);
        return;
      }

      const rawList = (data || []) as any[];

      // Populate rejection reasons from audit_logs for any rejected listings
      const rejectionReasonMap: Record<string, string> = {};
      try {
        const rejectedIds = rawList.filter(i => i.status === 'rejected').map(i => i.id);
        if (rejectedIds.length > 0) {
          const { data: logs } = await supabase
            .from('audit_logs')
            .select('target_id, reason')
            .in('target_id', rejectedIds)
            .order('created_at', { ascending: false });

          if (logs) {
            for (const log of logs) {
              if (log.target_id && log.reason && !rejectionReasonMap[log.target_id]) {
                rejectionReasonMap[log.target_id] = log.reason;
              }
            }
          }
        }
      } catch (logErr) {
        console.warn('Notice querying audit_logs for rejection notes:', logErr);
      }

      const hydratedList = await Promise.all(
        rawList.map(async (item) => {
          let price_display = '';
          let image_url: string | null = null;
          const ownerObj = Array.isArray(item.owner) ? item.owner[0] : item.owner;

          try {
            if (item.listing_type === 'product' && item.product_id) {
              const [pRes, imgRes] = await Promise.all([
                supabase.from('products').select('price').eq('id', item.product_id).maybeSingle(),
                supabase.from('product_images').select('image_url').eq('product_id', item.product_id).order('is_primary', { ascending: false }).limit(1).maybeSingle()
              ]);
              if (pRes.data?.price) price_display = `KSh ${Number(pRes.data.price).toLocaleString('en-KE')}`;
              image_url = imgRes.data?.image_url || null;
            } else if (item.listing_type === 'accommodation' && item.accommodation_id) {
              const [aRes, imgRes] = await Promise.all([
                supabase.from('accommodations').select('price_per_month, rent_amount').eq('id', item.accommodation_id).maybeSingle(),
                supabase.from('accommodation_images').select('image_url').eq('accommodation_id', item.accommodation_id).order('is_primary', { ascending: false }).limit(1).maybeSingle()
              ]);
              const rent = aRes.data?.price_per_month || aRes.data?.rent_amount;
              if (rent) price_display = `KSh ${Number(rent).toLocaleString('en-KE')}/mo`;
              image_url = imgRes.data?.image_url || null;
            } else if (item.listing_type === 'service' && item.service_id) {
              const [sRes, imgRes] = await Promise.all([
                supabase.from('services').select('starting_price, price').eq('id', item.service_id).maybeSingle(),
                supabase.from('service_images').select('image_url').eq('service_id', item.service_id).order('is_primary', { ascending: false }).limit(1).maybeSingle()
              ]);
              const sPrice = sRes.data?.starting_price || sRes.data?.price;
              if (sPrice) price_display = `From KSh ${Number(sPrice).toLocaleString('en-KE')}`;
              image_url = imgRes.data?.image_url || null;
            } else if (item.listing_type === 'lost_found' && item.lost_found_id) {
              const { data: lf } = await supabase.from('lost_found_items').select('item_type, image_url').eq('id', item.lost_found_id).maybeSingle();
              price_display = lf?.item_type === 'found' ? 'Found Item Notice' : 'Lost Item Notice';
              image_url = lf?.image_url || null;
            } else if (item.listing_type === 'event' && item.event_id) {
              const { data: evt } = await supabase.from('events').select('is_free, ticket_price, banner_url').eq('id', item.event_id).maybeSingle();
              price_display = evt?.is_free ? 'Free Event' : evt?.ticket_price ? `KSh ${Number(evt.ticket_price).toLocaleString('en-KE')}` : 'Campus Event';
              image_url = (evt?.banner_url && evt.banner_url.startsWith('http')) ? evt.banner_url : null;
            }
          } catch (hydErr) {
            console.warn('Hydration error:', hydErr);
          }

          return {
            id: item.id,
            listing_id: item.id,
            title: item.title,
            description: item.description || '',
            listing_type: item.listing_type,
            status: item.status,
            price_display: price_display || 'Active Listing',
            image_url,
            owner_name: ownerObj?.full_name || 'Comrade Student',
            owner_email: undefined,
            created_at: item.created_at,
            rejection_reason: rejectionReasonMap[item.id] || null
          };
        })
      );

      setAdminListings(hydratedList);
    } catch (err: any) {
      console.error('Error fetching admin listings:', err);
      toast.error(err?.message || 'Failed to fetch listings');
      setAdminListings([]);
    }
  };

  const approveListing = async (listingId: string) => {
    const user = await requireAuth();
    if (!user) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    const res = await adminService.approveListing(listingId);
    if (!res.success) {
      toast.error(res.error || 'Failed to approve listing');
      return;
    }

    toast.success('Listing approved and now live!');
    await fetchAdminListings(selectedListingTab === 'all' ? null : selectedListingTab);
  };

  const rejectListing = async (listingId: string, reason: string) => {
    const user = await requireAuth();
    if (!user) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    const res = await adminService.rejectListing(listingId, reason);
    if (!res.success) {
      toast.error(res.error || 'Failed to reject listing');
      return;
    }

    toast.info('Listing rejected.');
    setRejectingListingId(null);
    setRejectionReason('');
    await fetchAdminListings(selectedListingTab === 'all' ? null : selectedListingTab);
  };

  const handleConfirmDeletePermanently = async () => {
    if (!listingToDeletePermanently) return;
    const targetId = listingToDeletePermanently.listing_id || listingToDeletePermanently.id;
    const context = {
      itemType: listingToDeletePermanently.listing_type || listingToDeletePermanently.item_type,
      productId: listingToDeletePermanently.product_id,
      accommodationId: listingToDeletePermanently.accommodation_id,
      serviceId: listingToDeletePermanently.service_id,
      lostFoundId: listingToDeletePermanently.lost_found_id,
      eventId: listingToDeletePermanently.event_id,
      queueId: listingToDeletePermanently.queue_id
    };

    setDeletingListing(true);
    try {
      const res = await adminService.deleteListingPermanently(targetId, context);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete listing permanently');
        return;
      }
      toast.success('Listing permanently deleted.');
      setListingToDeletePermanently(null);
      await fetchAdminListings(selectedListingTab === 'all' ? null : selectedListingTab);
    } catch (err: any) {
      console.warn('Delete permanently caught exception:', err);
      toast.error(err?.message || 'An error occurred while deleting the listing.');
    } finally {
      setDeletingListing(false);
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [modData, repData, verData, memData, profData, catData, brandData, auditData, promoData, flashData] = await Promise.all([
        adminService.getModerationQueue(moderationFilter),
        adminService.getProductReports(reportFilter),
        adminService.getUserVerifications(verificationFilter),
        adminService.getCampusMemberships('pending'),
        adminService.getUserProfiles(),
        adminService.getCategoriesTree(),
        adminService.getBrands(),
        adminService.getAuditLogs(),
        adminService.getPromoAds(),
        adminService.getFlashSales(),
        fetchAdminListings(selectedListingTab === 'all' ? null : selectedListingTab)
      ]);

      setModerationItems(modData);
      setReports(repData);
      setVerifications(verData);
      setMemberships(memData);
      setProfiles(profData);
      setCategories(catData);
      setBrands(brandData);
      setAuditLogs(auditData);
      setPromoAds(promoData);
      setFlashSales(flashData);
    } catch (err) {
      console.error('Error fetching admin details:', err);
      toast.error('Could not sync with Supabase tables. Displaying client-cached dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminListings(selectedListingTab === 'all' ? null : selectedListingTab);
  }, [selectedListingTab]);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, moderationFilter, reportFilter, verificationFilter]);

  const triggerConfirmation = (title: string, description: string, onConfirm: () => void | Promise<void>) => {
    setConfirmGuard({
      open: true,
      title,
      description,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await onConfirm();
        } catch {
          toast.error('Action failed inside execution thread');
        } finally {
          setIsSubmitting(false);
          setConfirmGuard(null);
        }
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('kibabui_active_session_id');
    navigate('/auth/login');
  };

  // 1. MODERATION QUEUE HANDLERS
  const handleModerationResolve = async (id: string, resolution: 'approved' | 'rejected') => {
    if (resolution === 'rejected' && !actionReason) {
      toast.error('Please specify a rejection reason for compliance records.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.resolveModerationItem(id, resolution, resolution === 'rejected' ? actionReason : null);
      toast.success(`Listing successfully resolved as ${resolution.toUpperCase()}`);
      setSelectedListing(null);
      setActionReason('');
      loadDashboardData();
    } catch {
      toast.error('Failed to submit moderation policy choice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignModeration = async (id: string) => {
    try {
      await adminService.assignModerationItem(id);
      toast.success('Successfully self-assigned this policy queue task.');
      loadDashboardData();
    } catch {
      toast.error('Fallback update occurred locally.');
    }
  };

  // 2. REPORT HANDLERS
  const handleReportAction = async (id: string, action: 'dismissed' | 'resolved') => {
    if (action === 'resolved' && !actionReason) {
      toast.error('Takedowns require a detailed reason statement.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.resolveProductReport(id, action, action === 'resolved' ? actionReason : null);
      toast.success(`Complaint successfully handled. Decision: ${action.toUpperCase()}`);
      setSelectedReport(null);
      setActionReason('');
      loadDashboardData();
    } catch {
      toast.error('Database insertion error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. USER VERIFICATION HANDLERS
  const handleVerificationAction = async (id: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected' && !actionReason) {
      toast.error('Rejection of verification documents requires clarifying feedback.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.resolveUserVerification(id, status, status === 'rejected' ? actionReason : null);
      toast.success(`Account credentials marked as: ${status.toUpperCase()}`);
      setSelectedVerification(null);
      setActionReason('');
      loadDashboardData();
    } catch {
      toast.error('Verification mutation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CAMPUS MEMBERSHIPS HANDLERS
  const handleCampusAction = async (id: string, action: 'active' | 'rejected') => {
    try {
      await adminService.resolveCampusMembership(id, action);
      toast.success(`Membership has been set to: ${action.toUpperCase()}`);
      loadDashboardData();
    } catch {
      toast.error('Audit update issue.');
    }
  };

  // 5. USER ROLES DELEGATION
  const handleToggleUserRole = async (userId: string, targetRole: string, currentRoles: string[]) => {
    const isGranted = currentRoles.includes(targetRole);
    const action = isGranted ? 'revoke' : 'grant';

    const performRoleChange = async () => {
      await adminService.updateUserRole(userId, targetRole, action);
      toast.success(`Role ${targetRole.toUpperCase()} successfully ${action}d for user.`);
      setSelectedProfile(null);
      loadDashboardData();
    };

    if (targetRole === 'admin' && action === 'grant') {
      triggerConfirmation(
        '⚠️ CRITICAL: Promote User to Root Admin?',
        'You are about to delegate FULL system modification privileges (bypass RLS write checks, alter product catalog, view compliance logs) to this student profile. This action cannot be revoked without primary db access.',
        performRoleChange
      );
    } else {
      triggerConfirmation(
        `Confirm role changes?`,
        `Are you sure you want to ${action} the role "${targetRole}" for this user?`,
        performRoleChange
      );
    }
  };

  // 6. CATEGORIES & BRANDS HUD HANDLERS
  const handleCreateCategory = async () => {
    if (!newCatName || !newCatSlug) {
      toast.error('Please input a valid category name and relative slug pathway.');
      return;
    }
    try {
      await adminService.createCategory(newCatName, newCatSlug, newCatParent);
      toast.success(`Catalog Node [${newCatName}] inserted successfully!`);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatParent(null);
      loadDashboardData();
    } catch {
      toast.error('Node serialization conflict.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    triggerConfirmation(
      '⚠️ Confirm Category Deletion?',
      'Deleting this hierarchy parent can orphan product records and fail catalog list renders in client routes! Please double check references before finalizing.',
      async () => {
        await adminService.deleteCategory(id);
        toast.info('Category node removed.');
        loadDashboardData();
      }
    );
  };

  const handleCreateBrand = async () => {
    if (!newBrandName) return;
    try {
      await adminService.createBrand(newBrandName);
      toast.success(`Catalog Brand [${newBrandName}] created!`);
      setNewBrandName('');
      loadDashboardData();
    } catch {}
  };

  const handleToggleBrand = async (id: string) => {
    try {
      await adminService.toggleBrandActive(id);
      toast.success('Market visibility mutated for brand.');
      loadDashboardData();
    } catch {}
  };

  const handleDeleteBrand = async (id: string) => {
    triggerConfirmation(
      'Remove Brand Entry?',
      'This deletes the brand record from campus selectors entirely.',
      async () => {
        await adminService.deleteBrand(id);
        toast.success('Brand metadata destroyed.');
        loadDashboardData();
      }
    );
  };

  // 7. FLASH SALES & PROMO HANDLERS
  const handlePromoAction = async (id: string, status: 'active' | 'rejected') => {
    try {
      await adminService.resolvePromoAd(id, status);
      toast.success(`Spotlight campaign is now ${status.toUpperCase()}`);
      loadDashboardData();
    } catch {}
  };

  const handleCreateFlashSale = async () => {
    if (!newFlashTitle || !newFlashStarts || !newFlashEnds) {
      toast.error('Flash promotions require title and start/end dates.');
      return;
    }
    try {
      await adminService.createFlashSale(
        newFlashTitle, 
        parseInt(newFlashDiscount), 
        new Date(newFlashStarts).toISOString(), 
        new Date(newFlashEnds).toISOString()
      );
      toast.success(`Active discount block triggered!`);
      setNewFlashTitle('');
      setNewFlashDiscount('10');
      loadDashboardData();
    } catch {}
  };

  // Searches filters
  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearchText.toLowerCase()) ||
    p.username?.toLowerCase().includes(userSearchText.toLowerCase()) ||
    p.email?.toLowerCase().includes(userSearchText.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(l => 
    l.action.toLowerCase().includes(auditSearchText.toLowerCase()) ||
    l.target_type.toLowerCase().includes(auditSearchText.toLowerCase()) ||
    l.actor_id.toLowerCase().includes(auditSearchText.toLowerCase()) ||
    l.reason?.toLowerCase().includes(auditSearchText.toLowerCase())
  );

  // Statistics summaries
  const totalUsersCount = profiles.length;
  const activeListingsCount = moderationItems.filter(i => i.status === 'resolved' && i.resolution === 'approved').length;
  const pendingModCount = moderationItems.filter(i => i.status === 'open' || i.status === 'assigned').length;
  const pendingVerCount = verifications.filter(v => v.status === 'pending').length;
  const openReportsCount = reports.filter(r => r.status === 'open').length;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col hidden lg:flex select-none">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-none">KIBABUI</span>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mt-1">Admin Console</span>
              </div>
            </Link>
          </div>

          <button 
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-all text-left group cursor-pointer"
            title="Return to the marketplace"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Marketplace</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            Control Hub
          </button>
          
          <button 
            onClick={() => setActiveTab('moderation')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'moderation' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <CheckSquare className="w-5 h-5 flex-shrink-0" />
            Moderation Queue
            {pendingModCount > 0 && <Badge className="ml-auto bg-amber-500 text-black border-none font-bold text-[10px] rounded-full">{pendingModCount}</Badge>}
          </button>

          <button 
            onClick={() => setActiveTab('reports')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            Flagged Products
            {openReportsCount > 0 && <Badge className="ml-auto bg-rose-500 text-white border-none font-bold text-[10px] rounded-full">{openReportsCount}</Badge>}
          </button>

          <button 
            onClick={() => setActiveTab('user_verifications')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'user_verifications' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <FileCheck2 className="w-5 h-5 flex-shrink-0" />
            Credential Verification
            {pendingVerCount > 0 && <Badge className="ml-auto bg-blue-500 text-white border-none font-bold text-[10px] rounded-full">{pendingVerCount}</Badge>}
          </button>

          <button 
            onClick={() => setActiveTab('campus')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'campus' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <School className="w-5 h-5 flex-shrink-0" />
            Campus Registry
            {memberships.length > 0 && <Badge className="ml-auto bg-emerald-500 text-black border-none font-bold text-[10px] rounded-full">{memberships.length}</Badge>}
          </button>

          <button 
            onClick={() => setActiveTab('users')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            User Indexing
          </button>

          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'catalog' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <FolderTree className="w-5 h-5 flex-shrink-0" />
            Inventory & Brands
          </button>

          <button 
            onClick={() => setActiveTab('promotions')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'promotions' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            Promo Campaigns
          </button>

          <button 
            onClick={() => setActiveTab('audit')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'audit' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            Security Audit Logs
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 rounded-2xl font-bold h-11 text-xs cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Store className="mr-2.5 h-4 w-4 text-emerald-400" />
            Exit to Marketplace
          </Button>

          <Button variant="ghost" className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl font-bold h-11 text-xs cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2.5 h-4 w-4" />
            Logout Securely
          </Button>
        </div>
      </aside>

      {/* Main Command Stage */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Mobile Navbar Header */}
        <header className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="text-slate-300 hover:text-white hover:bg-slate-900 h-9 w-9 rounded-xl border border-slate-800 cursor-pointer"
              title="Back to Marketplace"
              aria-label="Back to Marketplace"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
            </Button>
            <Link to="/" className="font-extrabold tracking-tight text-emerald-400 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4.5 h-4.5" /> KIBABUI ADMIN
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="border-slate-800 text-slate-300 bg-slate-900 hover:text-white text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Store</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-slate-800 text-slate-300 bg-slate-900 rounded-xl h-9 w-9 cursor-pointer">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-slate-950 border-r-0 text-white w-[280px]">
                <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      <span className="font-black text-lg tracking-tight">Console Command</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => navigate('/')}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Marketplace
                    </button>
                  </div>
                  
                  <nav className="flex-grow space-y-1.5 py-6 overflow-y-auto">
                    {['overview', 'moderation', 'reports', 'user_verifications', 'campus', 'users', 'catalog', 'promotions', 'audit'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab as any);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left text-sm ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        <span className="capitalize">{tab.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </nav>

                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <Button variant="outline" className="w-full justify-start border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/')}>
                      <Store className="mr-2 h-4 w-4 text-emerald-400" /> Exit to Store
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-rose-400 hover:bg-rose-500/10 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Global Hub Action Area */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8 flex-grow">
          
          <div className="flex flex-col gap-3">
            {/* Top Back Breadcrumb navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.history.length > 2) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-bold group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Marketplace</span>
              </button>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-slate-400 text-xs font-semibold">Admin Panel</span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-emerald-400 text-xs font-bold capitalize">{activeTab.replace('_', ' ')}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Central Console</p>
                <h1 className="text-3xl font-black text-white capitalize">{activeTab.replace('_', ' ')} Console</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')} 
                  className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white font-semibold flex items-center gap-2 h-10 bg-slate-950 cursor-pointer"
                  title="Return to the marketplace"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Back to Marketplace</span>
                  <span className="sm:hidden">Exit</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadDashboardData} 
                  className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white font-semibold flex items-center gap-2 h-10 bg-slate-950 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-400">Syncing database changes...</p>
            </div>
          ) : (
            <>
              {/* ======================= OVERVIEW TAB ======================= */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Metric Bento Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-slate-800 bg-slate-950 text-white">
                      <CardContent className="p-5">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total User Base</p>
                        <p className="text-3xl font-black mt-2 text-emerald-400">{totalUsersCount}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium">Synced profiles list</span>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-950 text-white">
                      <CardContent className="p-5">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Listings</p>
                        <p className="text-3xl font-black mt-2 text-white">{activeListingsCount}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium">Standard products</span>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-950 text-white">
                      <CardContent className="p-5">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Mod Queue</p>
                        <p className="text-3xl font-black mt-2 text-amber-400">{pendingModCount}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium">Awaiting review</span>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-950 text-white">
                      <CardContent className="p-5">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flagged Abuse Tasks</p>
                        <p className="text-3xl font-black mt-2 text-rose-400">{openReportsCount}</p>
                        <span className="text-[10px] mt-2 block text-rose-400/80 font-semibold uppercase tracking-widest text-[8px] flex items-center gap-1">
                          ● Urgent Review Required
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-950 text-white">
                      <CardContent className="p-5 font-bold">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending ID Verification</p>
                        <p className="text-3xl font-black mt-2 text-blue-400">{pendingVerCount}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium">Kibabii Student ID Uploads</span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Grid Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Graph block */}
                    <Card className="lg:col-span-2 border-slate-800 bg-slate-950 text-white rounded-[24px]">
                      <CardHeader className="p-6">
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-500" /> Compliance Metrics
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Approvals versus student abuse complaints reviewed weekly</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRep" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="day" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} />
                            <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
                            <Area type="monotone" dataKey="verifications" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVer)" name="Approvals" />
                            <Area type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRep)" name="Reports" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Quick Access Actions & System Status */}
                    <div className="space-y-6">
                      <Card className="border-slate-800 bg-slate-950 text-white rounded-[24px]">
                        <CardHeader className="p-6">
                          <CardTitle className="text-lg font-black">Admin Command Shortcuts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-3">
                          <button onClick={() => setActiveTab('moderation')} className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-850 rounded-xl font-bold transition-all text-sm">
                            <span>Open Moderation Stage</span>
                            <Badge className="bg-amber-500/10 text-amber-400 border-none">Active Queue</Badge>
                          </button>
                          
                          <button onClick={() => setActiveTab('users')} className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-850 rounded-xl font-bold transition-all text-sm">
                            <span>Manage Student Privileges</span>
                            <Badge className="bg-blue-500/10 text-blue-400 border-none">Users DB</Badge>
                          </button>

                          <button onClick={() => setActiveTab('catalog')} className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-850 rounded-xl font-bold transition-all text-sm">
                            <span>Modify Active Taxonomy Trees</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none">Core CRUD</Badge>
                          </button>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-800 bg-slate-950 text-slate-300 rounded-[24px]">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-400" />
                            <span className="font-extrabold text-sm text-white uppercase tracking-wider">Security State</span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-400">
                            Current session encrypted with RSA. Root controls activated. Standard audits will trace all modifications back to admin log entries.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                </div>
              )}

              {/* ======================= MODERATION TAB ======================= */}
              {activeTab === 'moderation' && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl w-full max-w-xl">
                      {(['pending_review', 'active', 'sold', 'rejected', 'all'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setSelectedListingTab(tab);
                            setRejectingListingId(null);
                          }}
                          className={`flex-1 px-4 py-2 font-bold text-xs rounded-lg transition-all capitalize ${
                            selectedListingTab === tab ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab === 'pending_review' ? 'Pending Review' : tab === 'sold' ? 'Sold' : tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const filteredListings = adminListings.filter(item => {
                      if (selectedListingTab === 'all') return true;
                      return item.status === selectedListingTab;
                    });

                    if (filteredListings.length === 0) {
                      return (
                        <div className="p-20 text-center bg-slate-950 border border-slate-800 rounded-[24px] flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-lg text-white">No Listings Found</h3>
                          <p className="text-sm text-slate-500">There are no listings matching this status category.</p>
                        </div>
                      );
                    }

                    const statusColors: Record<string, string> = {
                      pending_review: '#F59E0B',  // amber
                      active:         '#10B981',  // green
                      sold:           '#6366F1',  // indigo
                      rejected:       '#EF4444',  // red
                      archived:       '#6B7280',  // grey
                      draft:          '#6B7280',
                    };

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map(item => {
                          const targetListingId = item.listing_id || item.id;
                          const imageUrl = item.image_url 
                            || item.accommodation_image 
                            || item.product_image 
                            || (item.images && item.images[0])
                            || null;

                          const displayPrice = item.price_display 
                            || (item.price_per_month ? `KSh ${Number(item.price_per_month).toLocaleString('en-KE')}/mo` 
                            : item.price ? `KSh ${Number(item.price).toLocaleString('en-KE')}` 
                            : 'Listing Notice');

                          return (
                            <Card key={item.id} className="border-slate-800 bg-slate-950 text-white rounded-[20px] overflow-hidden flex flex-col justify-between">
                              <div>
                                {imageUrl ? (
                                  <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
                                    <img src={imageUrl} className="w-full h-full object-cover" alt={item.title} />
                                  </div>
                                ) : (
                                  <div className="aspect-video w-full bg-slate-900 flex items-center justify-center text-slate-600">
                                    {item.listing_type === 'accommodation' ? <Home className="w-12 h-12" /> :
                                     item.listing_type === 'service' ? <Wrench className="w-12 h-12" /> :
                                     item.listing_type === 'lost_found' ? <HelpCircle className="w-12 h-12" /> :
                                     item.listing_type === 'event' ? <Calendar className="w-12 h-12" /> :
                                     <Package className="w-12 h-12" />}
                                  </div>
                                )}
                                
                                <CardContent className="p-6 space-y-4">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    {item.listing_type === 'accommodation' ? (
                                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase text-[10px] font-bold flex items-center gap-1">
                                        <Home className="w-3 h-3" /> ACCOMMODATION
                                      </Badge>
                                    ) : item.listing_type === 'service' ? (
                                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase text-[10px] font-bold flex items-center gap-1">
                                        <Wrench className="w-3 h-3" /> SERVICE
                                      </Badge>
                                    ) : item.listing_type === 'lost_found' ? (
                                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase text-[10px] font-bold flex items-center gap-1">
                                        <HelpCircle className="w-3 h-3" /> LOST & FOUND
                                      </Badge>
                                    ) : item.listing_type === 'event' ? (
                                      <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase text-[10px] font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> EVENT
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase text-[10px] font-bold flex items-center gap-1">
                                        <Package className="w-3 h-3" /> PRODUCT
                                      </Badge>
                                    )}
                                    
                                    <Badge 
                                      style={{ backgroundColor: statusColors[item.status] || '#6B7280' }}
                                      className="text-white border-none text-[10px] px-2.5 py-0.5 rounded-full capitalize"
                                    >
                                      {item.status === 'pending_review' ? 'Pending Review' :
                                       item.status === 'active' ? 'Active' :
                                       item.status === 'rejected' ? 'Rejected' :
                                       item.status}
                                    </Badge>
                                  </div>

                                  <div>
                                    <h3 className="font-bold text-lg text-white line-clamp-1" title={item.title}>
                                      {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">
                                      {displayPrice} | {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </p>
                                    {(item.owner_name || item.owner_email) && (
                                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                                        Posted by: {item.owner_name || item.owner_email}
                                      </p>
                                    )}
                                    {item.description && (
                                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                    {item.status === 'rejected' && item.rejection_reason && (
                                      <div className="mt-2.5 p-2 bg-rose-950/40 border border-rose-900/50 rounded-lg text-xs text-rose-300">
                                        <span className="font-bold">Rejection note:</span> {item.rejection_reason}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </div>

                              <CardContent className="p-6 pt-0 border-t border-slate-900/40 mt-auto">
                                {item.status === 'pending_review' && (
                                  <div className="space-y-3 pt-4">
                                    {rejectingListingId === targetListingId ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          placeholder="Specify why the listing fails KibabiiMarket guidelines..."
                                          className="bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            onClick={() => rejectListing(targetListingId, rejectionReason)}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-9"
                                          >
                                            Confirm Reject
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => {
                                              setRejectingListingId(null);
                                              setRejectionReason('');
                                            }}
                                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl h-9"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <Button 
                                          onClick={() => approveListing(targetListingId)}
                                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl h-9 flex items-center justify-center gap-1.5"
                                        >
                                          <Check className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          onClick={() => {
                                            setRejectingListingId(targetListingId);
                                            setRejectionReason('');
                                          }}
                                          className="flex-1 bg-transparent border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 font-bold text-xs rounded-xl h-9 flex items-center justify-center gap-1.5"
                                        >
                                          <X className="w-4 h-4" /> Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Permanent Delete action for admin on any listing */}
                                <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-900/60 mt-3">
                                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={targetListingId}>
                                    ID: {String(targetListingId).slice(0, 8)}...
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setListingToDeletePermanently(item)}
                                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold text-xs rounded-xl h-8 px-2.5 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Permanently delete this listing from the database"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    Delete Permanently
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ======================= REPORTED PRODUCTS TAB ======================= */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl max-w-xs">
                    <button 
                      onClick={() => setReportFilter('open')} 
                      className={`flex-1 px-4 py-2 font-bold text-xs rounded-lg transition-all ${reportFilter === 'open' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Open Compliant Folder ({reports.length})
                    </button>
                    <button 
                      onClick={() => setReportFilter('resolved')} 
                      className={`flex-1 px-4 py-2 font-bold text-xs rounded-lg transition-all ${reportFilter === 'resolved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Resolved Alerts
                    </button>
                  </div>

                  {reports.length === 0 ? (
                    <div className="p-20 text-center bg-slate-950 border border-slate-800 rounded-[24px] flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-white">No active abuse alerts</h3>
                      <p className="text-xs text-slate-500">Kibabii campus listings report 100% policy compliance.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-[24px] overflow-hidden">
                      <div className="p-6 border-b border-slate-800 font-extrabold text-white text-base">Flagged Product File Entries</div>
                      <div className="divide-y divide-slate-850">
                        {reports.map((rep) => (
                          <div key={rep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <AlertCircle className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0" />
                              <div>
                                <h4 className="font-extrabold text-white text-base">{rep.reason}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">Reported by: <span className="text-slate-300 font-medium">{rep.reporter_name || 'Anonymous Comrade'}</span></p>
                                <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/10">{rep.details}</p>
                                
                                {rep.product_title && (
                                  <div className="flex items-center gap-3 mt-4 p-2 bg-slate-900/80 rounded-xl border border-slate-800 border-dashed max-w-sm">
                                    {rep.product_image && <img src={rep.product_image} className="w-10 h-10 object-cover rounded-lg" alt="" />}
                                    <div>
                                      <p className="text-xs font-bold text-white truncate max-w-xs">{rep.product_title}</p>
                                      <p className="text-[10px] text-emerald-400 font-extrabold">KES {rep.product_price?.toLocaleString()}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {rep.status === 'open' && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => setSelectedReport(rep)} className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl h-10">
                                  Review Complaint
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================= CREDENTIAL VERIFICATION TAB ======================= */}
              {activeTab === 'user_verifications' && (
                <div className="space-y-6">
                  <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl max-w-xs">
                    <button 
                      onClick={() => setVerificationFilter('pending')} 
                      className={`flex-1 px-4 py-2 font-bold text-xs rounded-lg transition-all ${verificationFilter === 'pending' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Pending Approval ({verifications.length})
                    </button>
                    <button 
                      onClick={() => setVerificationFilter('verified')} 
                      className={`flex-1 px-4 py-2 font-bold text-xs rounded-lg transition-all ${verificationFilter === 'verified' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Verified Lists
                    </button>
                  </div>

                  {verifications.length === 0 ? (
                    <div className="p-20 text-center bg-slate-950 border border-slate-800 rounded-[24px] flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-white">No verification requests pending</h3>
                      <p className="text-xs text-slate-500">All registered shop operators and student profiles are verified.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {verifications.map((req) => (
                        <Card key={req.id} className="border-slate-800 bg-slate-950 text-white rounded-[24px] overflow-hidden">
                          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                              <Badge className="bg-slate-900 border-none text-[9px] uppercase font-black text-blue-400 tracking-wider px-2 py-1">
                                {req.verification_type?.replace('_', ' ')}
                              </Badge>
                              <h4 className="font-black text-white text-base mt-1.5">{req.user_name || 'Kibabii Student'}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{req.user_email}</p>
                            </div>
                            <span className="text-xs font-mono text-slate-400">Ref: {req.reference_number}</span>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            <div className="aspect-video w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group cursor-pointer" onClick={() => setZoomImage(req.document_url)}>
                              <img src={req.document_url} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="Verification Upload" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <span className="bg-slate-900 px-3 py-1.5 font-bold text-xs text-emerald-400 rounded-lg flex items-center gap-1.5 border border-emerald-500/20">
                                  <Eye className="w-3.5 h-3.5" /> Full Document Zoom
                                </span>
                              </div>
                            </div>

                            {req.status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  onClick={() => setSelectedVerification(req)} 
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-10"
                                >
                                  Process Document
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================= CAMPUS MEMBERSHIPS TAB ======================= */}
              {activeTab === 'campus' && (
                <div className="space-y-6">
                  {memberships.length === 0 ? (
                    <div className="p-20 text-center bg-slate-950 border border-slate-800 rounded-[24px] flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-white">Campus Directory Clean</h3>
                      <p className="text-xs text-slate-500">Every student membership record has been approved.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-[24px] overflow-hidden">
                      <div className="p-6 border-b border-slate-800 font-black text-white text-base">Campus Group Registration Queue</div>
                      <div className="divide-y divide-slate-850">
                        {memberships.map((mem) => (
                          <div key={mem.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900/50 transition-colors">
                            <div>
                              <h4 className="font-extrabold text-white text-base">{mem.user_name}</h4>
                              <p className="text-xs text-slate-400">Student ID Reg Num: <span className="text-emerald-400 font-mono text-xs">{mem.student_id_number}</span></p>
                              <Badge className="bg-slate-900 border-none text-[10px] text-slate-300 mt-2 px-2.5 py-1">
                                Target Node: {mem.campus_name || 'Main Campus'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => handleCampusAction(mem.id, 'active')} className="bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl h-9">
                                Appoint Student
                              </Button>
                              <Button size="sm" onClick={() => handleCampusAction(mem.id, 'rejected')} className="bg-rose-600/15 text-rose-400 hover:bg-rose-500/20 hover:text-white font-extrabold rounded-xl h-9">
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================= USER INDEXING TAB ======================= */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 border border-slate-800 rounded-2xl max-w-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users by name, email or handle..." 
                      className="bg-transparent border-none text-white placeholder:text-slate-500 font-medium text-xs focus:ring-0 flex-1 outline-none"
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                    />
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-[24px] overflow-hidden">
                    <div className="p-6 border-b border-slate-800 font-black text-white text-base">Active Registered Profiles Directory</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-850 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/20">
                            <th className="p-5">Partner Profile</th>
                            <th className="p-5">Email Address</th>
                            <th className="p-5">Security Status</th>
                            <th className="p-5">Granted Roles</th>
                            <th className="p-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredProfiles.map((prof) => (
                            <tr key={prof.id} className="hover:bg-slate-900/30 transition-colors text-slate-200">
                              <td className="p-5 flex items-center gap-3">
                                <div className="w-10 h-10 bg-inherit border border-slate-800 flex items-center justify-center font-extrabold text-sm text-emerald-400 rounded-xl overflow-hidden">
                                  {prof.avatar_url ? <img src={prof.avatar_url} className="w-full h-full object-cover" alt="" /> : prof.full_name?.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-extrabold block text-sm text-white">{prof.full_name}</span>
                                  <span className="text-[11px] text-slate-500 font-mono">@{prof.username || 'comrade'}</span>
                                </div>
                              </td>
                              <td className="p-5 text-xs font-mono">{prof.email}</td>
                              <td className="p-5">
                                <Badge className={`border-none text-[9px] uppercase font-black ${prof.is_verified || prof.verification_status === 'verified' || prof.student_verification_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                                  {prof.is_verified || prof.verification_status === 'verified' || prof.student_verification_status === 'approved' ? 'Verified Partner' : 'Unverified'}
                                </Badge>
                              </td>
                              <td className="p-5 space-x-1">
                                {(prof.roles || [prof.role]).map((r: string) => (
                                  <Badge key={r} className="bg-slate-900 border-none text-[9px] text-emerald-400 capitalize px-2 font-bold select-none">{r}</Badge>
                                ))}
                              </td>
                              <td className="p-5 text-right">
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedProfile(prof)} 
                                  className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white font-extrabold rounded-lg h-8"
                                >
                                  Modify Privileges
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================= CATALOG & BRANDS TREE TAB ======================= */}
              {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Category Tree List */}
                  <Card className="border-slate-800 bg-slate-950 text-white rounded-[24px]">
                    <CardHeader className="p-6 border-b border-slate-850">
                      <CardTitle className="text-base font-extrabold">Active Product Categories Trees</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Standard schema organization blocks for marketplace discoverability</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      {/* Tree View */}
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {categories.filter(c => !c.parent_id).map((parent) => {
                          const children = categories.filter(c => c.parent_id === parent.id);
                          return (
                            <div key={parent.id} className="p-4 bg-slate-900 rounded-xl space-y-3 border border-slate-850">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                  <span className="font-extrabold text-sm">{parent.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">/{parent.slug}</span>
                                </div>
                                <button onClick={() => handleDeleteCategory(parent.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {children.length > 0 && (
                                <div className="pl-6 border-l border-slate-800 mt-2 space-y-2">
                                  {children.map(child => (
                                    <div key={child.id} className="flex justify-between items-center text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850/20">
                                      <span>{child.name} <span className="text-[9px] text-slate-600">/{child.slug}</span></span>
                                      <button onClick={() => handleDeleteCategory(child.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Category Form */}
                      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl space-y-3.5 border border-slate-850/50">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Create Catalog Categorization Node</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input 
                            placeholder="Name (e.g. Laptops)" 
                            className="bg-slate-900 border-slate-800 h-10 text-xs placeholder:text-slate-500 rounded-xl"
                            value={newCatName}
                            onChange={(e) => {
                              setNewCatName(e.target.value);
                              setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                            }}
                          />
                          <Input 
                            placeholder="Relative Slug Pathway" 
                            className="bg-slate-900 border-slate-800 h-10 text-xs placeholder:text-slate-500 rounded-xl"
                            value={newCatSlug}
                            onChange={(e) => setNewCatSlug(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Select onValueChange={(val: string) => setNewCatParent(val === 'none' ? null : val)}>
                            <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-slate-300 rounded-xl h-10">
                              <SelectValue placeholder="Parent Node Select (Optional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-800 text-white">
                              <SelectItem value="none" className="text-xs font-medium">None (Root Category)</SelectItem>
                              {categories.filter(c => !c.parent_id).map((par) => (
                                <SelectItem key={par.id} value={par.id} className="text-xs font-medium">{par.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleCreateCategory} className="bg-emerald-600 hover:bg-emerald-500 font-extrabold h-10 px-4 rounded-xl flex items-center gap-1 flex-shrink-0 text-xs">
                            <Plus className="w-4 h-4" /> Save Node
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Brands List */}
                  <Card className="border-slate-800 bg-slate-950 text-white rounded-[24px]">
                    <CardHeader className="p-6 border-b border-slate-850">
                      <CardTitle className="text-base font-extrabold">Device Brands Directory</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Toggle campus selectors for popular brands in student shopping pathways</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      <div className="divide-y divide-slate-850 border border-slate-850 rounded-xl overflow-hidden bg-slate-900/60 max-h-[350px] overflow-y-auto">
                        {brands.map((brand) => (
                          <div key={brand.id} className="p-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-white">{brand.name}</span>
                              <Badge className={`border-none text-[8px] uppercase font-bold px-1.5 py-0.5 ${brand.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'}`}>
                                {brand.is_active ? 'Visible' : 'Hidden'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleToggleBrand(brand.id)}
                                className="border-slate-800 hover:bg-slate-850 font-bold text-[10px] h-8 rounded-lg bg-slate-950 text-slate-300"
                              >
                                {brand.is_active ? 'Hide' : 'Activate'}
                              </Button>
                              <button onClick={() => handleDeleteBrand(brand.id)} className="text-slate-600 hover:text-rose-400 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input 
                          placeholder="Brand Catalog Name (e.g. Dell)" 
                          className="bg-slate-900 border-slate-800 text-xs placeholder:text-slate-500 h-11 rounded-xl"
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                        />
                        <Button onClick={handleCreateBrand} className="bg-emerald-600 hover:bg-emerald-500 font-extrabold h-11 rounded-xl text-xs flex items-center gap-1 flex-shrink-0 px-4">
                          <Plus className="w-4 h-4" /> Add Brand
                        </Button>
                      </div>

                    </CardContent>
                  </Card>

                </div>
              )}

              {/* ======================= PROMOTIONS & FLASH SALES TAB ======================= */}
              {activeTab === 'promotions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Spotlight approvals */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-800 bg-slate-950 text-white rounded-[24px] overflow-hidden">
                      <div className="p-6 border-b border-slate-850 font-black text-white text-base">Spotlight Event & Store Promotions Reviews</div>
                      <div className="divide-y divide-slate-850">
                        {promoAds.map((ad) => (
                          <div key={ad.id} className="p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-extrabold text-white text-base">{ad.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">Proposed by: <span className="text-emerald-400 font-bold">{ad.owner_name}</span></p>
                              </div>
                              <Badge className={`border-none uppercase text-[9px] font-bold ${ad.status === 'pending_review' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {ad.status?.replace('_', ' ')}
                              </Badge>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{ad.description}</p>
                            
                            {ad.banner_url && (
                              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-850">
                                <img src={ad.banner_url} className="w-full h-full object-cover" alt="" />
                              </div>
                            )}

                            {ad.status === 'pending_review' && (
                              <div className="flex items-center gap-2 pt-2">
                                <Button size="sm" onClick={() => handlePromoAction(ad.id, 'active')} className="bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl h-10 px-6">
                                  Approve Spot
                                </Button>
                                <Button size="sm" onClick={() => handlePromoAction(ad.id, 'rejected')} className="bg-rose-600/15 text-rose-400 hover:bg-rose-500/20 hover:text-white font-extrabold rounded-xl h-10 px-6">
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Flash Sales Scheduler */}
                  <div className="space-y-6">
                    <Card className="border-slate-800 bg-slate-950 text-white rounded-[24px]">
                      <CardHeader className="p-6">
                        <CardTitle className="text-base font-extrabold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-400 animate-pulse" /> Active Flash Discounts
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Configure sitewide percent banners for specific date ranges</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        
                        <div className="space-y-4">
                          {flashSales.map((sale) => (
                            <div key={sale.id} className="p-4 bg-slate-900 border border-slate-850 rounded-xl">
                              <p className="font-extrabold text-sm">{sale.title}</p>
                              <div className="flex justify-between items-center mt-2.5">
                                <span className="text-emerald-400 font-extrabold text-xs">{sale.discount_percentage}% OFF Site-Wide</span>
                                <Badge className="bg-emerald-600 border-none text-[8px] font-bold text-white uppercase">{sale.status}</Badge>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-2.5 font-mono">
                                Ends: {new Date(sale.ends_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Schedule Flash Form */}
                        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-850 space-y-4">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Configure Flash Period</Label>
                          <div className="space-y-2.5">
                            <Input 
                              placeholder="Period Title (e.g. End of Term discount)" 
                              className="bg-slate-950 border-slate-800 text-xs rounded-xl h-10 placeholder:text-slate-600"
                              value={newFlashTitle}
                              onChange={(e) => setNewFlashTitle(e.target.value)}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500 font-bold uppercase">Discount %</Label>
                                <Input 
                                  type="number" 
                                  value={newFlashDiscount}
                                  onChange={(e) => setNewFlashDiscount(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-10 rounded-xl"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500 font-bold uppercase">Start Date</Label>
                                <Input 
                                  type="date" 
                                  value={newFlashStarts}
                                  onChange={(e) => setNewFlashStarts(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-10 rounded-xl text-slate-300"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-bold uppercase">Expiration Date</Label>
                              <Input 
                                type="date" 
                                value={newFlashEnds}
                                onChange={(e) => setNewFlashEnds(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-10 rounded-xl text-slate-300"
                              />
                            </div>
                          </div>

                          <Button onClick={handleCreateFlashSale} className="bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl w-full h-11 text-xs">
                            Activate Flash Banner
                          </Button>
                        </div>

                      </CardContent>
                    </Card>
                  </div>

                </div>
              )}

              {/* ======================= AUDIT LOGS TAB ======================= */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 border border-slate-800 rounded-2xl max-w-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filter audit logs by action or actor..." 
                      className="bg-transparent border-none text-white placeholder:text-slate-500 font-medium text-xs focus:ring-0 flex-1 outline-none"
                      value={auditSearchText}
                      onChange={(e) => setAuditSearchText(e.target.value)}
                    />
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-[24px] overflow-hidden">
                    <div className="p-6 border-b border-slate-800 font-black text-white text-base">Authorized Activity Audit Records</div>
                    <div className="divide-y divide-slate-850 font-mono">
                      {filteredLogs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        return (
                          <div key={log.id} className="p-5 space-y-3 hover:bg-slate-900/40 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <Badge className="bg-slate-900 border-none text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                                  {log.action}
                                </Badge>
                                <span className="text-slate-400 text-xs">Actor: <span className="text-slate-200 font-semibold">{log.actor_name || log.actor_id}</span></span>
                                <span className="text-slate-500 text-xs">| Target: {log.target_type} ({log.target_id})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                                <button 
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                  {isExpanded ? 'Collapse Payload' : 'Inspect Payload'} 
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            
                            {log.reason && <p className="text-slate-400 text-xs pl-2.5 border-l-2 border-emerald-500">Reason statement: {log.reason}</p>}
                            
                            {/* Collapsible JSON Diffs panel */}
                            {isExpanded && (
                              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 space-y-4 text-[10px] overflow-x-auto text-slate-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">State Prior</p>
                                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 max-h-48 overflow-y-auto font-mono text-xs">
                                      {JSON.stringify(log.before_state, null, 2) || '{}'}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">State Subsequents</p>
                                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 max-h-48 overflow-y-auto font-mono text-xs">
                                      {JSON.stringify(log.after_state, null, 2) || '{}'}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ==================================================================== */}
      {/* 8. DYNAMIC ADMINISTRATIVE ACTION DIALOG MODALS                         */}
      {/* ==================================================================== */}
      
      {/* A. PRODUCT REVIEW DIALOG */}
      {selectedListing && (
        <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" /> Compliance Asset Check
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Examine listing for prohibited objects, malicious links or pricing fraud.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedListing.item_details?.images?.[0] && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-900 flex items-center justify-center p-2">
                  <img src={selectedListing.item_details.images[0]} className="w-full h-full object-contain" alt="" />
                </div>
              )}

              <div className="space-y-2">
                <Badge className="bg-slate-900 border-none text-[10px] text-emerald-400 capitalize">{selectedListing.item_type}</Badge>
                <h3 className="text-xl font-black text-white">{selectedListing.item_details?.title}</h3>
                <p className="text-xs text-slate-400">Post owner ID: <span className="text-slate-300 font-mono font-bold">{selectedListing.item_details?.seller_id}</span></p>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 text-sm text-slate-300 leading-relaxed">
                {selectedListing.item_details?.description}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Estimated Price</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">KES {selectedListing.item_details?.price?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Queue Priority</p>
                  <p className="text-sm font-black text-amber-400 capitalize mt-1.5">{selectedListing.priority} priority</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection" className="text-xs font-black uppercase text-slate-400">Compliance Denial Reason (only on Reject)</Label>
                <Textarea 
                  id="rejection" 
                  placeholder="Specify why the listing fails KibabiiMarket general terms..." 
                  className="bg-slate-900 border-slate-800 text-sm rounded-xl placeholder:text-slate-600 focus:ring-emerald-500"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                onClick={() => handleModerationResolve(selectedListing.id, 'approved')} 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl"
              >
                {isSubmitting ? 'Approving...' : 'Approve post'}
              </Button>
              <Button 
                onClick={() => handleModerationResolve(selectedListing.id, 'rejected')} 
                disabled={isSubmitting}
                className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border-none font-extrabold rounded-xl"
              >
                Deny access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* B. COMPLAINTS EXAMINER */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-1.5 text-rose-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> Restrict Flagged Assets
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Take proactive moderation checks on reported student merchandise.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs font-bold leading-normal">
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl">
                <div className="flex gap-2">
                  <span className="text-slate-400 font-bold">Category Code:</span> 
                  <span className="text-white text-xs">{selectedReport.reason}</span>
                </div>
                <p className="text-slate-300 font-medium text-sm mt-2 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
                  {selectedReport.details}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-extrabold text-[10px] uppercase">Compliance notes / Expiration feedback</Label>
                <Textarea 
                  placeholder="Explain why the listing was forcefully taken down..." 
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl h-16 placeholder:text-slate-600"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                onClick={() => handleReportAction(selectedReport.id, 'resolved')} 
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl"
              >
                Force Take Down
              </Button>
              <Button 
                onClick={() => handleReportAction(selectedReport.id, 'dismissed')} 
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-extrabold rounded-xl border border-slate-800"
              >
                Dismiss Complaint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* C. CREDENTIALS EVALUATOR */}
      {selectedVerification && (
        <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" /> Verify Identity Certificates
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Ensure uploaded reference numbers match official Kibabii University registrars.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs font-bold leading-normal">
              <div className="p-4 bg-slate-900 rounded-xl space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-black">Student Certificate Ref</p>
                <p className="text-white text-base font-mono">{selectedVerification.reference_number}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-extrabold text-[10px] uppercase">Rejection details (if declining)</Label>
                <Textarea 
                  placeholder="Provide checklist reason for rejection..." 
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl h-16 placeholder:text-slate-600"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                onClick={() => handleVerificationAction(selectedVerification.id, 'verified')} 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl"
              >
                Approve & Verify User
              </Button>
              <Button 
                onClick={() => handleVerificationAction(selectedVerification.id, 'rejected')} 
                disabled={isSubmitting}
                className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-extrabold rounded-xl"
              >
                Reject Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* D. PRIVILEGE DELEGATION HUB */}
      {selectedProfile && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-emerald-400" /> Alter Security Clearances
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Grant or revoke application level security roles on KibabiiMarket database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-850">
                <div className="w-10 h-10 bg-slate-950 flex items-center justify-center rounded-lg border border-slate-800 font-mono text-emerald-400 font-extrabold text-sm">
                  {selectedProfile.full_name?.charAt(0)}
                </div>
                <div>
                  <span className="font-extrabold block text-sm text-white">{selectedProfile.full_name}</span>
                  <span className="text-xs text-slate-500 font-mono">@{selectedProfile.username}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assign DB Role Privilege</Label>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { role: 'admin', label: 'Console Administrator', desc: 'Full write access bypassing Row-Level Security policies.' },
                    { role: 'shop_owner', label: 'Official Shop Owner', desc: 'Privilege to list promotions, brand catalogs, and flash events.' },
                    { role: 'student', label: 'Basic Student', desc: 'Standard student level marketplace interaction privileges.' }
                  ].map((roleObj) => {
                    const hasRole = (selectedProfile.roles || [selectedProfile.role]).includes(roleObj.role);
                    return (
                      <div key={roleObj.role} className="p-4 bg-slate-900 hover:bg-slate-850/80 rounded-xl border border-slate-850 flex items-center justify-between gap-4 select-none">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-white">{roleObj.label}</p>
                          <p className="text-[10px] text-slate-500 leading-normal">{roleObj.desc}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleToggleUserRole(selectedProfile.id, roleObj.role, selectedProfile.roles || [selectedProfile.role])}
                          className={`font-mono text-[10px] h-8 rounded-lg ${hasRole ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          {hasRole ? 'Revoke User' : 'Grant Active'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* E. ID DOCUMENT FULL SCREEN ZOOM PORTAL */}
      {zoomImage && (
        <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-none rounded-[24px]">
            <div className="relative aspect-auto max-h-[80vh] flex items-center justify-center p-2 bg-slate-950">
              <img src={zoomImage} className="max-w-full max-h-[75vh] object-contain rounded-xl" alt="Full zoom document preview" />
              <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 bg-slate-900/80 text-white rounded-full p-2 hover:bg-slate-900 shadow border border-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* F. GENERAL CONFIRM GUARD DIALOG (RESTRICTED SENSITIVE MUTATIONS) */}
      {confirmGuard?.open && (
        <Dialog open={confirmGuard.open} onOpenChange={() => setConfirmGuard(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[24px] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce" /> {confirmGuard.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs leading-relaxed">
                {confirmGuard.description}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 mt-4">
              <Button 
                onClick={confirmGuard.onConfirm} 
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl"
              >
                {isSubmitting ? 'Confirming...' : 'Yes, commit changes'}
              </Button>
              <Button 
                onClick={() => setConfirmGuard(null)}
                variant="outline"
                className="border-slate-800 bg-slate-900 hover:bg-slate-850 font-extrabold rounded-xl text-slate-300"
              >
                Abort
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* G. PERMANENT DELETE LISTING CONFIRMATION DIALOG (IRREVERSIBLE) */}
      {listingToDeletePermanently && (
        <Dialog 
          open={!!listingToDeletePermanently} 
          onOpenChange={(open) => !open && !deletingListing && setListingToDeletePermanently(null)}
        >
          <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[24px] max-w-md p-6">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <DialogTitle className="text-lg font-black text-white">Permanently Delete Listing?</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                This action cannot be undone and permanently purges this record.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-slate-400 text-xs leading-relaxed mt-2">
              <div>
                You are about to permanently delete:
                <span className="block text-white font-bold text-sm mt-1 truncate">
                  "{listingToDeletePermanently.title}"
                </span>
                <span className="block text-[11px] text-slate-400 uppercase mt-0.5 font-semibold">
                  Category/Type: {listingToDeletePermanently.listing_type || 'listing'}
                </span>
              </div>
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-300 text-[11px] font-medium leading-relaxed">
                ⚠️ <strong>Irreversible Action:</strong> Deletes the real underlying database row and all referencing records (images, cart entries, wishlist entries, moderation queue entries, and the listings row). There is no soft-delete or undo.
              </div>
              <p className="text-[10.5px] text-slate-400">
                Note: A product that has real order history cannot be deleted this way (the server returns an error instructing to use status removal instead).
              </p>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="ghost"
                disabled={deletingListing}
                onClick={() => setListingToDeletePermanently(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl font-bold text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                disabled={deletingListing}
                onClick={handleConfirmDeletePermanently}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-10 flex items-center justify-center gap-1.5"
              >
                {deletingListing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
