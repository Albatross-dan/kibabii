import { Listing, Draft } from '@/services/listingService';

export type { Listing, Draft };

export interface SubscriptionPlan {
  id: 'free' | 'bronze' | 'silver' | 'gold';
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
