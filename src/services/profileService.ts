import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export const profileService = {
  async getProfile(id: string): Promise<Profile | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      // Your own profile: owner can read full row from profiles table
      if (currentUserId && currentUserId === id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as Profile;
        }
      } else {
        // Anyone else's profile: use public_profiles view
        const { data, error } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as unknown as Profile;
        }
      }
    } catch (err) {
      console.warn(`getProfile for ID ${id} failed:`, err);
    }

    try {
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      const found = accounts.find((a: any) => a.id === id || a.email === id);
      if (found) {
        return found as Profile;
      }
    } catch {}

    return null;
  },

  async updateProfile(id: string, updates: Database['public']['Tables']['profiles']['Update']) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn(`updateProfile for ID ${id} failed:`, err);
    }

    try {
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      const index = accounts.findIndex((a: any) => a.id === id || a.email === id);
      if (index !== -1) {
        accounts[index] = { ...accounts[index], ...updates };
        localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accounts));
        return accounts[index];
      }
    } catch {}

    return updates;
  },

  async getTopSellers(limit = 5): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .order('seller_rating', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as unknown as Profile[];
      }
    } catch (err) {
      console.warn('getTopSellers failed:', err);
    }

    try {
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      return accounts.filter((a: any) => a.role === 'store' || a.is_store || a.role === 'seller').slice(0, limit) as Profile[];
    } catch {
      return [];
    }
  }
};

