import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { listingService } from './listingService';
import { isValidUuid, toValidUuid } from '@/lib/uuid';

export type Product = Database['public']['Tables']['products']['Row'] & {
  seller?: Database['public']['Views']['public_profiles']['Row'] | Database['public']['Tables']['profiles']['Row'];
  category?: Database['public']['Tables']['categories']['Row'];
  rating?: number;
  total_reviews?: number;
  images?: string[];
  product_images?: Database['public']['Tables']['product_images']['Row'][];
  condition?: string;
  stock?: number;
  verification_status?: string;
  listing_type?: string;
  listing_id?: string;
  stores?: any;
  store?: any;
  seller_type?: 'student' | 'store' | string;
  store_id?: string | null;
};

export const productService = {
  async getProducts(filters?: {
    category_id?: string;
    condition?: string;
    status?: string;
    verification_status?: string;
    featured?: boolean;
    limit?: number;
    search?: string;
    seller_id?: string;
  }): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, seller:public_profiles(*), category:categories!products_category_id_fkey(*), product_images(image_url, is_primary, display_order), listings(id), stores(*)')
      .order('created_at', { ascending: false });

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'active');
    }
    if (filters?.seller_id) {
      const validSellerId = isValidUuid(filters.seller_id) ? filters.seller_id : toValidUuid(filters.seller_id);
      query = query.eq('seller_id', validSellerId);
    }
    if (filters?.verification_status) {
      query = query.eq('verification_status', filters.verification_status);
    }
    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    try {
      const { data, error } = await query;
      if (error) {
        // Fallback without the foreign key constraint alias in case relationship name varies
        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .select('*, seller:public_profiles(*), product_images(image_url, is_primary, display_order), listings(id), stores(*)')
          .order('created_at', { ascending: false });
        if (retryError) throw retryError;
        return (retryData || []).map((row: any) => ({
          ...row,
          listing_id: row.listings?.[0]?.id || row.listing_id || row.id,
          images: row.product_images?.map((img: any) => img.image_url) || []
        })) as Product[];
      }
      
      let products = (data || []).map((row: any) => ({
        ...row,
        listing_id: row.listings?.[0]?.id || row.listing_id || row.id,
        images: row.product_images?.map((img: any) => img.image_url) || []
      })) as Product[];

      // Merge locally created products
      try {
        const localListings = listingService.getLocalListings().filter(l => l.listing_type === 'product' && l.status === 'active');
        for (const loc of localListings) {
          if (!products.some(p => p.id === loc.id || (p as any).listing_id === loc.id)) {
            products.unshift({
              id: loc.id,
              title: loc.title,
              description: loc.description,
              price: loc.product_price || loc.product_details?.price || 0,
              currency: 'KES',
              original_price: loc.flash_sale_original_price || null,
              seller_type: (loc.product_seller_type as any) || 'student',
              seller_id: loc.owner_id,
              status: 'active',
              category_id: loc.product_category || 'general',
              condition: loc.product_condition || 'used',
              location: loc.location,
              created_at: loc.created_at,
              updated_at: loc.updated_at,
              images: loc.images || [],
              listing_id: loc.id,
              product_images: (loc.images || []).map((img, i) => ({
                id: `loc-img-${i}`,
                product_id: loc.id,
                image_url: img,
                is_primary: i === 0,
                display_order: i,
                created_at: loc.created_at
              })),
              seller: loc.owner
            } as any);
          }
        }
      } catch (e) {
        console.warn('Local listings merge notice:', e);
      }

      return products;
    } catch (err) {
      console.warn('getProducts Supabase query error:', err);
      try {
        const localListings = listingService.getLocalListings().filter(l => l.listing_type === 'product' && l.status === 'active');
        return localListings.map(loc => ({
          id: loc.id,
          title: loc.title,
          description: loc.description,
          price: loc.product_price || loc.product_details?.price || 0,
          currency: 'KES',
          original_price: loc.flash_sale_original_price || null,
          seller_type: (loc.product_seller_type as any) || 'student',
          seller_id: loc.owner_id,
          status: 'active',
          category_id: loc.product_category || 'general',
          condition: loc.product_condition || 'used',
          location: loc.location,
          created_at: loc.created_at,
          updated_at: loc.updated_at,
          images: loc.images || [],
          listing_id: loc.id,
          seller: loc.owner
        } as any));
      } catch {
        return [];
      }
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    if (!id) return null;

    // Check local listing first if non-UUID id
    if (!isValidUuid(id)) {
      const local = listingService.getLocalListingById(id);
      if (local) {
        return {
          id: local.id,
          title: local.title,
          description: local.description,
          price: local.product_price || local.product_details?.price || 0,
          currency: 'KES',
          original_price: local.flash_sale_original_price || null,
          seller_type: (local.product_seller_type as any) || 'student',
          seller_id: local.owner_id,
          status: local.status,
          category_id: local.product_category || 'general',
          condition: local.product_condition || 'used',
          location: local.location,
          created_at: local.created_at,
          updated_at: local.updated_at,
          images: local.images || [],
          listing_id: local.id,
          seller: local.owner
        } as any;
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:public_profiles(*), category:categories!products_category_id_fkey(*), product_images(image_url, is_primary, display_order), listings(id), stores(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .select('*, seller:public_profiles(*), product_images(image_url, is_primary, display_order), listings(id), stores(*)')
          .eq('id', id)
          .maybeSingle();
        if (retryError) throw retryError;
        if (!retryData) {
          const local = listingService.getLocalListingById(id);
          if (local) {
            return {
              id: local.id,
              title: local.title,
              description: local.description,
              price: local.product_price || local.product_details?.price || 0,
              currency: 'KES',
              original_price: local.flash_sale_original_price || null,
              seller_type: (local.product_seller_type as any) || 'student',
              seller_id: local.owner_id,
              status: local.status,
              category_id: local.product_category || 'general',
              condition: local.product_condition || 'used',
              location: local.location,
              created_at: local.created_at,
              updated_at: local.updated_at,
              images: local.images || [],
              listing_id: local.id,
              seller: local.owner
            } as any;
          }
          return null;
        }
        return {
          ...retryData,
          listing_id: retryData.listings?.[0]?.id || retryData.listing_id || retryData.id,
          images: retryData.product_images?.map((img: any) => img.image_url) || []
        } as Product;
      }
      
      if (!data) {
        const local = listingService.getLocalListingById(id);
        if (local) {
          return {
            id: local.id,
            title: local.title,
            description: local.description,
            price: local.product_price || local.product_details?.price || 0,
            currency: 'KES',
            original_price: local.flash_sale_original_price || null,
            seller_type: (local.product_seller_type as any) || 'student',
            seller_id: local.owner_id,
            status: local.status,
            category_id: local.product_category || 'general',
            condition: local.product_condition || 'used',
            location: local.location,
            created_at: local.created_at,
            updated_at: local.updated_at,
            images: local.images || [],
            listing_id: local.id,
            seller: local.owner
          } as any;
        }
        return null;
      }
      return {
        ...data,
        listing_id: data.listings?.[0]?.id || data.listing_id || data.id,
        images: data.product_images?.map((img: any) => img.image_url) || []
      } as Product;
    } catch (err) {
      console.warn(`getProductById for ID ${id} failed on Supabase:`, err);
      const local = listingService.getLocalListingById(id);
      if (local) {
        return {
          id: local.id,
          title: local.title,
          description: local.description,
          price: local.product_price || local.product_details?.price || 0,
          currency: 'KES',
          original_price: local.flash_sale_original_price || null,
          seller_type: (local.product_seller_type as any) || 'student',
          seller_id: local.owner_id,
          status: local.status,
          category_id: local.product_category || 'general',
          condition: local.product_condition || 'used',
          location: local.location,
          created_at: local.created_at,
          updated_at: local.updated_at,
          images: local.images || [],
          listing_id: local.id,
          seller: local.owner
        } as any;
      }
      return null;
    }
  },

  async createProduct(product: Database['public']['Tables']['products']['Insert']) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Database['public']['Tables']['products']['Update']) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

