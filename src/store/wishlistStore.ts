import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface WishlistListingRow {
  listing_id: string;
  listing_type: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
  views_count: number;
  favorites_count: number;
  published_at: string;
  wishlisted_at: string;
}

interface WishlistStore {
  // Array of favorited listings.id UUIDs for fast lookup in cards
  items: string[];
  wishlistRows: WishlistListingRow[];
  isLoading: boolean;
  initialized: boolean;

  // Actions
  fetchWishlist: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  toggleWishlist: (listingId: string) => Promise<boolean>;
  hasItem: (listingId: string) => boolean;
  isFavorited: (listingId: string) => boolean;
  clearLocalWishlist: () => void;
}

/**
 * Resolves an ID to its guaranteed listings.id UUID.
 * Prevents accidentally passing a product_id or accommodation_id to toggle_listing_favorite.
 */
async function resolveToListingId(id: string): Promise<string> {
  if (!id) return id;
  try {
    // 1. Check if the ID is already a listing ID
    const { data: directListing } = await supabase
      .from('listings')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (directListing?.id) {
      return directListing.id;
    }

    // 2. Check if the ID is a product_id or accommodation_id
    const { data: linkedListing } = await supabase
      .from('listings')
      .select('id')
      .or(`product_id.eq.${id},accommodation_id.eq.${id}`)
      .maybeSingle();

    if (linkedListing?.id) {
      return linkedListing.id;
    }
  } catch (err) {
    console.warn('Could not resolve candidate listing ID:', id, err);
  }
  return id;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlistRows: [],
      isLoading: false,
      initialized: false,

      fetchWishlist: async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const currentUser = sessionData?.session?.user;

          // If unauthenticated, keep local cached items without throwing
          if (!currentUser) {
            set({ isLoading: false, initialized: true });
            return;
          }

          set({ isLoading: true });
          const { data, error } = await supabase.rpc('get_user_wishlist');

          if (error) {
            console.warn('get_user_wishlist RPC notice:', error);
            set({ isLoading: false, initialized: true });
            return;
          }

          const rows = (data || []) as WishlistListingRow[];
          const ids = rows.map((r) => r.listing_id);

          set({
            items: ids,
            wishlistRows: rows,
            isLoading: false,
            initialized: true,
          });
        } catch (err) {
          console.warn('Failed to load user wishlist:', err);
          set({ isLoading: false, initialized: true });
        }
      },

      toggleFavorite: async (candidateId: string): Promise<boolean> => {
        if (!candidateId) return false;

        // Guarantee we are using the listings.id per the backend contract
        const listingId = await resolveToListingId(candidateId);
        if (!listingId) return false;

        // Check if there is an active Supabase session (with JWT)
        let session = (await supabase.auth.getSession()).data?.session;
        if (!session?.user) {
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            session = refreshData?.session || null;
          } catch {
            session = null;
          }
        }

        const prevItems = [...get().items];
        const isCurrentlyFavorited = prevItems.includes(listingId);
        const willBeFavorited = !isCurrentlyFavorited;

        // If the user does not have a real Supabase session, handle locally without triggering DB 23502
        if (!session?.user) {
          const nextItems = willBeFavorited
            ? [...prevItems, listingId]
            : prevItems.filter((id) => id !== listingId);

          set({ items: nextItems });

          if (willBeFavorited) {
            toast.success('Saved to local favorites! Sign in to sync across devices.', {
              action: {
                label: 'Sign In',
                onClick: () => {
                  window.location.href = '/auth/login';
                },
              },
            });
          } else {
            toast.info('Removed from favorites');
          }

          return willBeFavorited;
        }

        // Real Supabase session is present: perform optimistic UI + call RPC
        const prevRows = [...get().wishlistRows];
        const nextItems = willBeFavorited
          ? [...prevItems, listingId]
          : prevItems.filter((id) => id !== listingId);

        const nextRows = willBeFavorited
          ? prevRows
          : prevRows.filter((row) => row.listing_id !== listingId);

        set({ items: nextItems, wishlistRows: nextRows });

        try {
          const { data, error } = await supabase.rpc('toggle_listing_favorite', {
            p_listing_id: listingId,
          });

          if (error) {
            console.error('toggle_listing_favorite error:', error);
            // REVERT optimistic state on error
            set({ items: prevItems, wishlistRows: prevRows });

            if (error.code === '23502' || error.message?.includes('user_id')) {
              toast.error('Please sign in to save items to your account.', {
                action: {
                  label: 'Sign In',
                  onClick: () => {
                    window.location.href = '/auth/login';
                  },
                },
              });
            } else {
              toast.error('Could not update favorites. Please try again.');
            }
            return isCurrentlyFavorited;
          }

          const serverIsFavorited = Boolean(data);

          // Reconcile with server response
          const confirmedItems = serverIsFavorited
            ? (get().items.includes(listingId) ? get().items : [...get().items, listingId])
            : get().items.filter((id) => id !== listingId);

          set({ items: confirmedItems });

          if (serverIsFavorited) {
            toast.success('Saved to Wishlist');
            get().fetchWishlist();
          } else {
            toast.info('Removed from Wishlist');
          }

          return serverIsFavorited;
        } catch (err: any) {
          console.error('toggleFavorite exception:', err);
          // REVERT optimistic state on error
          set({ items: prevItems, wishlistRows: prevRows });
          toast.error('Failed to update favorite. Please check connection.');
          return isCurrentlyFavorited;
        }
      },

      // Backward compatible alias
      toggleWishlist: async (id: string) => {
        return get().toggleFavorite(id);
      },

      hasItem: (id: string) => {
        if (!id) return false;
        return get().items.includes(id);
      },

      isFavorited: (id: string) => {
        if (!id) return false;
        return get().items.includes(id);
      },

      clearLocalWishlist: () => {
        set({ items: [], wishlistRows: [] });
      },
    }),
    {
      name: 'kibabuimart-wishlist-v2',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
