import { create } from 'zustand';
import { cartService, CartItem } from '@/services/cartService';

export type { CartItem };

interface CartStore {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<CartItem[]>;
  addItem: (
    productIdOrItem: string | { productId?: string; id?: string; quantity?: number },
    quantity?: number
  ) => Promise<void>;
  removeItem: (cartItemIdOrProductId: string) => Promise<void>;
  updateQuantity: (cartItemIdOrProductId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: cartService.getLocalCart(),
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const items = await cartService.getCartItems();
      set({ items, loading: false });
      return items;
    } catch (err: any) {
      console.warn('Cart fetch error handled:', err);
      const fallback = cartService.getLocalCart();
      set({ items: fallback, loading: false });
      return fallback;
    }
  },

  addItem: async (productIdOrItem, qty = 1) => {
    let resolvedProductId: string;
    let resolvedQuantity: number = qty;

    if (typeof productIdOrItem === 'string') {
      resolvedProductId = productIdOrItem;
    } else {
      resolvedProductId = (productIdOrItem.productId || productIdOrItem.id) as string;
      if (productIdOrItem.quantity !== undefined) {
        resolvedQuantity = productIdOrItem.quantity;
      }
    }

    if (!resolvedProductId) {
      throw new Error('Invalid product ID provided for cart');
    }

    // Call add-to-cart (handles Supabase sync when available and stores locally)
    await cartService.addToCart(resolvedProductId, resolvedQuantity);

    // Refresh cart items
    const updatedItems = await cartService.getCartItems();
    set({ items: updatedItems });
  },

  removeItem: async (cartItemIdOrProductId: string) => {
    const item = get().items.find(
      (i) => i.id === cartItemIdOrProductId || i.productId === cartItemIdOrProductId
    );
    const targetId = item ? item.id : cartItemIdOrProductId;

    await cartService.removeFromCart(targetId);

    const updatedItems = await cartService.getCartItems();
    set({ items: updatedItems });
  },

  updateQuantity: async (cartItemIdOrProductId: string, quantity: number) => {
    const item = get().items.find(
      (i) => i.id === cartItemIdOrProductId || i.productId === cartItemIdOrProductId
    );
    const targetId = item ? item.id : cartItemIdOrProductId;

    await cartService.updateQuantity(targetId, quantity);

    const updatedItems = await cartService.getCartItems();
    set({ items: updatedItems });
  },

  clearCart: async () => {
    try {
      await cartService.clearCart();
    } catch (err) {
      console.warn('Error clearing cart in backend:', err);
    }
    set({ items: [] });
  },

  get total() {
    return get().items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  },
}));
