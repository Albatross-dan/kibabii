import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type ReviewRow = Database['public']['Tables']['reviews']['Row'] & {
  reviewer?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
    verification_status?: string | null;
  } | null;
};

export interface SubmitReviewInput {
  reviewer_id: string;
  target_type: 'product' | 'service' | 'accommodation' | 'store';
  target_id: string;
  rating: number; // 1-5
  comment?: string | null;
  order_id?: string | null;
}

export interface ReviewActionResult {
  success: boolean;
  data?: ReviewRow | null;
  error?: string | null;
  isDuplicate?: boolean;
  isTimeExpired?: boolean;
}

export const reviewService = {
  /**
   * Submit a new review according to the backend contract:
   * - reviewer_id, target_type, target_id, rating (1-5), comment, order_id
   * - is_verified_purchase is NOT set by client; it is determined by the backend
   * - Returns the inserted row with read-back is_verified_purchase
   * - Gracefully catches duplicate review attempts (unique constraint violation 23505)
   */
  async submitReview(input: SubmitReviewInput): Promise<ReviewActionResult> {
    try {
      if (!input.reviewer_id) {
        return { success: false, error: 'You must be signed in to leave a review.' };
      }
      if (!input.rating || input.rating < 1 || input.rating > 5) {
        return { success: false, error: 'Please provide a star rating between 1 and 5.' };
      }
      if (!input.target_id) {
        return { success: false, error: 'Invalid review target.' };
      }

      const insertPayload: any = {
        reviewer_id: input.reviewer_id,
        target_type: input.target_type,
        target_id: input.target_id,
        rating: Math.round(input.rating),
        comment: input.comment ? input.comment.trim() : null,
      };

      // Pass order_id if present (backend independently verifies delivered status & items)
      if (input.order_id) {
        insertPayload.order_id = input.order_id;
      }

      // Check if user has already reviewed this target to handle gracefully
      const existing = await this.getUserReviewForTarget(input.reviewer_id, input.target_type, input.target_id);
      if (existing) {
        return {
          success: false,
          isDuplicate: true,
          error: "You have already reviewed this listing. You can update your existing review instead."
        };
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert(insertPayload)
        .select('*, reviewer:public_profiles(*)')
        .single();

      if (error) {
        // Unique constraint error or RLS policy violation on duplicate review
        if (
          error.code === '23505' || 
          error.code === '42501' ||
          error.message?.toLowerCase().includes('unique constraint') || 
          error.message?.toLowerCase().includes('duplicate key') ||
          error.message?.toLowerCase().includes('row-level security')
        ) {
          return {
            success: false,
            isDuplicate: true,
            error: "You have already reviewed this listing. You can update your existing review instead."
          };
        }
        return { success: false, error: error.message || 'Failed to post review. Please try again.' };
      }

      return { success: true, data: data as ReviewRow };
    } catch (err: any) {
      console.error('Error in submitReview:', err);
      return { success: false, error: err?.message || 'An unexpected error occurred while posting your review.' };
    }
  },

  /**
   * Update an existing review:
   * - Reviewer can update within 48 hours of posting.
   * - If older than 48 hours, surfaces clear message rather than raw RLS failure.
   */
  async updateReview(
    reviewId: string, 
    rating: number, 
    comment?: string | null, 
    createdAt?: string
  ): Promise<ReviewActionResult> {
    try {
      if (!reviewId) {
        return { success: false, error: 'Review identifier is missing.' };
      }

      // Check 48 hour window client-side first if createdAt is provided
      if (createdAt) {
        const reviewDate = new Date(createdAt).getTime();
        const now = Date.now();
        const hoursPassed = (now - reviewDate) / (1000 * 60 * 60);
        if (hoursPassed > 48) {
          return {
            success: false,
            isTimeExpired: true,
            error: 'Reviews can only be edited within 48 hours of posting.'
          };
        }
      }

      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: Math.round(rating),
          comment: comment ? comment.trim() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select('*, reviewer:public_profiles(*)')
        .single();

      if (error) {
        // Check if RLS blocked the update (likely outside 48 hours or not owner)
        if (error.code === '42501' || error.message?.toLowerCase().includes('policy') || error.message?.toLowerCase().includes('row-level security')) {
          return {
            success: false,
            isTimeExpired: true,
            error: 'Reviews can only be edited within 48 hours of posting.'
          };
        }
        return { success: false, error: error.message || 'Failed to update review.' };
      }

      return { success: true, data: data as ReviewRow };
    } catch (err: any) {
      console.error('Error in updateReview:', err);
      return { success: false, error: err?.message || 'Failed to update review.' };
    }
  },

  /**
   * Delete an existing review:
   * - Automatically triggers backend recalculation of listing rating and seller reputation.
   */
  async deleteReview(reviewId: string): Promise<ReviewActionResult> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        return { success: false, error: error.message || 'Failed to delete review.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error in deleteReview:', err);
      return { success: false, error: err?.message || 'Failed to delete review.' };
    }
  },

  /**
   * Fetch reviews for a specific target (product, service, accommodation, store)
   */
  async getReviewsForTarget(
    targetType: 'product' | 'service' | 'accommodation' | 'store', 
    targetId: string
  ): Promise<ReviewRow[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:public_profiles(*)')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn(`Error fetching reviews for ${targetType} ${targetId}:`, error);
        return [];
      }

      return (data || []) as ReviewRow[];
    } catch (err) {
      console.warn('getReviewsForTarget unexpected error:', err);
      return [];
    }
  },

  /**
   * Check if a specific user has already reviewed a target
   */
  async getUserReviewForTarget(
    userId: string, 
    targetType: 'product' | 'service' | 'accommodation' | 'store', 
    targetId: string
  ): Promise<ReviewRow | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:public_profiles(*)')
        .eq('reviewer_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (error || !data) return null;
      return data as ReviewRow;
    } catch {
      return null;
    }
  },

  /**
   * Find if the buyer has a delivered order containing this product
   * Used to pass order_id for server-side verified purchase validation
   */
  async getDeliveredOrderForProduct(
    buyerId: string, 
    productId: string
  ): Promise<{ order_id: string; created_at: string } | null> {
    try {
      // Find delivered orders by this buyer
      const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id, created_at, order_items(product_id)')
        .eq('buyer_id', buyerId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (oErr || !orders || orders.length === 0) return null;

      for (const ord of orders) {
        const items = (ord as any).order_items || [];
        const contains = items.some((item: any) => item.product_id === productId);
        if (contains) {
          return { order_id: ord.id, created_at: ord.created_at };
        }
      }
      return null;
    } catch (err) {
      console.warn('Error checking delivered order for product:', err);
      return null;
    }
  },

  /**
   * Overall seller reputation aggregated across ALL their listings:
   * Read directly from profiles.seller_rating / profiles.seller_rating_count,
   * falling back to public_profiles.
   * NEVER calculates an average client-side!
   */
  async getSellerReputation(sellerId: string): Promise<{
    seller_rating: number;
    seller_rating_count: number;
  }> {
    if (!sellerId) return { seller_rating: 0, seller_rating_count: 0 };

    try {
      // 1. Try profiles table (populated for authenticated user's own profile or if accessible)
      const { data: profData } = await supabase
        .from('profiles')
        .select('seller_rating, seller_rating_count')
        .eq('id', sellerId)
        .maybeSingle();

      if (profData && profData.seller_rating !== undefined && profData.seller_rating !== null) {
        return {
          seller_rating: Number(profData.seller_rating) || 0,
          seller_rating_count: Number(profData.seller_rating_count) || 0
        };
      }

      // 2. Query public_profiles view
      const { data: pubData } = await supabase
        .from('public_profiles')
        .select('seller_rating, total_reviews, rating')
        .eq('id', sellerId)
        .maybeSingle();

      if (pubData) {
        return {
          seller_rating: Number(pubData.seller_rating ?? pubData.rating) || 0,
          seller_rating_count: Number(pubData.total_reviews) || 0
        };
      }
    } catch (err) {
      console.warn(`Error fetching seller reputation for ${sellerId}:`, err);
    }

    return { seller_rating: 0, seller_rating_count: 0 };
  }
};
