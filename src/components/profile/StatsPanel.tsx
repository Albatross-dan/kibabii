import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Building, 
  ShoppingBag, 
  Heart, 
  Store, 
  MessageSquare, 
  Star, 
  Eye, 
  Users 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export interface DashboardMetrics {
  listingsPosted: number;
  productsSold: number;
  wishlistCount: number;
  followedStores: number;
  followers: number;
  storeViews: number;
  messages: number;
  reviewsReceived: number;
}

interface StatsPanelProps {
  profile: UserProfile;
  wishlistCount: number;
  metrics?: Partial<DashboardMetrics>;
}

export default function StatsPanel({ profile, wishlistCount, metrics }: StatsPanelProps) {
  const isStore = profile.account_type === 'store' || profile.role === 'store' || profile.role === 'shop_owner' || profile.is_store;

  const [liveStats, setLiveStats] = useState<DashboardMetrics>({
    listingsPosted: metrics?.listingsPosted ?? (profile.products_listed || 0),
    productsSold: metrics?.productsSold ?? (profile.products_sold || 0),
    wishlistCount: metrics?.wishlistCount ?? wishlistCount ?? 0,
    followedStores: metrics?.followedStores ?? 0,
    followers: metrics?.followers ?? (profile.followers || 0),
    storeViews: metrics?.storeViews ?? 0,
    messages: metrics?.messages ?? 0,
    reviewsReceived: metrics?.reviewsReceived ?? (profile.total_reviews || 0),
  });

  useEffect(() => {
    if (metrics) {
      setLiveStats(prev => ({
        ...prev,
        ...metrics,
        wishlistCount: metrics.wishlistCount ?? wishlistCount ?? prev.wishlistCount
      }));
    }
  }, [metrics, wishlistCount]);

  // Self-auditing live query across all listing types and real database tables
  useEffect(() => {
    let isMounted = true;
    const targetUserId = profile.id;
    if (!targetUserId) return;

    const fetchRealData = async () => {
      try {
        const [
          products,
          services,
          accommodations,
          events,
          lostFound,
          listingsRes,
          soldProducts,
          soldListings,
          reviewsRes,
          messagesRes,
          followedStoresRes,
          storeRes
        ] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', targetUserId),
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('provider_id', targetUserId),
          supabase.from('accommodations').select('id', { count: 'exact', head: true }).eq('owner_id', targetUserId),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', targetUserId),
          supabase.from('lost_found_items').select('id', { count: 'exact', head: true }).eq('posted_by', targetUserId),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', targetUserId),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', targetUserId).eq('status', 'sold'),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', targetUserId).eq('status', 'sold'),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('seller_id', targetUserId),
          supabase.from('conversation_participants').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
          supabase.from('store_followers').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
          supabase.from('stores').select('id').eq('owner_id', targetUserId).maybeSingle(),
        ]);

        const totalSubListings = [products, services, accommodations, events, lostFound]
          .reduce((sum, r) => sum + (r.count || 0), 0);
        const computedListings = Math.max(totalSubListings, listingsRes?.count || 0);
        const computedSold = Math.max(soldProducts?.count || 0, soldListings?.count || 0);
        const computedReviews = reviewsRes?.count || 0;
        const computedMessages = messagesRes?.count || 0;
        const computedFollowedStores = followedStoresRes?.count || 0;

        let computedFollowers = 0;
        const userStoreId = storeRes?.data?.id || profile.store_id;
        if (userStoreId) {
          const { count: fCount } = await supabase
            .from('store_followers')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', userStoreId);
          computedFollowers = fCount || 0;
        }

        if (isMounted) {
          setLiveStats(prev => ({
            ...prev,
            listingsPosted: computedListings,
            productsSold: computedSold,
            wishlistCount: wishlistCount,
            followedStores: computedFollowedStores,
            followers: computedFollowers || prev.followers,
            messages: computedMessages,
            reviewsReceived: computedReviews || prev.reviewsReceived,
          }));
        }
      } catch (err) {
        console.warn('Real stats audit notice:', err);
      }
    };

    fetchRealData();
    return () => { isMounted = false; };
  }, [profile.id, profile.store_id, wishlistCount]);

  const stats = isStore 
    ? [
        { label: 'Products Listed', value: liveStats.listingsPosted, icon: <Building className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-50' },
        { label: 'Products Sold', value: liveStats.productsSold, icon: <ShoppingBag className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
        { label: 'Followers', value: liveStats.followers, icon: <Users className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
        { label: 'Store Views', value: liveStats.storeViews, icon: <Eye className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
        { label: 'Messages', value: liveStats.messages, icon: <MessageSquare className="h-5 w-5 text-sky-600" />, bg: 'bg-sky-50' },
        { label: 'Reviews Received', value: liveStats.reviewsReceived, icon: <Star className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
      ]
    : [
        { label: 'Listings Posted', value: liveStats.listingsPosted, icon: <Building className="h-5 w-5 text-indigo-600" />, bg: 'bg-indigo-50' },
        { label: 'Products Sold', value: liveStats.productsSold, icon: <ShoppingBag className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
        { label: 'Wishlist Items', value: liveStats.wishlistCount, icon: <Heart className="h-5 w-5 text-red-600" />, bg: 'bg-red-50' },
        { label: 'Followed Stores', value: liveStats.followedStores, icon: <Store className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
        { label: 'Messages', value: liveStats.messages, icon: <MessageSquare className="h-5 w-5 text-sky-600" />, bg: 'bg-sky-50' },
        { label: 'Reviews Received', value: liveStats.reviewsReceived, icon: <Star className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
      ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border border-slate-100 hover:border-slate-200 transition-all shadow-sm overflow-hidden hover:shadow-md group">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
            <div className={`h-10 w-10 ${stat.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-xl text-slate-900 block tracking-tight">
                {stat.value}
              </span>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                {stat.label}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
