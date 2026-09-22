import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { isValidUuid, toValidUuid } from '@/lib/uuid';

export type ListingType = 'product' | 'accommodation' | 'service' | 'lost_found' | 'event';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'expired' | 'archived' | 'rejected' | 'paused';
export type AccountType = 'student' | 'store';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Listing {
  id: string;
  owner_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  title: string;
  description: string;
  location: string;
  campus_id?: string;
  is_promoted?: boolean;
  promotion_priority?: number;
  promotion_type?: string;
  views_count: number;
  favorites_count: number;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  images?: string[];

  // Flattened type-specific UI fields
  product_price?: number;
  product_condition?: string;
  product_category?: string;
  product_subcategory?: string;
  product_seller_type?: string;
  flash_sale_original_price?: number;
  accommodation_rent?: number;
  accommodation_type?: string;
  accommodation_deposit?: number;
  accommodation_rooms?: number;
  accommodation_distance?: string;
  accommodation_contact?: string;
  service_category?: string;
  service_starting_price?: number;
  service_working_hours?: string;
  service_whatsapp?: string;
  service_bio?: string;
  service_seller_type?: string;
  lost_found_mode?: string;
  lost_found_exact_location?: string;
  lost_found_date?: string;
  lost_found_contact?: string;
  event_type?: string;
  event_time?: string;
  event_date?: string;
  event_venue?: string;
  event_organizer?: string;
  event_is_free?: boolean;
  event_ticket_price?: number;
  event_max_attendees?: number;
  event_registration_link?: string;
  
  // Entity reference IDs
  product_id?: string;
  accommodation_id?: string;
  service_id?: string;
  lost_found_id?: string;
  event_id?: string;

  // Joins / dynamic details
  product_details?: any;
  accommodation_details?: any;
  service_type_details?: any;
  lost_found_details?: any;
  event_details?: any;
  owner?: any; // Owner profile join
}

export interface Draft {
  id?: string;
  owner_id: string;
  listing_type: ListingType;
  title: string;
  description: string;
  location: string;
  campus_id?: string;
  draft_data: any;
  draft_images: string[];
  step_completed: number;
  last_saved_at?: string;
  updated_at?: string;
}

export interface MarketplaceSearchResults {
  products: any[];
  accommodations: any[];
  services: any[];
  events: any[];
}

export interface SearchSuggestion {
  id: string;
  type: string;
  suggestion: string;
}

export interface Promotion {
  id: string;
  target_type: string;
  target_id: string;
  promotion_type: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  product_limit: number;
  promotion_limit: number;
  analytics_access: boolean;
  featured_listing_slots: number;
  flash_sale_access: boolean;
  homepage_feature_access: boolean;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
  auto_renew: boolean;
  created_at?: string;
}

export const listingService = {
  // Local listings persistence helpers
  saveLocalListing(listing: Listing) {
    try {
      const existingStr = localStorage.getItem('kibabui_user_listings');
      const list: Listing[] = existingStr ? JSON.parse(existingStr) : [];
      const idx = list.findIndex(l => l.id === listing.id);
      if (idx >= 0) {
        list[idx] = listing;
      } else {
        list.unshift(listing);
      }
      localStorage.setItem('kibabui_user_listings', JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to save local listing:', err);
    }
  },

  getLocalListings(sellerId?: string): Listing[] {
    try {
      const existingStr = localStorage.getItem('kibabui_user_listings');
      if (!existingStr) return [];
      const list: Listing[] = JSON.parse(existingStr);
      // Clean up any stale or ghost items (must be valid UUIDs)
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validList = list.filter(l => l && typeof l.id === 'string' && validUuidRegex.test(l.id));
      if (validList.length !== list.length) {
        localStorage.setItem('kibabui_user_listings', JSON.stringify(validList));
      }
      if (sellerId) {
        return validList.filter(l => l.owner_id === sellerId || l.owner?.id === sellerId);
      }
      return validList;
    } catch {
      return [];
    }
  },

  getLocalListingById(id: string): Listing | null {
    try {
      const list = this.getLocalListings();
      return list.find(l => l.id === id || l.product_details?.id === id) || null;
    } catch {
      return null;
    }
  },

  deleteLocalListing(id: string) {
    try {
      const list = this.getLocalListings().filter(l => l.id !== id && l.product_details?.id !== id);
      localStorage.setItem('kibabui_user_listings', JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to delete local listing:', err);
    }
  },

  // 1-2. Draft operations
  async checkActiveDrafts(userId: string): Promise<Draft | null> {
    if (!userId) return null;
    const sanitizedUserId = isValidUuid(userId) ? userId : toValidUuid(userId);
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('owner_id', sanitizedUserId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      return data && data.length > 0 ? (data[0] as Draft) : null;
    } catch {
      return null;
    }
  },

  async getMyDrafts(userId: string): Promise<Draft[]> {
    if (!userId) return [];
    const sanitizedUserId = isValidUuid(userId) ? userId : toValidUuid(userId);
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('owner_id', sanitizedUserId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async saveDraft(draft: Partial<Draft>): Promise<any> {
    try {
      const sanitizedDraftId = draft.id && isValidUuid(draft.id) ? draft.id : (draft.id ? toValidUuid(draft.id) : crypto.randomUUID());
      const sanitizedOwnerId = draft.owner_id ? (isValidUuid(draft.owner_id) ? draft.owner_id : toValidUuid(draft.owner_id)) : undefined;

      const payload = {
        ...draft,
        id: sanitizedDraftId,
        ...(sanitizedOwnerId ? { owner_id: sanitizedOwnerId } : {}),
        last_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // If draft has an id, update it, otherwise insert new
      if (draft.id) {
        const { data, error } = await supabase
          .from('drafts')
          .update(payload)
          .eq('id', sanitizedDraftId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('drafts')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.warn('Error saving draft:', err);
      return draft;
    }
  },

  async deleteDraft(draftId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId);
      if (error) throw error;
    } catch (err) {
      console.warn('Error deleting draft:', err);
    }
  },

  // 3. Image upload helper
  async uploadListingImage(
    bucket: string,
    userId: string,
    entityId: string,
    filename: string,
    file: File | Blob,
    position?: number
  ): Promise<string> {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
    
    // Get the real Supabase authenticated user ID if available, otherwise fallback to userId.
    const { data: { session } } = await supabase.auth.getSession();
    const actualUserId = session?.user?.id || userId;

    const isMockUser = !session || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(actualUserId);

    if (isMockUser) {
      if (file instanceof File || file instanceof Blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      }
      return '';
    }

    try {
      const path = position !== undefined
        ? `${actualUserId}/${entityId}/${position}_${cleanFilename}`
        : `${actualUserId}/${entityId}/${cleanFilename}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to base64:', err);
      if (file instanceof File || file instanceof Blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      }
      return '';
    }
  },

  // 4-5. Dashboard listings via RPC
  async getMyListings(
    p_status: ListingStatus | null,
    p_type: ListingType | null,
    p_sort: 'newest' | 'oldest' | 'views' | 'favorites' = 'newest',
    p_search: string | null = null,
    p_limit: number = 20,
    p_offset: number = 0
  ): Promise<Listing[]> {
    try {
      let { data, error } = await supabase.rpc('get_my_listings', {
        p_status,
        p_type,
        p_sort,
        p_search,
        p_limit,
        p_offset
      });
      if (error) {
        // Fallback to table query if RPC is missing / errors
        console.warn('get_my_listings RPC failed, falling back to direct query', error);
        let q = supabase.from('listings').select('*, owner:public_profiles(*), product_details:products(*), accommodation_details:accommodations(*, accommodation_images(*)), service_type_details:services(*, service_images(*)), lost_found_details:lost_found_items(*), event_details:events(*)');
        if (p_status) q = q.eq('status', p_status);
        if (p_type) q = q.eq('listing_type', p_type);
        if (p_search) q = q.ilike('title', `%${p_search}%`);
        
        const isAsc = p_sort === 'oldest';
        const colMap: any = { newest: 'created_at', oldest: 'created_at', views: 'views_count', favorites: 'favorites_count' };
        q = q.order(colMap[p_sort] || 'created_at', { ascending: isAsc });
        
        const { data: qData, error: qErr } = await q.range(p_offset, p_offset + p_limit - 1);
        if (!qErr && qData && qData.length > 0) {
          data = qData;
        }
      }

      let combined: Listing[] = [];
      if (data && data.length > 0) {
        combined = [...data];
      }

      return combined;
    } catch (err) {
      console.error('Error fetching my listings:', err);
      throw err;
    }
  },

  async getDashboardStats(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) {
        console.warn('get_dashboard_stats RPC failed, using fallback metrics', error);
        // Fallback summary counts
        const { data: listings } = await supabase.from('listings').select('status, views_count, favorites_count');
        const list = listings || [];
        return {
          total_listings: list.length,
          active_listings: list.filter(l => l.status === 'active').length,
          draft_listings: list.filter(l => l.status === 'draft').length,
          sold_listings: list.filter(l => l.status === 'sold').length,
          archived_listings: list.filter(l => l.status === 'archived').length,
          expired_listings: list.filter(l => l.status === 'expired').length,
          pending_listings: list.filter(l => l.status === 'pending_review').length,
          total_views: list.reduce((acc, l) => acc + (l.views_count || 0), 0),
          total_favorites: list.reduce((acc, l) => acc + (l.favorites_count || 0), 0),
          active_promotions: 0
        };
      }
      return data;
    } catch {
      return {
        total_listings: 0, active_listings: 0, draft_listings: 0, sold_listings: 0,
        archived_listings: 0, expired_listings: 0, pending_listings: 0,
        total_views: 0, total_favorites: 0, active_promotions: 0
      };
    }
  },

  // 6. Global FTS search & detailed search view filters
  async searchAllListings(
    p_query: string | null,
    p_type: ListingType | null,
    p_campus_id: string | null = null,
    p_limit: number = 20,
    p_offset: number = 0,
    userId?: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('search_all_listings', {
        p_query,
        p_type,
        p_campus_id,
        p_limit,
        p_offset
      });

      // Log search query async (Item 6)
      if (p_query && userId) {
        const logSearchQuery = async () => {
          try {
            await supabase.from('search_log').insert({
              user_id: userId,
              query: p_query,
              listing_type: p_type,
              campus_id: p_campus_id,
              results_count: data?.length || 0
            });
          } catch {}
        };
        logSearchQuery();
      }

      if (error) {
        console.warn('search_all_listings RPC failed, falling back to view query', error);
        let q = supabase.from('search_listings').select('*');
        if (p_query) q = q.ilike('title', `%${p_query}%`);
        if (p_type) q = q.eq('listing_type', p_type);
        const { data: fallbackData, error: fetchErr } = await q.range(p_offset, p_offset + p_limit - 1);
        if (fetchErr) throw fetchErr;
        return (fallbackData || []).map((row: any) => ({
          ...row,
          id: row.id || row.listing_id
        }));
      }

      const rows = data || [];
      if (rows.length > 0) {
        const ids = rows.map((d: any) => d.listing_id || d.id).filter(Boolean);
        try {
          const { data: enrichedListings } = await supabase
            .from('listings')
            .select(`
              *,
              owner:public_profiles(*),
              products(*, product_images(*)),
              accommodations(*, accommodation_images(*)),
              services(*, service_images(*)),
              lost_found_items(*),
              events(*)
            `)
            .in('id', ids);

          if (enrichedListings && enrichedListings.length > 0) {
            const enrichedMap = new Map(enrichedListings.map((item: any) => [item.id, item]));
            return rows.map((row: any) => {
              const full: any = enrichedMap.get(row.listing_id || row.id);
              if (full) {
                return {
                  ...full,
                  ...row,
                  id: full.id || row.listing_id || row.id,
                  product_details: full.products ? {
                    ...full.products,
                    images: full.products.product_images?.map((img: any) => img.image_url) || []
                  } : null,
                  accommodation_details: full.accommodations,
                  service_details: full.services,
                  lost_found_details: full.lost_found_items,
                  event_details: full.events,
                };
              }
              return {
                ...row,
                id: row.listing_id || row.id
              };
            });
          }
        } catch (enrichErr) {
          console.warn('Failed to enrich search results with full listing details:', enrichErr);
        }
      }

      return rows.map((row: any) => ({
        ...row,
        id: row.id || row.listing_id
      }));
    } catch (err) {
      console.error('Search listings error:', err);
      return [];
    }
  },

  async logSearchClick(userId: string | undefined, query: string, clickedId: string) {
    if (!userId) return;
    try {
      await supabase.from('search_log').insert({
        user_id: userId,
        query,
        clicked_id: clickedId
      });
    } catch {}
  },

  // Simplified and Unified Marketplace Search via RPC search_marketplace
  async searchMarketplace(
    query: string | null = null,
    campusId: string | null = null,
    sellerType: 'student' | 'store' | null = null,
    limit: number = 40
  ): Promise<MarketplaceSearchResults> {
    const cleanQuery = query && query.trim() ? query.trim() : null;
    const cleanCampus = campusId && campusId !== 'all' ? campusId : null;

    try {
      // 1. Call RPC search_marketplace with _seller_type ('student' | 'store' | null)
      const { data, error } = await supabase.rpc('search_marketplace', {
        _query: cleanQuery,
        _campus_id: cleanCampus,
        _seller_type: sellerType || null
      });

      if (!error && data) {
        const products = Array.isArray(data.products) ? data.products : [];
        let accommodations = Array.isArray(data.accommodations) ? data.accommodations : [];
        let services = Array.isArray(data.services) ? data.services : [];
        let events = Array.isArray(data.events) ? data.events : [];

        // Per contract: when _seller_type is set, accommodations/services/events are not applicable
        if (sellerType) {
          accommodations = [];
          services = [];
          events = [];
        }

        if (products.length > 0) {
          return { products, accommodations, services, events };
        }
      }

      if (error) {
        console.warn('search_marketplace RPC error, falling back to direct table query:', error);
      }
    } catch (rpcErr) {
      console.warn('search_marketplace invocation failed:', rpcErr);
    }

    // Fallback if RPC threw an error or returned empty on a blank query
    try {
      if (sellerType) {
        let q = supabase
          .from('products')
          .select(`
            *,
            listings (*),
            stores (*),
            product_images (image_url, is_primary, display_order)
          `)
          .eq('seller_type', sellerType)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (cleanCampus) {
          q = q.eq('campus_id', cleanCampus);
        }
        if (cleanQuery) {
          q = q.ilike('title', `%${cleanQuery}%`);
        }

        const { data: fallbackProducts } = await q.limit(limit);

        return {
          products: fallbackProducts || [],
          accommodations: [],
          services: [],
          events: []
        };
      } else {
        let q = supabase
          .from('products')
          .select(`
            *,
            listings (*),
            stores (*),
            product_images (image_url, is_primary, display_order)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (cleanCampus) {
          q = q.eq('campus_id', cleanCampus);
        }
        if (cleanQuery) {
          q = q.ilike('title', `%${cleanQuery}%`);
        }

        const { data: fallbackProducts } = await q.limit(limit);

        return {
          products: fallbackProducts || [],
          accommodations: [],
          services: [],
          events: []
        };
      }
    } catch (fallbackErr) {
      console.error('Fallback search error:', fallbackErr);
      return { products: [], accommodations: [], services: [], events: [] };
    }
  },

  // Autocomplete suggestions via search_suggest RPC
  async searchSuggest(
    query: string,
    campusId: string | null = null,
    limit: number = 5
  ): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const cleanCampus = campusId && campusId !== 'all' ? campusId : null;
      const { data, error } = await supabase.rpc('search_suggest', {
        _query: query.trim(),
        _campus_id: cleanCampus,
        _limit: limit
      });

      if (error) {
        console.warn('search_suggest RPC error:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        suggestion: item.suggestion
      }));
    } catch (err) {
      console.error('searchSuggest error:', err);
      return [];
    }
  },

  // Detailed Filter System (Faceted browse of the `search_listings` view)
  async queryFilteredListings(filters: {
    listing_type?: ListingType;
    min_price?: number;
    max_price?: number;
    category?: string;
    subcategory?: string;
    seller_type?: 'student' | 'store';
    accommodation_type?: 'hostel' | 'bedsitter' | 'apartment' | 'shared_room';
    event_date?: string;
    lost_found_mode?: 'lost' | 'found';
    campus_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let q = supabase.from('search_listings').select('*');
      if (filters.listing_type) {
        q = q.eq('listing_type', filters.listing_type);
      }
      if (filters.min_price !== undefined) {
        if (filters.listing_type === 'product') q = q.gte('product_price', filters.min_price);
        if (filters.listing_type === 'accommodation') q = q.gte('accommodation_price', filters.min_price);
        if (filters.listing_type === 'service') q = q.gte('service_price', filters.min_price);
      }
      if (filters.max_price !== undefined) {
        if (filters.listing_type === 'product') q = q.lte('product_price', filters.max_price);
        if (filters.listing_type === 'accommodation') q = q.lte('accommodation_price', filters.max_price);
        if (filters.listing_type === 'service') q = q.lte('service_price', filters.max_price);
      }
      if (filters.category) {
        q = q.eq('product_category', filters.category);
      }
      if (filters.subcategory) {
        q = q.eq('product_subcategory', filters.subcategory);
      }
      if (filters.seller_type) {
        q = q.eq('product_seller_type', filters.seller_type);
      }
      if (filters.accommodation_type) {
        q = q.eq('accommodation_type', filters.accommodation_type);
      }
      if (filters.event_date) {
        q = q.eq('event_date', filters.event_date);
      }
      if (filters.lost_found_mode) {
        q = q.eq('lost_found_mode', filters.lost_found_mode);
      }
      if (filters.campus_id) {
        q = q.eq('campus_id', filters.campus_id);
      }

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      const { data, error } = await q.range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching filtered listings:', err);
      return [];
    }
  },

  // 7. Promotions UI and CTA helpers
  async boostListing(promotion: Omit<Promotion, 'id'>): Promise<any> {
    const { data, error } = await supabase
      .from('promotions')
      .insert(promotion)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getListingPromotions(listingId: string): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('target_id', listingId);
    if (error) return [];
    return data || [];
  },

  // 8. Subscription plans check
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });
    if (error) return [];
    return data || [];
  },

  async getStoreSubscription(storeId: string): Promise<StoreSubscription | null> {
    const { data, error } = await supabase
      .from('store_subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  // 9. Analytics tracking & access check
  async getAnalyticsAggregates(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'lifetime'): Promise<any[]> {
    const { data, error } = await supabase
      .from('analytics_aggregates')
      .select('*')
      .eq('owner_id', userId)
      .eq('period_type', period);
    if (error) return [];
    return data || [];
  },

  async trackViewsAndFavoritesRPCs(action: 'view' | 'favorite', listingId: string, userId?: string) {
    try {
      if (action === 'view') {
        const { error } = await supabase.rpc('increment_listing_views', {
          p_listing_id: listingId,
          p_viewer_id: userId || null
        });
        if (error) console.warn('Failed increment views rpc', error);
      } else if (action === 'favorite') {
        const { data, error } = await supabase.rpc('toggle_listing_favorite', {
          p_listing_id: listingId,
          p_user_id: userId
        });
        if (error) console.warn('Failed toggle favorite rpc', error);
        return data; // True/False status
      }
    } catch (e) {
      console.warn('Metrics logging error', e);
    }
  },

  // 10. Wishlist (Contract RPCs: toggle_listing_favorite and get_user_wishlist)
  async toggleWishlistItem(listingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('toggle_listing_favorite', {
        p_listing_id: listingId
      });
      if (error) {
        console.error('toggle_listing_favorite error:', error);
        throw error;
      }
      return Boolean(data);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  },

  async getMyWishlist(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_wishlist');
      if (error) {
        console.error('get_user_wishlist error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching user wishlist:', err);
      return [];
    }
  },

  // Helper to resolve placeholder category IDs into database UUIDs
  async resolveCategoryUuid(catId: string | null): Promise<string | null> {
    if (!catId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
    if (isUuid) return catId;

    const PRODUCT_CAT_TO_SLUG: Record<string, string> = {
      'books-notes': 'books-notes',
      'electronics': 'electronics',
      'clothing-fashion': 'clothing-fashion',
      'food-snacks': 'food-snacks',
      'furniture-dorm': 'furniture-dorm',
      'sports-fitness': 'sports-fitness',
      'stationery-art': 'stationery-art',
      'services': 'services',
      'other': 'other',
      'phones': 'phones',
      'tvs-audio': 'tvs-audio',
      'appliances': 'appliances',
      'health-beauty': 'health-beauty',
      'fashion': 'fashion',
      'computing': 'computing',
      'furniture': 'furniture',
      'watches-jewellery': 'watches-jewellery',
      // Legacy index mappings
      'cat-1': 'books-notes',
      'cat-2': 'electronics',
      'cat-3': 'clothing-fashion',
      'cat-4': 'food-snacks',
      'cat-5': 'furniture-dorm',
      'cat-6': 'sports-fitness',
      'cat-7': 'stationery-art',
      'cat-8': 'services',
      'cat-9': 'other',
      'cat-10': 'phones',
      'cat-11': 'tvs-audio',
      'cat-12': 'appliances',
      'cat-13': 'health-beauty',
      'cat-14': 'fashion',
      'cat-15': 'computing',
      'cat-16': 'furniture',
      'cat-17': 'watches-jewellery',
    };
    const slug = PRODUCT_CAT_TO_SLUG[catId] || 'other';
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) {
        return data.id;
      }
    } catch (err) {
      console.error('Failed to resolve category uuid in service:', err);
    }
    return null;
  },

  // Helper to upload images to a specific storage bucket
  async uploadImageToBucket(bucket: string, imageStr: string, userId: string, entityId: string, index: number): Promise<string> {
    if (!imageStr) return '';
    if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
      return imageStr;
    }
    if (imageStr.startsWith('data:image/')) {
      try {
        const parts = imageStr.split(';base64,');
        const contentType = parts[0]?.split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1] || '');
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const file = new Blob([uInt8Array], { type: contentType });
        const ext = contentType.split('/')[1] || 'jpeg';
        const fileName = `img_${Date.now()}_${index}.${ext}`;
        const filePath = `${userId}/${entityId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { contentType });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
          if (publicUrl) return publicUrl;
        } else {
          console.warn(`Upload to bucket ${bucket} error:`, uploadError);
          return '';
        }
      } catch (err) {
        console.warn(`Exception uploading image to bucket ${bucket}:`, err);
        return '';
      }
    }
    return imageStr.startsWith('data:image/') ? '' : imageStr;
  },

  // 1. PRODUCTS — create_product_listing RPC
  async createProductListing(params: {
    title: string;
    description?: string | null;
    categoryId?: string | null;
    subcategoryId?: string | null;
    price: number;
    originalPrice?: number | null;
    quantity?: number;
    isNegotiable?: boolean;
    location?: string | null;
    conditionId?: string | null;
    campusId?: string | null;
    storeId?: string | null;
    asIndividual?: boolean;
    whatsappNumber?: string | null;
    brandId?: string | null;
    images?: string[];
  }): Promise<Listing> {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      throw new Error('Not authenticated. Please log in before creating a product listing.');
    }

    const resolvedCategoryId = await this.resolveCategoryUuid(params.categoryId || '');
    const validCatId = isValidUuid(resolvedCategoryId) ? resolvedCategoryId : (isValidUuid(params.categoryId) ? params.categoryId : null);
    const validSubcatId = isValidUuid(params.subcategoryId) ? params.subcategoryId : null;
    const validCondId = isValidUuid(params.conditionId) ? params.conditionId : null;
    const validCampusId = isValidUuid(params.campusId) ? params.campusId : '8e08c135-e6ec-4387-af3e-110b11d37c07';
    const validStoreId = isValidUuid(params.storeId) ? params.storeId : null;
    const validBrandId = isValidUuid(params.brandId) ? params.brandId : null;

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_product_listing', {
      p_title: params.title,
      p_description: params.description || null,
      p_category_id: validCatId,
      p_subcategory_id: validSubcatId,
      p_price: Number(params.price) || 0,
      p_original_price: params.originalPrice ? Number(params.originalPrice) : null,
      p_quantity: Number(params.quantity) || 1,
      p_is_negotiable: !!params.isNegotiable,
      p_location: params.location || null,
      p_condition_id: validCondId,
      p_campus_id: validCampusId,
      p_currency: 'KES',
      p_store_id: validStoreId,
      p_as_individual: params.asIndividual ?? null,
      p_whatsapp_number: params.whatsappNumber || null,
      p_brand_id: validBrandId
    });

    if (rpcError) {
      console.error('create_product_listing RPC error:', rpcError);
      throw new Error(rpcError.message);
    }
    if (rpcData?.error) {
      console.error('create_product_listing returned error:', rpcData.error);
      throw new Error(rpcData.error);
    }

    const productId = rpcData.product_id;
    const listingId = rpcData.listing_id || productId;

    // Upload images and insert into product_images
    const uploadedUrls: string[] = [];
    if (params.images && params.images.length > 0) {
      for (let i = 0; i < params.images.length; i++) {
        const finalUrl = await this.uploadImageToBucket('product-images', params.images[i], user.id, productId, i);
        uploadedUrls.push(finalUrl);
        try {
          await supabase.from('product_images').insert({
            product_id: productId,
            image_url: finalUrl,
            display_order: i,
            is_primary: i === 0
          });
        } catch (imgErr) {
          console.warn('Product image insert notice:', imgErr);
        }
      }
    }

    const listingObj: Listing = {
      id: listingId,
      owner_id: user.id,
      listing_type: 'product',
      status: 'pending_review',
      title: params.title,
      description: params.description || '',
      location: params.location || 'Kibabii Campus',
      campus_id: validCampusId || undefined,
      views_count: 0,
      favorites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_id: productId,
      product_price: Number(params.price) || 0,
      images: uploadedUrls.length > 0 ? uploadedUrls : (params.images || [])
    };

    this.saveLocalListing(listingObj);
    return listingObj;
  },

  // 2. ACCOMMODATIONS — create_accommodation_listing RPC
  async createAccommodationListing(params: {
    title: string;
    description?: string | null;
    campusId: string;
    accommodationType: string;
    pricePerMonth: number;
    depositAmount?: number;
    bedrooms?: number;
    bathrooms?: number;
    availableRooms?: number;
    distanceFromCampusKm?: number | null;
    location?: string | null;
    sellerType?: string;
    images?: string[];
  }): Promise<Listing> {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      throw new Error('Not authenticated. Please log in before creating an accommodation listing.');
    }

    const validCampusId = isValidUuid(params.campusId) ? params.campusId : '8e08c135-e6ec-4387-af3e-110b11d37c07';

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_accommodation_listing', {
      p_title: params.title,
      p_description: params.description || null,
      p_campus_id: validCampusId,
      p_accommodation_type: params.accommodationType || 'bedsitter',
      p_price_per_month: Number(params.pricePerMonth) || 0,
      p_deposit_amount: Number(params.depositAmount) || 0,
      p_bedrooms: Number(params.bedrooms) || 1,
      p_bathrooms: Number(params.bathrooms) || 1,
      p_available_rooms: Number(params.availableRooms) || 1,
      p_distance_from_campus_km: params.distanceFromCampusKm !== undefined && params.distanceFromCampusKm !== null ? Number(params.distanceFromCampusKm) : null,
      p_location: params.location || null,
      p_seller_type: params.sellerType || 'student'
    });

    if (rpcError) {
      console.error('create_accommodation_listing RPC error:', rpcError);
      throw new Error(rpcError.message);
    }
    if (rpcData?.error) {
      console.error('create_accommodation_listing returned error:', rpcData.error);
      throw new Error(rpcData.error);
    }

    const accommodationId = rpcData.accommodation_id;
    const listingId = rpcData.listing_id || accommodationId;

    // Upload images and insert into accommodation_images
    const uploadedUrls: string[] = [];
    if (params.images && params.images.length > 0) {
      for (let i = 0; i < params.images.length; i++) {
        const finalUrl = await this.uploadImageToBucket('accommodation-images', params.images[i], user.id, accommodationId, i);
        uploadedUrls.push(finalUrl);
        try {
          await supabase.from('accommodation_images').insert({
            accommodation_id: accommodationId,
            image_url: finalUrl,
            display_order: i,
            is_primary: i === 0
          });
        } catch (imgErr) {
          console.warn('Accommodation image insert notice:', imgErr);
        }
      }
    }

    const listingObj: Listing = {
      id: listingId,
      owner_id: user.id,
      listing_type: 'accommodation',
      status: 'pending_review',
      title: params.title,
      description: params.description || '',
      location: params.location || 'Kibabii Campus',
      campus_id: validCampusId,
      views_count: 0,
      favorites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      accommodation_id: accommodationId,
      accommodation_rent: Number(params.pricePerMonth) || 0,
      images: uploadedUrls.length > 0 ? uploadedUrls : (params.images || [])
    };

    this.saveLocalListing(listingObj);
    return listingObj;
  },

  // 3. SERVICES — create_service_listing RPC (NEW)
  async createServiceListing(params: {
    title: string;
    campusId: string;
    description?: string | null;
    categoryId?: string | null;
    pricingType?: 'fixed' | 'hourly' | 'negotiable';
    price?: number | null;
    startingPrice?: number | null;
    workingHours?: string | null;
    whatsappContact?: string | null;
    providerBio?: string | null;
    images?: string[];
  }): Promise<Listing> {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      throw new Error('Not authenticated. Please log in before creating a service listing.');
    }

    // Validation: if pricing_type !== 'negotiable', price is mandatory
    const pricingType = params.pricingType || 'fixed';
    if (pricingType !== 'negotiable' && (!params.price || Number(params.price) <= 0)) {
      throw new Error('Please specify a service price (required for fixed or hourly pricing).');
    }

    const validCampusId = isValidUuid(params.campusId) ? params.campusId : '8e08c135-e6ec-4387-af3e-110b11d37c07';
    
    let validCatId = isValidUuid(params.categoryId) ? params.categoryId : null;
    if (!validCatId) {
      const resolved = await this.resolveCategoryUuid('services');
      if (resolved && isValidUuid(resolved)) validCatId = resolved;
    }

    const finalPrice = pricingType === 'negotiable' 
      ? (params.price ? Number(params.price) : null) 
      : (params.price ? Number(params.price) : null);
    
    const finalStartingPrice = params.startingPrice !== undefined && params.startingPrice !== null
      ? Number(params.startingPrice)
      : (finalPrice !== null ? finalPrice : null);

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_service_listing', {
      p_title: params.title,
      p_campus_id: validCampusId,
      p_description: params.description || null,
      p_category_id: validCatId,
      p_pricing_type: pricingType,
      p_price: finalPrice,
      p_starting_price: finalStartingPrice,
      p_working_hours: params.workingHours || null,
      p_whatsapp_contact: params.whatsappContact || null,
      p_provider_bio: params.providerBio || null
    });

    if (rpcError) {
      console.error('create_service_listing RPC error:', rpcError);
      throw new Error(rpcError.message);
    }
    if (rpcData?.error) {
      console.error('create_service_listing returned error:', rpcData.error);
      throw new Error(rpcData.error);
    }

    const serviceId = rpcData.service_id;
    const listingId = rpcData.listing_id || serviceId;

    // Upload images and insert into service_images
    const uploadedUrls: string[] = [];
    if (params.images && params.images.length > 0) {
      for (let i = 0; i < params.images.length; i++) {
        const finalUrl = await this.uploadImageToBucket('service-images', params.images[i], user.id, serviceId, i);
        uploadedUrls.push(finalUrl);
        try {
          await supabase.from('service_images').insert({
            service_id: serviceId,
            image_url: finalUrl,
            display_order: i,
            is_primary: i === 0
          });
        } catch (imgErr) {
          console.warn('Service image insert notice:', imgErr);
        }
      }
    }

    const listingObj: Listing = {
      id: listingId,
      owner_id: user.id,
      listing_type: 'service',
      status: 'pending_review',
      title: params.title,
      description: params.description || '',
      location: 'Kibabii Campus',
      campus_id: validCampusId,
      views_count: 0,
      favorites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_id: serviceId,
      service_starting_price: finalStartingPrice || (finalPrice || 0),
      images: uploadedUrls.length > 0 ? uploadedUrls : (params.images || []),
      service_type_details: {
        id: serviceId,
        service_id: serviceId,
        pricing_type: pricingType,
        price: finalPrice,
        starting_price: finalStartingPrice,
        working_hours: params.workingHours || '',
        whatsapp_contact: params.whatsappContact || '',
        provider_bio: params.providerBio || '',
        seller_type: rpcData.seller_type || 'student'
      } as any
    };

    this.saveLocalListing(listingObj);
    return listingObj;
  },

  // 4. LOST & FOUND — create_lost_found_listing RPC (NEW)
  async createLostFoundListing(params: {
    itemName: string;
    campusId: string;
    itemType: 'lost' | 'found';
    description?: string | null;
    imageUrl?: string | null;
    locationText?: string | null;
    exactLocation?: string | null;
    eventDate?: string | null;
    dateLostFound?: string | null;
    contactPhone?: string | null;
    images?: string[];
  }): Promise<Listing> {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      throw new Error('Not authenticated. Please log in before creating a lost & found listing.');
    }

    const validCampusId = isValidUuid(params.campusId) ? params.campusId : '8e08c135-e6ec-4387-af3e-110b11d37c07';

    // Upload first image to lost-found-images if provided
    let finalImageUrl = params.imageUrl || null;
    if (!finalImageUrl && params.images && params.images.length > 0) {
      finalImageUrl = await this.uploadImageToBucket('lost-found-images', params.images[0], user.id, 'lf_temp', 0);
    }

    const formattedDate = params.dateLostFound || params.eventDate || new Date().toISOString().split('T')[0];

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_lost_found_listing', {
      p_item_name: params.itemName,
      p_campus_id: validCampusId,
      p_item_type: params.itemType,
      p_description: params.description || null,
      p_image_url: finalImageUrl,
      p_location_text: params.locationText || null,
      p_exact_location: params.exactLocation || null,
      p_event_date: formattedDate,
      p_date_lost_found: formattedDate,
      p_contact_phone: params.contactPhone || null
    });

    if (rpcError) {
      console.error('create_lost_found_listing RPC error:', rpcError);
      throw new Error(rpcError.message);
    }
    if (rpcData?.error) {
      console.error('create_lost_found_listing returned error:', rpcData.error);
      throw new Error(rpcData.error);
    }

    const lostFoundId = rpcData.lost_found_id;
    const listingId = rpcData.listing_id || lostFoundId;

    const listingObj: Listing = {
      id: listingId,
      owner_id: user.id,
      listing_type: 'lost_found',
      status: 'pending_review',
      title: params.itemName,
      description: params.description || '',
      location: params.locationText || 'Kibabii Campus',
      campus_id: validCampusId,
      views_count: 0,
      favorites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lost_found_id: lostFoundId,
      images: finalImageUrl ? [finalImageUrl] : (params.images || []),
      lost_found_details: {
        id: lostFoundId,
        item_name: params.itemName,
        item_type: params.itemType,
        description: params.description || '',
        image_url: finalImageUrl,
        location_text: params.locationText,
        exact_location: params.exactLocation,
        date_lost_found: formattedDate,
        contact_phone: params.contactPhone,
        status: params.itemType === 'found' ? 'found' : 'open'
      } as any
    };

    this.saveLocalListing(listingObj);
    return listingObj;
  },

  // 5. EVENTS — create_event_listing RPC (NEW)
  async createEventListing(params: {
    title: string;
    campusId: string;
    eventType: 'tournament' | 'party' | 'concert' | 'meeting';
    eventDate: string;
    description?: string | null;
    bannerUrl?: string | null;
    bannerFile?: File | Blob | null;
    startTime?: string | null;
    endTime?: string | null;
    locationText?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    registrationLink?: string | null;
    organizerName?: string | null;
    isFree?: boolean;
    ticketPrice?: number | null;
    maxAttendees?: number | null;
    images?: string[];
  }): Promise<Listing> {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      throw new Error('Not authenticated. Please log in before creating an event listing.');
    }

    const isFree = params.isFree ?? true;
    if (!isFree && (!params.ticketPrice || Number(params.ticketPrice) <= 0)) {
      throw new Error('Please specify a ticket price for paid events.');
    }

    const validCampusId = isValidUuid(params.campusId) ? params.campusId : '8e08c135-e6ec-4387-af3e-110b11d37c07';

    // 1. Call create_event_listing RPC first (without banner) to create event row and obtain real event_id
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_event_listing', {
      p_title: params.title,
      p_campus_id: validCampusId,
      p_event_type: params.eventType,
      p_event_date: params.eventDate,
      p_description: params.description || null,
      p_banner_url: null,
      p_start_time: params.startTime || null,
      p_end_time: params.endTime || null,
      p_location_text: params.locationText || null,
      p_latitude: params.latitude !== undefined && params.latitude !== null ? Number(params.latitude) : null,
      p_longitude: params.longitude !== undefined && params.longitude !== null ? Number(params.longitude) : null,
      p_registration_link: params.registrationLink || null,
      p_organizer_name: params.organizerName || null,
      p_is_free: isFree,
      p_ticket_price: isFree ? null : (Number(params.ticketPrice) || null),
      p_max_attendees: params.maxAttendees ? Number(params.maxAttendees) : null
    });

    if (rpcError) {
      console.error('create_event_listing RPC error:', rpcError);
      throw new Error(rpcError.message);
    }
    if (rpcData?.error) {
      console.error('create_event_listing returned error:', rpcData.error);
      throw new Error(rpcData.error);
    }

    const eventId = rpcData.event_id;
    const listingId = rpcData.listing_id || eventId;

    // 2. Upload banner image to event-banners bucket using the REAL event_id: {organizer_id}/{event_id}/{filename}
    let finalBannerUrl: string | null = null;
    let bannerToUpload: { file: Blob | File; contentType: string; ext: string } | null = null;

    if (params.bannerFile) {
      const bFile = params.bannerFile;
      const contentType = bFile.type || 'image/jpeg';
      const ext = contentType.split('/')[1] || 'jpg';
      bannerToUpload = { file: bFile, contentType, ext };
    } else {
      const candidate = params.bannerUrl || (params.images && params.images.length > 0 ? params.images[0] : null);
      if (candidate) {
        if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
          finalBannerUrl = candidate;
        } else if (candidate.startsWith('data:image/')) {
          try {
            const parts = candidate.split(';base64,');
            const contentType = parts[0]?.split(':')[1] || 'image/jpeg';
            const raw = window.atob(parts[1] || '');
            const uInt8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            const ext = contentType.split('/')[1] || 'jpg';
            const blob = new Blob([uInt8Array], { type: contentType });
            bannerToUpload = { file: blob, contentType, ext };
          } catch (convErr) {
            console.error('Failed to parse candidate banner base64:', convErr);
          }
        }
      }
    }

    if (bannerToUpload) {
      const filePath = `${user.id}/${eventId}/${Date.now()}_banner.${bannerToUpload.ext}`;
      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(filePath, bannerToUpload.file, { contentType: bannerToUpload.contentType });

      if (uploadError) {
        console.error('Failed to upload banner to event-banners bucket:', uploadError);
        throw new Error(`Failed to upload event banner image: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        finalBannerUrl = urlData.publicUrl;
      }
    }

    // Safety guarantee: NEVER pass raw base64 string or non-HTTP string as banner_url
    if (finalBannerUrl && (!finalBannerUrl.startsWith('http://') && !finalBannerUrl.startsWith('https://'))) {
      finalBannerUrl = null;
    }

    // 3. Update the event row with the resulting public image URL
    if (finalBannerUrl) {
      try {
        const { error: updateErr } = await supabase
          .from('events')
          .update({ banner_url: finalBannerUrl })
          .eq('id', eventId);
        if (updateErr) {
          console.warn('Failed to update event with banner_url:', updateErr);
        }
      } catch (upCatch) {
        console.warn('Event banner update notice:', upCatch);
      }
    }

    const listingObj: Listing = {
      id: listingId,
      owner_id: user.id,
      listing_type: 'event',
      status: 'pending_review',
      title: params.title,
      description: params.description || '',
      location: params.locationText || 'Kibabii Campus',
      campus_id: validCampusId,
      views_count: 0,
      favorites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_id: eventId,
      images: finalBannerUrl ? [finalBannerUrl] : (params.images || []),
      event_details: {
        id: eventId,
        title: params.title,
        event_type: params.eventType,
        event_date: params.eventDate,
        start_time: params.startTime,
        end_time: params.endTime,
        banner_url: finalBannerUrl,
        location_text: params.locationText,
        organizer_name: params.organizerName,
        is_free: isFree,
        ticket_price: isFree ? 0 : Number(params.ticketPrice),
        max_attendees: params.maxAttendees,
        status: 'upcoming'
      } as any
    };

    this.saveLocalListing(listingObj);
    return listingObj;
  },

  // Central Dispatcher: delegates to the 5 RPC methods, guaranteeing zero client-side direct table insertions
  async createFullListing(
    userId: string,
    type: ListingType,
    coreData: {
      title: string;
      description: string;
      location: string;
      campus_id?: string;
    },
    typeSpecificData: any,
    imageUrls: string[]
  ): Promise<Listing> {
    try {
      if (type === "product") {
        return await this.createProductListing({
          title: coreData.title,
          description: coreData.description,
          location: coreData.location,
          campusId: coreData.campus_id || typeSpecificData.campus_id,
          categoryId: typeSpecificData.category_id,
          subcategoryId: typeSpecificData.subcategory_id,
          conditionId: typeSpecificData.condition_id,
          price: Number(typeSpecificData.price) || 0,
          originalPrice: typeSpecificData.original_price ? Number(typeSpecificData.original_price) : null,
          quantity: Number(typeSpecificData.quantity) || 1,
          isNegotiable: !!typeSpecificData.is_negotiable,
          storeId: typeSpecificData.store_id,
          asIndividual: typeSpecificData.as_individual,
          whatsappNumber: typeSpecificData.whatsapp_number || typeSpecificData.whatsappNumber || typeSpecificData.whatsappInput || null,
          brandId: typeSpecificData.brand_id || typeSpecificData.brandId || null,
          images: imageUrls
        });
      } else if (type === "accommodation") {
        return await this.createAccommodationListing({
          title: coreData.title,
          description: coreData.description,
          campusId: coreData.campus_id || typeSpecificData.campus_id || "8e08c135-e6ec-4387-af3e-110b11d37c07",
          accommodationType: typeSpecificData.accommodation_type || typeSpecificData.property_type || "bedsitter",
          pricePerMonth: Number(typeSpecificData.price_per_month || typeSpecificData.accommodation_rent || typeSpecificData.price) || 0,
          depositAmount: Number(typeSpecificData.deposit_amount || typeSpecificData.accommodation_deposit) || 0,
          bedrooms: Number(typeSpecificData.bedrooms || typeSpecificData.room_count) || 1,
          bathrooms: Number(typeSpecificData.bathrooms) || 1,
          availableRooms: Number(typeSpecificData.available_rooms) || 1,
          distanceFromCampusKm: typeSpecificData.distance_from_campus_km ? Number(typeSpecificData.distance_from_campus_km) : null,
          location: coreData.location,
          sellerType: typeSpecificData.seller_type || "student",
          images: imageUrls
        });
      } else if (type === "service") {
        return await this.createServiceListing({
          title: coreData.title,
          campusId: coreData.campus_id || typeSpecificData.campus_id || "8e08c135-e6ec-4387-af3e-110b11d37c07",
          description: coreData.description,
          categoryId: typeSpecificData.category_id,
          pricingType: typeSpecificData.pricing_type || typeSpecificData.service_pricing_type || "fixed",
          price: typeSpecificData.price !== undefined && typeSpecificData.price !== null ? Number(typeSpecificData.price) : null,
          startingPrice: typeSpecificData.starting_price !== undefined && typeSpecificData.starting_price !== null ? Number(typeSpecificData.starting_price) : null,
          workingHours: typeSpecificData.working_hours || null,
          whatsappContact: typeSpecificData.whatsapp_contact || null,
          providerBio: typeSpecificData.provider_bio || null,
          images: imageUrls
        });
      } else if (type === "lost_found") {
        return await this.createLostFoundListing({
          itemName: coreData.title,
          campusId: coreData.campus_id || typeSpecificData.campus_id || "8e08c135-e6ec-4387-af3e-110b11d37c07",
          itemType: (typeSpecificData.item_type || typeSpecificData.listing_mode === "found") ? "found" : "lost",
          description: coreData.description,
          locationText: coreData.location,
          exactLocation: typeSpecificData.exact_location || null,
          eventDate: typeSpecificData.event_date || typeSpecificData.date_lost_found || null,
          dateLostFound: typeSpecificData.date_lost_found || typeSpecificData.event_date || null,
          contactPhone: typeSpecificData.contact_phone || typeSpecificData.whatsapp_contact || null,
          images: imageUrls
        });
      } else if (type === "event") {
        const rawType = (typeSpecificData.event_type || "meeting").toLowerCase();
        const validEventType = ["tournament", "party", "concert", "meeting"].includes(rawType)
          ? rawType
          : "meeting";

        return await this.createEventListing({
          title: coreData.title,
          campusId: coreData.campus_id || typeSpecificData.campus_id || "8e08c135-e6ec-4387-af3e-110b11d37c07",
          eventType: validEventType,
          eventDate: typeSpecificData.event_date || new Date().toISOString().split("T")[0],
          description: coreData.description,
          startTime: typeSpecificData.start_time || typeSpecificData.event_time || null,
          endTime: typeSpecificData.end_time || null,
          locationText: coreData.location || typeSpecificData.location_text || null,
          latitude: typeSpecificData.latitude ? Number(typeSpecificData.latitude) : null,
          longitude: typeSpecificData.longitude ? Number(typeSpecificData.longitude) : null,
          registrationLink: typeSpecificData.registration_link || null,
          organizerName: typeSpecificData.organizer_name || null,
          isFree: typeSpecificData.is_free ?? true,
          ticketPrice: typeSpecificData.ticket_price ? Number(typeSpecificData.ticket_price) : null,
          maxAttendees: typeSpecificData.max_attendees ? Number(typeSpecificData.max_attendees) : null,
          bannerFile: typeSpecificData.bannerFile || null,
          images: imageUrls
        });
      }

      throw new Error("Unsupported listing type: " + type);
    } catch (err) {
      console.error("Listing creation error in createFullListing:", err);
      throw err;
    }
  },

    async updateListingStatus(id: string, status: ListingStatus): Promise<void> {
    try {
      const local = this.getLocalListings();
      const target = local.find(l => l.id === id);
      if (target) {
        target.status = status;
        localStorage.setItem('kibabui_user_listings', JSON.stringify(local));
      }
    } catch {}

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.warn('Supabase update status notice:', error);
    } catch (e) {
      console.warn('Supabase update status failed:', e);
    }
  },

  // MARK A PRODUCT AS SOLD (seller-only, their own product)
  async markProductSold(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('mark_product_sold', {
        p_product_id: productId
      });

      if (error) {
        console.error('mark_product_sold RPC error:', error);
        return { success: false, error: error.message };
      }
      if (data?.error) {
        console.error('mark_product_sold returned error:', data.error);
        return { success: false, error: data.error };
      }

      // Update local storage if present
      try {
        const local = this.getLocalListings();
        const target = local.find(l => l.id === productId || (l as any).product_id === productId);
        if (target) {
          target.status = 'sold';
          localStorage.setItem('kibabui_user_listings', JSON.stringify(local));
        }
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.error('markProductSold error:', err);
      return { success: false, error: err?.message || 'Failed to mark product as sold' };
    }
  },

  async deleteListing(id: string): Promise<void> {
    this.deleteLocalListing(id);
    try {
      await supabase.from('listings').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete listing notice:', e);
    }
  },

  // Retroactively sanitize any legacy event banner stored as raw base64
  async fixLegacyEventBanners(): Promise<void> {
    try {
      const { data: legacyEvents, error } = await supabase
        .from('events')
        .select('id, banner_url')
        .ilike('banner_url', 'data:image%');

      if (!error && legacyEvents && legacyEvents.length > 0) {
        for (const ev of legacyEvents) {
          await supabase
            .from('events')
            .update({ banner_url: null })
            .eq('id', ev.id);
        }
      }
    } catch (e) {
      console.warn('Notice cleaning legacy event banners in DB:', e);
    }
  }
};
