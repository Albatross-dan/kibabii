import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ModerationItem {
  id: string;
  item_type: 'product_approval' | 'accommodation_approval' | 'service_approval' | 'lost_found_approval' | 'event_approval' | 'product' | 'accommodation' | 'service' | 'lost_found' | 'event' | string;
  item_id: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'open' | 'assigned' | 'resolved' | string;
  assigned_to?: string | null;
  assigned_to_name?: string;
  resolution?: 'approved' | 'rejected' | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string;
  listing_id?: string;
  
  // Joined details populated dynamically
  item_details?: {
    title: string;
    description: string;
    price: number;
    price_display?: string;
    images: string[];
    seller_name: string;
    seller_id?: string;
    seller_email?: string;
    listing_type?: 'product' | 'accommodation' | 'service' | 'lost_found' | 'event';
    meta_info?: Record<string, any>;
  };
}

export interface ProductReport {
  id: string;
  product_id: string;
  reporter_id: string;
  reporter_name?: string;
  reason: string;
  details: string;
  status: 'open' | 'dismissed' | 'resolved';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  product_title?: string;
  product_price?: number;
  product_image?: string;
  seller_name?: string;
}

export interface UserVerification {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  verification_type: 'student_id' | 'business_permit' | 'national_id';
  document_url: string;
  reference_number: string;
  status: 'pending' | 'verified' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusMembership {
  id: string;
  user_id: string;
  user_name?: string;
  campus_id: string;
  campus_name?: string;
  student_id_number: string;
  status: 'pending' | 'active' | 'rejected';
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  target_type: string;
  target_id: string;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  reason: string | null;
  ip_address?: string;
  created_at: string;
}

export interface AdminRole {
  id: string;
  user_id: string;
  role: 'student' | 'shop_owner' | 'service_provider' | 'accommodation_owner' | 'event_organizer' | 'admin';
  granted_at: string;
  granted_by: string | null;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  logo?: string;
  created_at: string;
}

export interface AdminAdPromo {
  id: string;
  title: string;
  description: string;
  banner_url: string;
  target_url?: string;
  status: 'pending_review' | 'active' | 'rejected';
  starts_at: string;
  ends_at: string;
  owner_id: string;
  owner_name?: string;
  created_at: string;
}

export interface AdminFlashSale {
  id: string;
  title: string;
  discount_percentage: number;
  status: 'active' | 'draft' | 'expired';
  starts_at: string;
  ends_at: string;
  created_at: string;
}

// MOCK SEED DATA DEFINITIONS FOR LOCAL STORAGE FALLBACK
const INITIAL_MODERATION: ModerationItem[] = [];

try {
  localStorage.removeItem('kibabui_admin_moderation_queue');
} catch (e) {}

const INITIAL_REPORTS: ProductReport[] = [];
const INITIAL_VERIFICATIONS: UserVerification[] = [];
const INITIAL_MEMBERSHIPS: CampusMembership[] = [];

try {
  localStorage.removeItem('kibabui_admin_product_reports');
  localStorage.removeItem('kibabui_admin_user_verifications');
  localStorage.removeItem('kibabui_admin_campus_memberships');
} catch (e) {}

const INITIAL_ROLES: AdminRole[] = [];
const INITIAL_BRANDS: AdminBrand[] = [];
const INITIAL_PROMO_ADS: AdminAdPromo[] = [];
const INITIAL_FLASH_SALES: AdminFlashSale[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];

try {
  localStorage.removeItem('kibabui_admin_roles');
  localStorage.removeItem('kibabui_admin_promo_ads');
  localStorage.removeItem('kibabui_admin_flash_sales');
  localStorage.removeItem('kibabui_admin_audit_logs');
  localStorage.removeItem('kibabui_admin_brands');
} catch (e) {}

// In-memory fallback cache to guarantee operation even if localStorage is full or disabled
const memoryCache: Record<string, any> = {};

// Helper to safely write to localStorage, catching quota or security exceptions
const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`localStorage.setItem failed for key ${key}:`, err);
    return false;
  }
};

// Get and set helper for mock persistence
const getMockData = <T>(key: string, backup: T[]): T[] => {
  const cacheKey = `kibabui_admin_${key}`;
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        memoryCache[cacheKey] = parsed;
        return parsed;
      } catch {
        memoryCache[cacheKey] = backup;
        return backup;
      }
    }
  } catch (err) {
    console.warn(`localStorage.getItem failed for key ${cacheKey}:`, err);
  }

  memoryCache[cacheKey] = backup;
  safeSetItem(cacheKey, JSON.stringify(backup));
  return backup;
};

const setMockData = <T>(key: string, data: T[]) => {
  const cacheKey = `kibabui_admin_${key}`;
  // Always update our in-memory cache to maintain perfect state
  const dataToSave = key === 'audit_logs' ? data.slice(0, 20) : data; // strictly cap audit logs
  memoryCache[cacheKey] = dataToSave;

  const serialized = JSON.stringify(dataToSave);
  const success = safeSetItem(cacheKey, serialized);
  if (!success) {
    // Attempt emergency compaction for localStorage persistence, but stay operating on memoryCache
    const compacted = dataToSave.slice(0, 5);
    safeSetItem(cacheKey, JSON.stringify(compacted));
  }
};

export const adminService = {
  // 1. am_i_admin check
  async checkAdminStatus(): Promise<boolean> {
    try {
      // Call standard supabase RPC or check authenticated user's metadata/profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to active mock session validation
        const activeSessionId = localStorage.getItem('kibabui_active_session_id');
        if (activeSessionId === 'admin-user' || activeSessionId?.includes('admin')) {
          return true;
        }
        // Check local accounts database roles
        const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
        const current = accounts.find((a: any) => a.id === activeSessionId || a.email === activeSessionId);
        if (current?.role === 'admin' || current?.email === 'danieloguda11221@gmail.com' || current?.email === 'ogudadaniel11221@gmail.com') {
          return true;
        }
        return false;
      }

      // Explicitly recognize specified admin emails
      if (user.email === 'danieloguda11221@gmail.com' || user.email === 'ogudadaniel11221@gmail.com') {
        return true;
      }

      // Supabase is available, query real user roles
      const { data, error } = await supabase.rpc('am_i_admin');
      if (!error && data !== null) {
        return data as boolean;
      }

      // Check profiles or user_roles table as fallback
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!roleError && roleData) return true;

      // Check role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
        
      return profile?.role === 'admin';
    } catch {
      // Offline / Local Session Support
      const activeSessionId = localStorage.getItem('kibabui_active_session_id');
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      const current = accounts.find((a: any) => a.id === activeSessionId || a.email === activeSessionId);
      return activeSessionId === 'admin-user' || 
             current?.role === 'admin' || 
             current?.email === 'danieloguda11221@gmail.com' || 
             current?.email === 'ogudadaniel11221@gmail.com';
    }
  },

  // 2. AUDIT LOG HELPER
  async logAdminAction(params: {
    action: string;
    targetType: string;
    targetId: string;
    before: any;
    after: any;
    reason: string | null;
  }) {
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';
    const activeUserName = activeUserId === 'admin-user' ? 'Kibabii Admin' : 'Admin Staff';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dbActorId = user?.id || activeUserId;

      await supabase.from('audit_logs').insert({
        actor_id: dbActorId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        before_state: params.before,
        after_state: params.after,
        reason: params.reason,
      });
    } catch {
      // Fail nicely & fallback
    }

    // Always log to local storage fallback for live simulation
    const logs = getMockData<AuditLog>('audit_logs', INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      actor_id: activeUserId,
      actor_name: activeUserName,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      before_state: params.before,
      after_state: params.after,
      reason: params.reason,
      ip_address: '192.168.100.5',
      created_at: new Date().toISOString()
    };
    setMockData('audit_logs', [newLog, ...logs]);
  },

  // 3. SECTIONS DATA ACCESSORS

  // Helper to resolve the true listings.id from various candidate IDs
  async resolveListingId(idOrItemId: string): Promise<string | null> {
    if (!idOrItemId || typeof idOrItemId !== 'string') return null;

    try {
      // 1. Direct match on listings.id
      const { data: directListing } = await supabase
        .from('listings')
        .select('id')
        .eq('id', idOrItemId)
        .maybeSingle();

      if (directListing?.id) {
        return directListing.id;
      }

      // 2. Child relation match in listings
      const { data: subListing } = await supabase
        .from('listings')
        .select('id')
        .or(`product_id.eq.${idOrItemId},accommodation_id.eq.${idOrItemId},service_id.eq.${idOrItemId},lost_found_id.eq.${idOrItemId},event_id.eq.${idOrItemId}`)
        .maybeSingle();

      if (subListing?.id) {
        return subListing.id;
      }

      // 3. Queue item lookup
      const { data: queueRow } = await supabase
        .from('moderation_queue')
        .select('item_id')
        .eq('id', idOrItemId)
        .maybeSingle();

      if (queueRow?.item_id) {
        const { data: qListing } = await supabase
          .from('listings')
          .select('id')
          .or(`id.eq.${queueRow.item_id},product_id.eq.${queueRow.item_id},accommodation_id.eq.${queueRow.item_id},service_id.eq.${queueRow.item_id},lost_found_id.eq.${queueRow.item_id},event_id.eq.${queueRow.item_id}`)
          .maybeSingle();

        if (qListing?.id) {
          return qListing.id;
        }
      }
    } catch (err) {
      console.warn('Notice resolving listing ID:', err);
    }

    return null;
  },

  // UNIFIED LISTING APPROVE & REJECT RPCS
  async approveListing(listingId: string): Promise<{ success: boolean; listing_id?: string; error?: string }> {
    try {
      const realListingId = (await this.resolveListingId(listingId)) || listingId;

      const { data, error } = await supabase.rpc('approve_listing', {
        p_listing_id: realListingId
      });

      if (error) {
        console.warn('approve_listing RPC notice:', error.message);
        return { success: false, error: error.message };
      }
      if (data?.error) {
        console.warn('approve_listing returned notice:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, listing_id: data?.listing_id || realListingId };
    } catch (err: any) {
      console.warn('approveListing caught error:', err);
      return { success: false, error: err?.message || 'Failed to approve listing' };
    }
  },

  async rejectListing(listingId: string, reason: string | null = null): Promise<{ success: boolean; listing_id?: string; error?: string }> {
    try {
      const realListingId = (await this.resolveListingId(listingId)) || listingId;

      const { data, error } = await supabase.rpc('reject_listing', {
        p_listing_id: realListingId,
        p_reason: reason || null
      });

      if (error) {
        console.warn('reject_listing RPC notice:', error.message);
        return { success: false, error: error.message };
      }
      if (data?.error) {
        console.warn('reject_listing returned notice:', data.error);
        return { success: false, error: data.error };
      }

      if (reason) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('audit_logs').insert({
            actor_id: user?.id || null,
            action: 'LISTING_REJECTED',
            target_type: 'listings',
            target_id: realListingId,
            reason: reason
          });
        } catch (logErr) {
          console.warn('Notice recording rejection reason to audit_logs:', logErr);
        }
      }

      return { success: true, listing_id: data?.listing_id || realListingId };
    } catch (err: any) {
      console.warn('rejectListing caught error:', err);
      return { success: false, error: err?.message || 'Failed to reject listing' };
    }
  },

  // PERMANENTLY DELETE A LISTING (any of the 5 types)
  async deleteListingPermanently(
    listingIdOrItemId: string,
    context?: {
      itemType?: string;
      productId?: string;
      accommodationId?: string;
      serviceId?: string;
      lostFoundId?: string;
      eventId?: string;
      queueId?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!listingIdOrItemId) {
        return { success: false, error: 'Listing ID is required' };
      }

      // Step 1: Resolve the real listings.id if possible
      let resolvedListingId = await this.resolveListingId(listingIdOrItemId);

      if (!resolvedListingId && context) {
        const candidateId = context.productId || context.accommodationId || context.serviceId || context.lostFoundId || context.eventId || context.queueId;
        if (candidateId) {
          resolvedListingId = await this.resolveListingId(candidateId);
        }
      }

      // Step 2: If we resolved a listings.id, invoke the RPC with retry for transient fetch errors
      if (resolvedListingId) {
        let rpcData: any = null;
        let rpcError: any = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { data, error } = await supabase.rpc('admin_delete_listing', {
              p_listing_id: resolvedListingId
            });
            rpcData = data;
            rpcError = error;

            const isFetchError = String(error?.message || '').toLowerCase().includes('failed to fetch');
            if (!error || !isFetchError) {
              break;
            }
          } catch (fetchErr: any) {
            rpcError = fetchErr;
            const isFetchError = String(fetchErr?.message || '').toLowerCase().includes('failed to fetch');
            if (!isFetchError) {
              break;
            }
          }

          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 400));
          }
        }

        // If RPC completed successfully
        if (!rpcError && (!rpcData?.error || rpcData?.success === true)) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('audit_logs').insert({
              actor_id: user?.id || null,
              action: 'LISTING_PERMANENTLY_DELETED',
              target_type: 'listings',
              target_id: resolvedListingId,
              reason: 'Admin permanent deletion via RPC'
            });
          } catch (auditErr) {
            console.warn('Notice recording permanent deletion audit log:', auditErr);
          }
          return { success: true };
        }

        // Handle specific server-side rejection messages
        if (rpcData?.error) {
          if (rpcData.error === 'cannot delete product with order history — remove via status instead') {
            return { success: false, error: rpcData.error };
          }
          if (rpcData.error === 'unauthorized') {
            return { success: false, error: 'Unauthorized: Admin privileges required.' };
          }
          // If RPC returned 'listing not found', we proceed to the cascade cleanup fallback below
        }
      }

      // Step 3: Direct cascade deletion fallback
      // Handles cases where the listing row was absent, already partially purged,
      // or created directly in products/accommodations/etc.
      const targetId = listingIdOrItemId;
      const effectiveType = context?.itemType || 'product';

      // Check order history before deleting product to honor backend business contract
      if (effectiveType === 'product' || context?.productId) {
        const prodIdToCheck = context?.productId || targetId;
        try {
          const { data: existingOrders } = await supabase
            .from('order_items')
            .select('id')
            .eq('product_id', prodIdToCheck)
            .limit(1);

          if (existingOrders && existingOrders.length > 0) {
            return {
              success: false,
              error: 'cannot delete product with order history — remove via status instead'
            };
          }
        } catch (orderCheckErr) {
          console.warn('Order check warning:', orderCheckErr);
        }
      }

      // Direct cascade cleanup across all relational tables
      const prodId = context?.productId || targetId;
      const accId = context?.accommodationId || targetId;
      const srvId = context?.serviceId || targetId;
      const lfId = context?.lostFoundId || targetId;
      const evtId = context?.eventId || targetId;
      const qId = context?.queueId || targetId;

      await Promise.allSettled([
        // Product cascade
        supabase.from('product_images').delete().eq('product_id', prodId),
        supabase.from('cart_items').delete().eq('product_id', prodId),
        supabase.from('wishlist').delete().eq('product_id', prodId),
        supabase.from('product_reports').delete().eq('product_id', prodId),
        supabase.from('moderation_queue').delete().eq('item_id', prodId),
        // Accommodation cascade
        supabase.from('accommodation_images').delete().eq('accommodation_id', accId),
        supabase.from('moderation_queue').delete().eq('item_id', accId),
        // Service cascade
        supabase.from('service_images').delete().eq('service_id', srvId),
        supabase.from('moderation_queue').delete().eq('item_id', srvId),
        // Lost & found cascade
        supabase.from('lost_found_items').delete().eq('id', lfId),
        supabase.from('moderation_queue').delete().eq('item_id', lfId),
        // Event cascade
        supabase.from('events').delete().eq('id', evtId),
        supabase.from('moderation_queue').delete().eq('item_id', evtId),
        // Queue direct row deletion
        supabase.from('moderation_queue').delete().eq('id', qId),
        // Unified listings row deletion
        supabase.from('listings').delete().or(`id.eq.${targetId},product_id.eq.${prodId},accommodation_id.eq.${accId},service_id.eq.${srvId},lost_found_id.eq.${lfId},event_id.eq.${evtId}`),
        // Root entity rows
        supabase.from('products').delete().eq('id', prodId),
        supabase.from('accommodations').delete().eq('id', accId),
        supabase.from('services').delete().eq('id', srvId)
      ]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert({
          actor_id: user?.id || null,
          action: 'LISTING_PERMANENTLY_DELETED',
          target_type: 'listings',
          target_id: targetId,
          reason: 'Admin permanent deletion via cascade'
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.warn('deleteListingPermanently caught error:', err);
      return { success: false, error: err?.message || 'Failed to delete listing permanently' };
    }
  },

  // MODERATION QUEUE (All 5 Listing Types)
  async getModerationQueue(status: 'pending' | 'open' | 'resolved' | 'all' = 'pending'): Promise<ModerationItem[]> {
    try {
      let query = supabase
        .from('moderation_queue')
        .select('*')
        .in('item_type', [
          'product_approval', 'accommodation_approval',
          'service_approval', 'lost_found_approval', 'event_approval',
          'product', 'accommodation', 'service', 'lost_found', 'event'
        ])
        .order('created_at', { ascending: true });

      if (status !== 'all') {
        const queryStatus = status === 'open' ? 'pending' : status;
        query = query.eq('status', queryStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rawQueueItems = (data || []) as any[];

      // Populate dynamic details and lookup listings.id for each queue item
      const queueItems: ModerationItem[] = await Promise.all(
        rawQueueItems.map(async (row) => {
          const itemType = row.item_type || '';
          const normalizedType = itemType.replace('_approval', '');
          const itemId = row.item_id;

          let listingId = row.listing_id || '';
          let details: any = {
            title: 'Untitled Item',
            description: '',
            price: 0,
            price_display: '',
            images: [],
            seller_name: 'Student Poster',
            listing_type: normalizedType || 'product',
            meta_info: {}
          };

          try {
            if (normalizedType === 'product') {
              details.listing_type = 'product';
              const [prodRes, imgRes, listingRes] = await Promise.all([
                supabase
                  .from('products')
                  .select('*, seller:public_profiles(full_name, username)')
                  .eq('id', itemId)
                  .maybeSingle(),
                supabase
                  .from('product_images')
                  .select('image_url')
                  .eq('product_id', itemId)
                  .order('is_primary', { ascending: false }),
                supabase
                  .from('listings')
                  .select('id, owner_id')
                  .or(`product_id.eq.${itemId},id.eq.${itemId}`)
                  .maybeSingle()
              ]);

              const prod = prodRes.data;
              listingId = listingRes.data?.id || listingId;
              const images = (imgRes.data || []).map((img: any) => img.image_url);

              if (prod) {
                const sellerObj = Array.isArray(prod.seller) ? prod.seller[0] : prod.seller;
                details.title = prod.title || 'Product';
                details.description = prod.description || '';
                details.price = Number(prod.price || 0);
                details.price_display = `KSh ${details.price.toLocaleString('en-KE')}`;
                details.images = images.length > 0 ? images : (prod.images || []);
                details.seller_name = sellerObj?.full_name || sellerObj?.username || 'Student Seller';
                details.seller_id = prod.seller_id;
                details.meta_info = {
                  condition: prod.condition_id,
                  location: prod.location,
                  quantity: prod.quantity,
                  negotiable: prod.is_negotiable
                };
              }
            } else if (normalizedType === 'accommodation') {
              details.listing_type = 'accommodation';
              const [accRes, imgRes, listingRes] = await Promise.all([
                supabase
                  .from('accommodations')
                  .select('*, owner:public_profiles(full_name, username)')
                  .eq('id', itemId)
                  .maybeSingle(),
                supabase
                  .from('accommodation_images')
                  .select('image_url')
                  .eq('accommodation_id', itemId)
                  .order('is_primary', { ascending: false }),
                supabase
                  .from('listings')
                  .select('id, owner_id')
                  .or(`accommodation_id.eq.${itemId},id.eq.${itemId}`)
                  .maybeSingle()
              ]);

              const acc = accRes.data;
              listingId = listingRes.data?.id || listingId;
              const images = (imgRes.data || []).map((img: any) => img.image_url);

              if (acc) {
                const ownerObj = Array.isArray(acc.owner) ? acc.owner[0] : acc.owner;
                details.title = acc.title || 'Accommodation';
                details.description = acc.description || '';
                details.price = Number(acc.price_per_month || acc.rent_amount || 0);
                details.price_display = `KSh ${details.price.toLocaleString('en-KE')}/mo`;
                details.images = images.length > 0 ? images : (acc.images || []);
                details.seller_name = ownerObj?.full_name || ownerObj?.username || 'Property Host';
                details.seller_id = acc.owner_id;
                details.meta_info = {
                  type: acc.accommodation_type,
                  bedrooms: acc.bedrooms,
                  bathrooms: acc.bathrooms,
                  distance_km: acc.distance_from_campus_km,
                  deposit: acc.deposit_amount
                };
              }
            } else if (normalizedType === 'service') {
              details.listing_type = 'service';
              const [srvRes, imgRes, listingRes] = await Promise.all([
                supabase
                  .from('services')
                  .select('*, provider:public_profiles(full_name, username)')
                  .eq('id', itemId)
                  .maybeSingle(),
                supabase
                  .from('service_images')
                  .select('image_url')
                  .eq('service_id', itemId)
                  .order('is_primary', { ascending: false }),
                supabase
                  .from('listings')
                  .select('id, owner_id')
                  .or(`service_id.eq.${itemId},id.eq.${itemId}`)
                  .maybeSingle()
              ]);

              const srv = srvRes.data;
              listingId = listingRes.data?.id || listingId;
              const images = (imgRes.data || []).map((img: any) => img.image_url);

              if (srv) {
                const provObj = Array.isArray(srv.provider) ? srv.provider[0] : srv.provider;
                details.title = srv.title || 'Service';
                details.description = srv.description || '';
                const p = Number(srv.starting_price || srv.price || 0);
                details.price = p;
                details.price_display = p > 0 ? `From KSh ${p.toLocaleString('en-KE')}` : 'Rate on request';
                details.images = images;
                details.seller_name = provObj?.full_name || provObj?.username || 'Service Provider';
                details.seller_id = srv.provider_id;
                details.meta_info = {
                  pricing_type: srv.pricing_type,
                  working_hours: srv.working_hours,
                  whatsapp_contact: srv.whatsapp_contact
                };
              }
            } else if (normalizedType === 'lost_found') {
              details.listing_type = 'lost_found';
              const [lfRes, listingRes] = await Promise.all([
                supabase
                  .from('lost_found_items')
                  .select('*')
                  .eq('id', itemId)
                  .maybeSingle(),
                supabase
                  .from('listings')
                  .select('id, owner_id, owner:public_profiles(full_name)')
                  .or(`lost_found_id.eq.${itemId},id.eq.${itemId}`)
                  .maybeSingle()
              ]);

              const lf = lfRes.data;
              listingId = listingRes.data?.id || listingId;

              if (lf) {
                const ownerObj = Array.isArray(listingRes.data?.owner) ? listingRes.data?.owner[0] : listingRes.data?.owner;
                details.title = lf.item_name || 'Lost & Found Notice';
                details.description = lf.description || '';
                details.price = 0;
                details.price_display = lf.item_type === 'found' ? 'Found Notice' : 'Lost Notice';
                details.images = lf.image_url ? [lf.image_url] : [];
                details.seller_name = ownerObj?.full_name || lf.contact_phone || 'Student Reporter';
                details.seller_id = listingRes.data?.owner_id;
                details.meta_info = {
                  item_type: lf.item_type,
                  location: lf.location_text || lf.exact_location,
                  date: lf.date_lost_found || lf.event_date,
                  contact: lf.contact_phone
                };
              }
            } else if (normalizedType === 'event') {
              details.listing_type = 'event';
              const [evtRes, listingRes] = await Promise.all([
                supabase
                  .from('events')
                  .select('*')
                  .eq('id', itemId)
                  .maybeSingle(),
                supabase
                  .from('listings')
                  .select('id, owner_id, owner:public_profiles(full_name)')
                  .or(`event_id.eq.${itemId},id.eq.${itemId}`)
                  .maybeSingle()
              ]);

              const evt = evtRes.data;
              listingId = listingRes.data?.id || listingId;

              if (evt) {
                const ownerObj = Array.isArray(listingRes.data?.owner) ? listingRes.data?.owner[0] : listingRes.data?.owner;
                details.title = evt.title || 'Campus Event';
                details.description = evt.description || '';
                details.price = Number(evt.ticket_price || 0);
                details.price_display = evt.is_free ? 'Free Event' : `KSh ${details.price.toLocaleString('en-KE')}`;
                details.images = (evt.banner_url && evt.banner_url.startsWith('http')) ? [evt.banner_url] : [];
                details.seller_name = evt.organizer_name || ownerObj?.full_name || 'Event Organizer';
                details.seller_id = listingRes.data?.owner_id;
                details.meta_info = {
                  event_type: evt.event_type,
                  event_date: evt.event_date,
                  start_time: evt.start_time,
                  location: evt.location_text,
                  max_attendees: evt.max_attendees
                };
              }
            }
          } catch (itemErr) {
            console.warn(`Error resolving details for ${itemType}:${itemId}`, itemErr);
          }

          return {
            id: row.id,
            item_type: row.item_type,
            item_id: row.item_id,
            priority: row.priority || 'medium',
            status: row.status,
            assigned_to: row.assigned_to,
            resolution: row.resolution,
            resolved_by: row.resolved_by,
            resolved_at: row.resolved_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            listing_id: listingId,
            item_details: details
          } as ModerationItem;
        })
      );

      return queueItems;
    } catch (err) {
      console.warn('Error fetching moderation queue from Supabase:', err);
      return [];
    }
  },

  async resolveModerationItem(idOrListingId: string, resolution: 'approved' | 'rejected', reason: string | null): Promise<void> {
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';

    // 1. Audit Logging
    await this.logAdminAction({
      action: `MODERATION_${resolution.toUpperCase()}`,
      targetType: 'listing',
      targetId: idOrListingId,
      before: null,
      after: { status: 'resolved', resolution, resolved_by: activeUserId },
      reason
    });

    // 2. Determine target listing_id
    let targetListingId = idOrListingId;

    try {
      // Check if idOrListingId is a moderation_queue row ID
      const { data: qItem } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('id', idOrListingId)
        .maybeSingle();

      if (qItem) {
        const itemType = qItem.item_type;
        const itemId = qItem.item_id;

        let col = 'product_id';
        if (itemType === 'accommodation_approval') col = 'accommodation_id';
        else if (itemType === 'service_approval') col = 'service_id';
        else if (itemType === 'lost_found_approval') col = 'lost_found_id';
        else if (itemType === 'event_approval') col = 'event_id';

        const { data: lData } = await supabase
          .from('listings')
          .select('id')
          .eq(col, itemId)
          .maybeSingle();

        if (lData?.id) {
          targetListingId = lData.id;
        }
      }
    } catch (lookupErr) {
      console.warn('Listing ID lookup from queue row warning:', lookupErr);
    }

    // 3. Always use unified approve_listing / reject_listing RPCs
    if (resolution === 'approved') {
      const res = await this.approveListing(targetListingId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to approve listing');
      }
    } else {
      const res = await this.rejectListing(targetListingId, reason);
      if (!res.success) {
        throw new Error(res.error || 'Failed to reject listing');
      }
    }
  },

  async assignModerationItem(id: string): Promise<void> {
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';
    try {
      await supabase
        .from('moderation_queue')
        .update({
          status: 'assigned',
          assigned_to: activeUserId
        })
        .eq('id', id);
    } catch {}

    const currentItems = getMockData<ModerationItem>('moderation_queue', INITIAL_MODERATION);
    const updated = currentItems.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status: 'assigned' as const,
          assigned_to: activeUserId,
          assigned_to_name: 'Kibabii Admin'
        };
      }
      return i;
    });
    setMockData('moderation_queue', updated);
  },

  // REPORTED PRODUCTS
  async getProductReports(status: 'open' | 'resolved' | 'dismissed' = 'open'): Promise<ProductReport[]> {
    try {
      const { data, error } = await supabase
        .from('product_reports')
        .select('*, products(title, price, status)')
        .eq('status', status);
        
      if (error) throw error;
      return data as ProductReport[];
    } catch (err) {
      console.error('Error fetching product reports from Supabase:', err);
      return [];
    }
  },

  async resolveProductReport(id: string, action: 'dismissed' | 'resolved', reason: string | null): Promise<void> {
    const reports = getMockData<ProductReport>('product_reports', INITIAL_REPORTS);
    const report = reports.find(r => r.id === id);
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';

    await this.logAdminAction({
      action: action === 'dismissed' ? 'REPORT_DISMISS' : 'REPORT_TAKEDOWN',
      targetType: 'products',
      targetId: report?.product_id || id,
      before: report,
      after: { status: action, reviewed_by: activeUserId },
      reason
    });

    try {
      await supabase
        .from('product_reports')
        .update({
          status: action,
          reviewed_by: activeUserId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (action === 'resolved' && report) {
        // Take down product
        await supabase
          .from('products')
          .update({ status: 'removed' })
          .eq('id', report.product_id);
      }
    } catch (err) {
      console.error('Error taking down product from database:', err);
    }

    const updated = reports.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: action,
          reviewed_by: activeUserId,
          reviewed_at: new Date().toISOString()
        };
      }
      return r;
    });
    setMockData('product_reports', updated);
  },

  // USER VERIFICATION
  async getUserVerifications(status: 'pending' | 'verified' | 'rejected' = 'pending'): Promise<UserVerification[]> {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('status', status);
        
      if (error) throw error;
      return data as UserVerification[];
    } catch (err) {
      console.error('Error fetching user verifications from Supabase:', err);
      return [];
    }
  },

  async resolveUserVerification(id: string, status: 'verified' | 'rejected', reason: string | null): Promise<void> {
    const verifications = getMockData<UserVerification>('user_verifications', INITIAL_VERIFICATIONS);
    const request = verifications.find(v => v.id === id);
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';

    await this.logAdminAction({
      action: `USER_VERIFICATION_${status.toUpperCase()}`,
      targetType: 'profiles',
      targetId: request?.user_id || id,
      before: request,
      after: { status, reviewed_by: activeUserId, rejection_reason: reason },
      reason
    });

    try {
      await supabase
        .from('user_verifications')
        .update({
          status,
          reviewed_by: activeUserId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', id);

      if (status === 'verified' && request) {
        await supabase
          .from('profiles')
          .update({ verification_status: 'verified', is_verified: true })
          .eq('id', request.user_id);
      }
    } catch {
      // Mock persistence syncs with authStore accounts
      if (request) {
        try {
          const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
          const idx = accounts.findIndex((a: any) => a.id === request.user_id);
          if (idx !== -1) {
            if (request.verification_type === 'student_id') {
              accounts[idx].student_verification_status = status === 'verified' ? 'approved' : 'rejected';
            } else {
              accounts[idx].store_verification_status = status === 'verified' ? 'approved' : 'rejected';
            }
            accounts[idx].is_verified = status === 'verified';
            accounts[idx].verification_status = status === 'verified' ? 'verified' : 'rejected';
            localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accounts));
          }
        } catch {}
      }
    }

    const updated = verifications.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status,
          reviewed_by: activeUserId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        };
      }
      return v;
    });
    setMockData('user_verifications', updated);
  },

  // CAMPUS MEMBERSHIPS
  async getCampusMemberships(status: 'pending' | 'active' | 'rejected' = 'pending'): Promise<CampusMembership[]> {
    try {
      const { data, error } = await supabase
        .from('campus_memberships')
        .select('*')
        .eq('status', status);
        
      if (error) throw error;
      return data as CampusMembership[];
    } catch (err) {
      console.error('Error fetching campus memberships from Supabase:', err);
      return [];
    }
  },

  async resolveCampusMembership(id: string, status: 'active' | 'rejected'): Promise<void> {
    const memberships = getMockData<CampusMembership>('campus_memberships', INITIAL_MEMBERSHIPS);
    const membership = memberships.find(m => m.id === id);
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';

    await this.logAdminAction({
      action: `CAMPUS_MEMBERSHIP_${status.toUpperCase()}`,
      targetType: 'campus_memberships',
      targetId: id,
      before: membership,
      after: { status, verified_by: activeUserId },
      reason: null
    });

    try {
      await supabase
        .from('campus_memberships')
        .update({
          status,
          verified_by: activeUserId,
          verified_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch {}

    const updated = memberships.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status,
          verified_by: activeUserId,
          verified_at: new Date().toISOString()
        };
      }
      return m;
    });
    setMockData('campus_memberships', updated);
  },

  // USERS MANAGEMENT
  async getUserProfiles(): Promise<any[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('public_profiles')
        .select('*');
        
      if (error) throw error;

      // Fetch user roles as well
      const { data: roles } = await supabase.from('user_roles').select('*');
      
      return (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.id).map(r => r.role)
      }));
    } catch {
      // Offline fallback
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      return accounts.map((acc: any) => ({
        ...acc,
        roles: [acc.role]
      }));
    }
  },

  async updateUserRole(userId: string, role: string, action: 'grant' | 'revoke'): Promise<void> {
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';

    await this.logAdminAction({
      action: action === 'grant' ? 'ROLE_GRANT' : 'ROLE_REVOKE',
      targetType: 'user_roles',
      targetId: userId,
      before: { user_id: userId, role, action: action === 'grant' ? 'none' : 'exists' },
      after: { user_id: userId, role, action: action === 'grant' ? 'exists' : 'none' },
      reason: `Admin operation by ${activeUserId}`
    });

    try {
      if (action === 'grant') {
        await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
            granted_by: activeUserId
          });
      } else {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
      }
    } catch {}

    // Fallback sync
    try {
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      const idx = accounts.findIndex((a: any) => a.id === userId);
      if (idx !== -1) {
        accounts[idx].role = action === 'grant' ? role : 'student';
        localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accounts));
      }
    } catch {}
  },

  // CATEGORIES & BRANDS CRUD
  async getCategoriesTree() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (error) throw error;
      return data;
    } catch {
      // Return authoritative categories set
      return [
        // Top-level Flat Categories
        { id: 'cat-books-notes', name: 'Books & Notes', slug: 'books-notes', parent_id: null },
        { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', parent_id: null },
        { id: 'cat-clothing', name: 'Clothing', slug: 'clothing-fashion', parent_id: null },
        { id: 'cat-food', name: 'Food', slug: 'food-snacks', parent_id: null },
        { id: 'cat-furniture-dorm', name: 'Furniture', slug: 'furniture-dorm', parent_id: null },
        { id: 'cat-sports', name: 'Sports', slug: 'sports-fitness', parent_id: null },
        { id: 'cat-stationery', name: 'Stationery', slug: 'stationery-art', parent_id: null },
        { id: 'cat-services', name: 'Services', slug: 'services', parent_id: null },
        { id: 'cat-other', name: 'Other', slug: 'other', parent_id: null },

        // Top-level Categories with Subcategories
        { id: 'cat-phones', name: 'Phones', slug: 'phones', parent_id: null },
        { id: 'sub-phones-smartphones', name: 'Smartphones', slug: 'phones-smartphones', parent_id: 'cat-phones' },
        { id: 'sub-phones-feature', name: 'Feature Phones', slug: 'phones-feature', parent_id: 'cat-phones' },
        { id: 'sub-phones-accessories', name: 'Phone Accessories', slug: 'phones-accessories', parent_id: 'cat-phones' },

        { id: 'cat-tvs-audio', name: 'TVs & Audio', slug: 'tvs-audio', parent_id: null },
        { id: 'sub-tvs-televisions', name: 'Televisions', slug: 'tvs-audio-televisions', parent_id: 'cat-tvs-audio' },
        { id: 'sub-tvs-speakers', name: 'Speakers & Sound Systems', slug: 'tvs-audio-speakers', parent_id: 'cat-tvs-audio' },
        { id: 'sub-tvs-headphones', name: 'Headphones & Earphones', slug: 'tvs-audio-headphones', parent_id: 'cat-tvs-audio' },

        { id: 'cat-appliances', name: 'Appliances', slug: 'appliances', parent_id: null },
        { id: 'sub-appliances-kitchen', name: 'Kitchen Appliances', slug: 'appliances-kitchen', parent_id: 'cat-appliances' },
        { id: 'sub-appliances-laundry', name: 'Laundry & Cleaning', slug: 'appliances-laundry', parent_id: 'cat-appliances' },
        { id: 'sub-appliances-cooling', name: 'Cooling & Heating', slug: 'appliances-cooling-heating', parent_id: 'cat-appliances' },

        { id: 'cat-health-beauty', name: 'Health & Beauty', slug: 'health-beauty', parent_id: null },
        { id: 'sub-health-skincare', name: 'Skincare', slug: 'health-beauty-skincare', parent_id: 'cat-health-beauty' },
        { id: 'sub-health-haircare', name: 'Haircare', slug: 'health-beauty-haircare', parent_id: 'cat-health-beauty' },
        { id: 'sub-health-makeup', name: 'Makeup', slug: 'health-beauty-makeup', parent_id: 'cat-health-beauty' },

        { id: 'cat-fashion', name: 'Fashion', slug: 'fashion', parent_id: null },
        { id: 'sub-fashion-mens', name: "Men's Clothing", slug: 'fashion-mens-clothing', parent_id: 'cat-fashion' },
        { id: 'sub-fashion-womens', name: "Women's Clothing", slug: 'fashion-womens-clothing', parent_id: 'cat-fashion' },
        { id: 'sub-fashion-shoes', name: 'Shoes', slug: 'fashion-shoes', parent_id: 'cat-fashion' },
        { id: 'sub-fashion-bags', name: 'Bags', slug: 'fashion-bags', parent_id: 'cat-fashion' },

        { id: 'cat-computing', name: 'Computing', slug: 'computing', parent_id: null },
        { id: 'sub-comp-laptops', name: 'Laptops', slug: 'computing-laptops', parent_id: 'cat-computing' },
        { id: 'sub-comp-desktops', name: 'Desktops & Monitors', slug: 'computing-desktops', parent_id: 'cat-computing' },
        { id: 'sub-comp-accessories', name: 'Computer Accessories', slug: 'computing-accessories', parent_id: 'cat-computing' },
        { id: 'sub-comp-printers', name: 'Printers & Scanners', slug: 'computing-printers', parent_id: 'cat-computing' },

        { id: 'cat-furniture-living', name: 'Furniture', slug: 'furniture', parent_id: null },
        { id: 'sub-furn-beds', name: 'Beds & Mattresses', slug: 'furniture-beds', parent_id: 'cat-furniture-living' },
        { id: 'sub-furn-tables', name: 'Tables & Chairs', slug: 'furniture-tables-chairs', parent_id: 'cat-furniture-living' },
        { id: 'sub-furn-storage', name: 'Storage & Shelving', slug: 'furniture-storage', parent_id: 'cat-furniture-living' },

        { id: 'cat-watches-jewellery', name: 'Watches & Jewellery', slug: 'watches-jewellery', parent_id: null },
        { id: 'sub-watches', name: 'Watches', slug: 'watches-jewellery-watches', parent_id: 'cat-watches-jewellery' },
        { id: 'sub-necklaces', name: 'Necklaces & Bracelets', slug: 'watches-jewellery-necklaces', parent_id: 'cat-watches-jewellery' },
        { id: 'sub-rings', name: 'Rings & Earrings', slug: 'watches-jewellery-rings', parent_id: 'cat-watches-jewellery' },
      ];
    }
  },

  async createCategory(name: string, slug: string, parentId: string | null = null): Promise<any> {
    const activeUserId = localStorage.getItem('kibabui_active_session_id') || 'admin-user';
    const payload = { name, slug, parent_id: parentId };
    
    await this.logAdminAction({
      action: 'CATEGORY_CREATE',
      targetType: 'categories',
      targetId: slug,
      before: null,
      after: payload,
      reason: 'Standard Admin Category Add'
    });

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single();
      if (!error) return data;
    } catch {}

    return { id: `cat-${Math.random().toString(36).substring(2, 9)}`, ...payload };
  },

  async deleteCategory(id: string): Promise<void> {
    await this.logAdminAction({
      action: 'CATEGORY_DELETE',
      targetType: 'categories',
      targetId: id,
      before: { id },
      after: null,
      reason: 'Standard Admin Category Deletion'
    });

    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch {}
  },

  // BRANDS CRUD
  async getBrands(): Promise<AdminBrand[]> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as AdminBrand[];
    } catch {
      return getMockData<AdminBrand>('brands', INITIAL_BRANDS);
    }
  },

  async toggleBrandActive(id: string): Promise<void> {
    const brands = getMockData<AdminBrand>('brands', INITIAL_BRANDS);
    const brand = brands.find(b => b.id === id);
    const beforeActive = brand ? brand.is_active : false;

    await this.logAdminAction({
      action: 'BRAND_TOGGLE_ACTIVE',
      targetType: 'brands',
      targetId: id,
      before: { is_active: beforeActive },
      after: { is_active: !beforeActive },
      reason: null
    });

    try {
      await supabase
        .from('brands')
        .update({ is_active: !beforeActive })
        .eq('id', id);
    } catch {}

    const updated = brands.map(b => {
      if (b.id === id) {
        return { ...b, is_active: !b.is_active };
      }
      return b;
    });
    setMockData('brands', updated);
  },

  async createBrand(name: string): Promise<AdminBrand> {
    const brandPayload = {
      id: `brand-${Math.random().toString(36).substring(2, 9)}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      is_active: true,
      created_at: new Date().toISOString()
    };

    await this.logAdminAction({
      action: 'BRAND_CREATE',
      targetType: 'brands',
      targetId: brandPayload.id,
      before: null,
      after: brandPayload,
      reason: 'Admin creates brand catalog entry'
    });

    try {
      await supabase.from('brands').insert({
        name: brandPayload.name,
        slug: brandPayload.slug,
        is_active: true
      });
    } catch {}

    const list = getMockData<AdminBrand>('brands', INITIAL_BRANDS);
    const updated = [...list, brandPayload];
    setMockData('brands', updated);
    return brandPayload;
  },

  async deleteBrand(id: string): Promise<void> {
    await this.logAdminAction({
      action: 'BRAND_DELETE',
      targetType: 'brands',
      targetId: id,
      before: { id },
      after: null,
      reason: 'Admin deletes brand catalog entry'
    });

    try {
      await supabase.from('brands').delete().eq('id', id);
    } catch {}

    const list = getMockData<AdminBrand>('brands', INITIAL_BRANDS);
    const updated = list.filter(b => b.id !== id);
    setMockData('brands', updated);
  },

  // AUDIT LOG VIEWER
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuditLog[];
    } catch (err) {
      console.warn('Failed to fetch real audit_logs from Supabase. Falling back to local dataset:', err);
      return getMockData<AuditLog>('audit_logs', INITIAL_AUDIT_LOGS);
    }
  },

  // FLASH SALES & ADS MANAGER
  async getPromoAds(): Promise<AdminAdPromo[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*');
      if (error) throw error;
      return data as AdminAdPromo[];
    } catch {
      return getMockData<AdminAdPromo>('promotions', INITIAL_PROMO_ADS);
    }
  },

  async resolvePromoAd(id: string, status: 'active' | 'rejected'): Promise<void> {
    const list = getMockData<AdminAdPromo>('promotions', INITIAL_PROMO_ADS);
    const ad = list.find(a => a.id === id);

    await this.logAdminAction({
      action: `PROMO_RESOLVE_${status.toUpperCase()}`,
      targetType: 'promotions',
      targetId: id,
      before: ad,
      after: { status },
      reason: 'Admin promotion/advertisement moderation'
    });

    try {
      await supabase.from('promotions').update({ status }).eq('id', id);
    } catch {}

    const updated = list.map(a => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    });
    setMockData('promotions', updated);
  },

  async getFlashSales(): Promise<AdminFlashSale[]> {
    try {
      const { data, error } = await supabase.from('flash_sales').select('*');
      if (error) throw error;
      return data as AdminFlashSale[];
    } catch {
      return getMockData<AdminFlashSale>('flash_sales', INITIAL_FLASH_SALES);
    }
  },

  async createFlashSale(title: string, discount_percentage: number, starts_at: string, ends_at: string): Promise<AdminFlashSale> {
    const payload: AdminFlashSale = {
      id: `flash-${Math.random().toString(36).substring(2, 9)}`,
      title,
      discount_percentage,
      status: 'active',
      starts_at,
      ends_at,
      created_at: new Date().toISOString()
    };

    await this.logAdminAction({
      action: 'FLASH_SALE_CREATE',
      targetType: 'flash_sales',
      targetId: payload.id,
      before: null,
      after: payload,
      reason: 'Admin creates global store promotion'
    });

    try {
      await supabase.from('flash_sales').insert({
        title,
        discount_percentage,
        starts_at,
        ends_at,
        status: 'active'
      });
    } catch {}

    const list = getMockData<AdminFlashSale>('flash_sales', INITIAL_FLASH_SALES);
    const updated = [...list, payload];
    setMockData('flash_sales', updated);
    return payload;
  }
};
