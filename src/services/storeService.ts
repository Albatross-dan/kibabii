import { supabase } from '@/lib/supabase';
import { isValidUuid, toValidUuid } from '@/lib/uuid';

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  store_name?: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  campus_id?: string | null;
  status?: string;
  verification_status?: string;
  subscription_plan?: string;
  is_verified?: boolean;
  verification_badge_tier?: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: any;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-')        // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

export function shortRandomSuffix(): string {
  return Math.random().toString(36).substring(2, 7);
}

export const storeService = {
  /**
   * Check if a specific user already has a store
   */
  async getUserStore(userId: string): Promise<Store | null> {
    if (!userId) return null;
    const sanitizedId = isValidUuid(userId) ? userId : toValidUuid(userId);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', sanitizedId)
        .maybeSingle();

      if (!error && data) {
        return data as Store;
      }
    } catch (err) {
      console.warn('Exception fetching user store from Supabase:', err);
    }

    return null;
  },

  /**
   * Create a new store for the shop owner flow
   * Follows backend contract:
   * - owner_id: user.id (auth.uid())
   * - name: storeName (REQUIRED)
   * - store_name: storeName (legacy duplicate column)
   * - slug: slugify(storeName) + '-' + shortRandomSuffix() (REQUIRED, unique)
   * - description, category, location, campus_id (optional)
   */
  async createStore(params: {
    userId: string;
    name: string;
    description?: string;
    category?: string;
    location?: string;
    campusId?: string;
  }): Promise<{ data: Store | null; error: any }> {
    const storeName = params.name.trim();
    if (!storeName) {
      return { data: null, error: new Error('Store name is required') };
    }

    const slug = `${slugify(storeName)}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      let ownerId = params.userId;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        ownerId = user.id;
      }

      let createdStore: any = null;

      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_id: ownerId,
          name: storeName,
          store_name: storeName,
          slug: slug,
          description: params.description?.trim() || null,
          category: params.category?.trim() || null,
          location: params.location?.trim() || null,
          campus_id: params.campusId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase store creation error:', error);
        return { data: null, error };
      }

      return { data: data as Store, error: null };
    } catch (err) {
      console.error('Store creation exception:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch a store by its ID or unique slug
   */
  async getStoreByIdOrSlug(idOrSlug: string): Promise<Store | null> {
    if (!idOrSlug) return null;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*, owner:public_profiles(*)')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (!error && data) {
        return data as Store;
      }
    } catch (err) {
      console.warn('Exception fetching store by ID/slug:', err);
    }

    return null;
  },

  /**
   * Fetch all active products belonging to a store
   */
  async getStoreProducts(storeId: string): Promise<any[]> {
    if (!storeId) return [];
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (image_url, is_primary, display_order),
          stores (*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching store products:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Exception fetching store products:', err);
      return [];
    }
  }
};
