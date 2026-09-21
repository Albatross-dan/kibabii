import { supabase } from '@/lib/supabase';

export interface ProductImageEmbed {
  id?: string;
  image_url: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductEmbed {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  quantity: number;
  status?: string;
  seller_id?: string;
  location?: string | null;
  product_images?: ProductImageEmbed[];
}

export interface CartItem {
  id: string; // cart_item uuid or local id
  user_id: string;
  product_id: string;
  productId: string; // alias for compatibility
  quantity: number;
  created_at: string;
  title: string;
  price: number;
  original_price?: number | null;
  image: string;
  sellerId?: string;
  inStock: boolean;
  availableQuantity: number;
  product?: ProductEmbed | null;
}

const LOCAL_CART_KEY = 'kibabiimart_local_cart';

/**
 * Retrieves persisted cart items from local storage.
 */
export function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse local cart storage:', err);
    return [];
  }
}

/**
 * Saves cart items to local storage.
 */
export function saveLocalCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist local cart:', err);
  }
}

/**
 * Extracts the primary or top display order image from product_images relation.
 */
export function extractProductCoverImage(product?: ProductEmbed | null, fallbackId = 'item'): string {
  if (!product || !product.product_images || product.product_images.length === 0) {
    return `https://picsum.photos/seed/${fallbackId}/400/400`;
  }

  // 1. Primary image match
  const primary = product.product_images.find((img) => img.is_primary);
  if (primary?.image_url) {
    return primary.image_url;
  }

  // 2. Lowest display_order fallback
  const sorted = [...product.product_images].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  if (sorted[0]?.image_url) {
    return sorted[0].image_url;
  }

  return `https://picsum.photos/seed/${fallbackId}/400/400`;
}

export const CART_SELECT_QUERY = `
  id,
  user_id,
  product_id,
  quantity,
  created_at,
  products (
    id,
    title,
    price,
    original_price,
    quantity,
    status,
    seller_id,
    location,
    product_images (
      image_url,
      is_primary,
      display_order
    )
  )
`;

/**
 * Fetch product details from Supabase products table (publicly accessible).
 */
async function fetchProductDetails(productId: string): Promise<ProductEmbed | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        original_price,
        quantity,
        status,
        seller_id,
        location,
        product_images (
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as unknown as ProductEmbed;
  } catch (err) {
    console.warn('Could not fetch product details for cart:', err);
    return null;
  }
}

export const cartService = {
  getLocalCart,
  saveLocalCart,

  /**
   * Fetch all cart items.
   * If an authenticated Supabase user session exists, retrieves from Supabase `cart_items`
   * and merges with local storage. Otherwise, loads from local storage.
   */
  async getCartItems(): Promise<CartItem[]> {
    const localItems = getLocalCart();

    let supabaseUser: any = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      supabaseUser = sessionData?.session?.user || null;
    } catch {
      supabaseUser = null;
    }

    if (!supabaseUser || !supabaseUser.id) {
      return localItems;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(CART_SELECT_QUERY)
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dbItems: CartItem[] = data.map((row: any) => {
          const prod: ProductEmbed | undefined = Array.isArray(row.products) ? row.products[0] : row.products;
          const title = prod?.title || 'Product';
          const price = Number(prod?.price || 0);
          const coverImage = extractProductCoverImage(prod, row.product_id);
          const availableQuantity = prod?.quantity ?? 1;
          const inStock = availableQuantity > 0;

          return {
            id: row.id,
            user_id: row.user_id,
            product_id: row.product_id,
            productId: row.product_id,
            quantity: row.quantity || 1,
            created_at: row.created_at,
            title,
            price,
            original_price: prod?.original_price,
            image: coverImage,
            sellerId: prod?.seller_id,
            inStock,
            availableQuantity,
            product: prod || null,
          };
        });

        // Merge any local items that haven't synced yet
        const merged = [...dbItems];
        for (const loc of localItems) {
          if (!merged.some((m) => m.product_id === loc.product_id || m.productId === loc.product_id)) {
            merged.push(loc);
          }
        }

        saveLocalCart(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase cart fetch fallback to local storage:', err);
    }

    return localItems;
  },

  /**
   * Add a product to the cart or increment quantity if already present.
   * Gracefully updates local storage and attempts Supabase sync if user is authenticated.
   * Never crashes with RLS (42501) errors.
   */
  async addToCart(productId: string, quantity = 1): Promise<{ success: boolean; item?: CartItem; error?: string }> {
    // 1. Fetch full product information (accessible anonymously)
    const product = await fetchProductDetails(productId);
    const coverImage = extractProductCoverImage(product, productId);
    const title = product?.title || 'Product';
    const price = Number(product?.price || 0);
    const original_price = product?.original_price;
    const sellerId = product?.seller_id;
    const availableQuantity = product?.quantity ?? 1;
    const inStock = availableQuantity > 0;

    // 2. Check if user is authenticated with a live Supabase session
    let supabaseUser: any = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      supabaseUser = sessionData?.session?.user || null;
    } catch {
      supabaseUser = null;
    }

    let dbCartItem: CartItem | null = null;

    // 3. If authenticated in Supabase, attempt to sync with Supabase cart_items table
    if (supabaseUser && supabaseUser.id) {
      try {
        const { data: existingRows } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', supabaseUser.id)
          .eq('product_id', productId);

        const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

        if (existing) {
          const newQuantity = (existing.quantity || 1) + quantity;
          const { data: updated, error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existing.id)
            .select(CART_SELECT_QUERY)
            .single();

          if (!updateError && updated) {
            const prod = Array.isArray(updated.products) ? updated.products[0] : updated.products;
            dbCartItem = {
              id: updated.id,
              user_id: updated.user_id,
              product_id: updated.product_id,
              productId: updated.product_id,
              quantity: updated.quantity,
              created_at: updated.created_at,
              title: prod?.title || title,
              price: Number(prod?.price || price),
              original_price: prod?.original_price ?? original_price,
              image: extractProductCoverImage(prod, updated.product_id),
              sellerId: prod?.seller_id ?? sellerId,
              inStock: (prod?.quantity ?? 1) > 0,
              availableQuantity: prod?.quantity ?? availableQuantity,
              product: prod || product,
            };
          }
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('cart_items')
            .insert({
              user_id: supabaseUser.id,
              product_id: productId,
              quantity: quantity,
            })
            .select(CART_SELECT_QUERY)
            .single();

          if (!insertError && inserted) {
            const prod = Array.isArray(inserted.products) ? inserted.products[0] : inserted.products;
            dbCartItem = {
              id: inserted.id,
              user_id: inserted.user_id,
              product_id: inserted.product_id,
              productId: inserted.product_id,
              quantity: inserted.quantity,
              created_at: inserted.created_at,
              title: prod?.title || title,
              price: Number(prod?.price || price),
              original_price: prod?.original_price ?? original_price,
              image: extractProductCoverImage(prod, inserted.product_id),
              sellerId: prod?.seller_id ?? sellerId,
              inStock: (prod?.quantity ?? 1) > 0,
              availableQuantity: prod?.quantity ?? availableQuantity,
              product: prod || product,
            };
          } else if (insertError) {
            console.warn('Supabase cart insert bypassed (RLS/policy):', insertError.message);
          }
        }
      } catch (dbErr: any) {
        console.warn('Supabase cart operation failed gracefully, using local cart:', dbErr?.message || dbErr);
      }
    }

    // 4. Always ensure item is in local storage (reliable client-side persistence)
    const localItems = getLocalCart();
    const existingIdx = localItems.findIndex(
      (item) => item.product_id === productId || item.productId === productId
    );

    let finalItem: CartItem;

    if (existingIdx >= 0) {
      localItems[existingIdx].quantity += quantity;
      if (dbCartItem) {
        localItems[existingIdx].id = dbCartItem.id;
      }
      finalItem = localItems[existingIdx];
    } else {
      finalItem = dbCartItem || {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: supabaseUser?.id || 'guest',
        product_id: productId,
        productId: productId,
        quantity: quantity,
        created_at: new Date().toISOString(),
        title,
        price,
        original_price,
        image: coverImage,
        sellerId,
        inStock,
        availableQuantity,
        product,
      };
      localItems.unshift(finalItem);
    }

    saveLocalCart(localItems);

    return {
      success: true,
      item: finalItem,
    };
  },

  /**
   * Update quantity of a cart item. If quantity <= 0, deletes the row.
   */
  async updateQuantity(cartItemIdOrProductId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      return this.removeFromCart(cartItemIdOrProductId);
    }

    const localItems = getLocalCart();
    const item = localItems.find(
      (i) => i.id === cartItemIdOrProductId || i.product_id === cartItemIdOrProductId || i.productId === cartItemIdOrProductId
    );

    if (item) {
      item.quantity = quantity;
      saveLocalCart(localItems);
    }

    // Attempt Supabase update if we have a real backend UUID and session
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user && item && !item.id.startsWith('cart-')) {
        await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', item.id);
      }
    } catch (err) {
      console.warn('Supabase quantity update error (handled locally):', err);
    }
  },

  /**
   * Remove a cart item by its row ID or product ID.
   */
  async removeFromCart(cartItemIdOrProductId: string): Promise<void> {
    const localItems = getLocalCart();
    const item = localItems.find(
      (i) => i.id === cartItemIdOrProductId || i.product_id === cartItemIdOrProductId || i.productId === cartItemIdOrProductId
    );

    const updatedLocal = localItems.filter(
      (i) => i.id !== cartItemIdOrProductId && i.product_id !== cartItemIdOrProductId && i.productId !== cartItemIdOrProductId
    );
    saveLocalCart(updatedLocal);

    // Attempt Supabase delete if we have a real backend UUID and session
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user && item && !item.id.startsWith('cart-')) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.id);
      }
    } catch (err) {
      console.warn('Supabase delete error (handled locally):', err);
    }
  },

  /**
   * Clear all cart items.
   */
  async clearCart(): Promise<void> {
    saveLocalCart([]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', sessionData.session.user.id);
      }
    } catch (err) {
      console.warn('Supabase clear cart error (handled locally):', err);
    }
  },
};

