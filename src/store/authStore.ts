import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { isValidUuid, toValidUuid } from '@/lib/uuid';

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string; // WhatsApp number
  whatsapp_number?: string;
  role: 'student' | 'store' | 'admin' | 'both' | 'shop_owner';
  account_type?: 'student' | 'store' | 'admin' | 'both' | 'shop_owner';
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  can_buy?: boolean;
  can_sell?: boolean;
  is_store?: boolean;
  avatar_url?: string;
  campus?: string;
  hostel_area?: string;
  student_reg_number?: string;
  email_verified: boolean;
  student_verification_status: 'unverified' | 'pending' | 'approved' | 'rejected';
  store_verification_status: 'unverified' | 'pending' | 'approved' | 'rejected';
  student_verification_details?: {
    method: 'email' | 'id_upload' | 'reg_submit';
    university_email?: string;
    id_card_url?: string;
    registration_number?: string;
  };
  store_verification_details?: {
    banner_url?: string;
    store_photos?: string[];
    business_info?: string;
    supporting_doc_url?: string;
  };
  is_top_seller?: boolean;
  seller_rating?: number;
  total_reviews?: number;
  join_date?: string;
  wishlist_count?: number;
  products_listed?: number;
  products_sold?: number;
  
  // Store details if store account
  store_id?: string;
  store_name?: string;
  business_category?: string;
  store_location?: string;
  store_description?: string;
  store_banner_image?: string;
  followers?: number;
}

interface AuthStore {
  user: any | null; // Supports mock user objects or Supabase User
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  sentOtp: string | null;
  accounts: UserProfile[]; // Local mock persistence of all registers
  initAuth: () => Promise<void>;
  setUser: (user: any | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setSentOtp: (otp: string | null) => void;
  
  // Custom operational mock-sync actions
  registerStudent: (data: Partial<UserProfile>) => Promise<UserProfile>;
  registerStore: (data: Partial<UserProfile>) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logoutUser: () => Promise<void>;
  verifyOtpCode: (code: string) => Promise<boolean>;
  submitStudentVerification: (details: UserProfile['student_verification_details']) => Promise<void>;
  submitStoreVerification: (details: UserProfile['store_verification_details']) => Promise<void>;
  
  // Admin-simulated overrides for live presentation
  adminApproveStudent: (userId: string) => void;
  adminRejectStudent: (userId: string) => void;
  adminApproveStore: (userId: string) => void;
  adminRejectStore: (userId: string) => void;
  adminToggleTopSeller: (userId: string) => void;
}

// Initial mockup accounts
const INITIAL_ACCOUNTS: UserProfile[] = [];

const loadAccounts = (): UserProfile[] => {
  const local = localStorage.getItem('kibabui_marketplace_accounts');
  let accountsList = INITIAL_ACCOUNTS;
  if (local) {
    try {
      accountsList = JSON.parse(local);
    } catch {
      accountsList = INITIAL_ACCOUNTS;
    }
  }

  // Ensure specified admin accounts always exist and have admin roles
  const requiredAdmins = [
    { id: 'fa19960e-df14-4b84-8034-c61a0fc55a05', email: 'danieloguda11221@gmail.com', name: 'Daniel Oguda' },
    { id: '0a58a7e3-e615-45b5-bad4-b366e1e518dd', email: 'ogudadaniel11221@gmail.com', name: 'Daniel Oguda (Alt)' }
  ];

  let modified = false;
  requiredAdmins.forEach(admin => {
    const existingIdx = accountsList.findIndex(acc => 
      acc.email?.toLowerCase() === admin.email.toLowerCase() ||
      acc.id === admin.id ||
      (admin.email.startsWith('daniel') && acc.id === 'admin-daniel') ||
      (admin.email.startsWith('oguda') && acc.id === 'admin-daniel-alt')
    );
    if (existingIdx === -1) {
      accountsList.push({
        id: admin.id,
        full_name: admin.name,
        username: admin.email.split('@')[0],
        email: admin.email,
        phone: '0711221122',
        role: 'admin',
        can_buy: true,
        can_sell: true,
        is_store: false,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name}`,
        email_verified: true,
        student_verification_status: 'approved',
        store_verification_status: 'unverified',
        join_date: 'Jun 2026'
      });
      modified = true;
    } else {
      if (accountsList[existingIdx].id !== admin.id) {
        accountsList[existingIdx].id = admin.id;
        modified = true;
      }
      if (accountsList[existingIdx].role !== 'admin') {
        accountsList[existingIdx].role = 'admin';
        modified = true;
      }
    }
  });

  // Ensure all accounts have valid RFC4122 UUIDs for database and Postgres compatibility
  accountsList.forEach(acc => {
    if (!isValidUuid(acc.id)) {
      const oldId = acc.id;
      const validId = toValidUuid(oldId);
      acc.id = validId;
      modified = true;
      try {
        const activeSessionId = localStorage.getItem('kibabui_active_session_id');
        if (activeSessionId === oldId) {
          localStorage.setItem('kibabui_active_session_id', validId);
        }
        // Update user listings if any were keyed to the old non-UUID id
        const listStr = localStorage.getItem('kibabui_user_listings');
        if (listStr) {
          const list = JSON.parse(listStr);
          let listMod = false;
          list.forEach((item: any) => {
            if (item.owner_id === oldId) {
              item.owner_id = validId;
              listMod = true;
            }
          });
          if (listMod) {
            localStorage.setItem('kibabui_user_listings', JSON.stringify(list));
          }
        }
      } catch {}
    }
  });

  if (modified || !local) {
    try {
      localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accountsList));
    } catch (err) {
      console.warn('Failed to save accounts to localStorage (Quota exceeded):', err);
    }
  }
  return accountsList;
};

const saveAccountsToLocal = (accounts: UserProfile[]) => {
  try {
    localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save accounts list to localStorage (Quota exceeded):', err);
  }
};

let authInitialized = false;

export const useAuthStore = create<AuthStore>((set, get) => {
  const initialAccounts = loadAccounts();
  
  // Setup simulated active session check
  let initialUser = null;
  let initialProfile = null;
  let initialIsAdmin = false;
  
  const activeSessionId = localStorage.getItem('kibabui_active_session_id');
  if (activeSessionId) {
    const matchedAccount = initialAccounts.find(acc => 
      acc.id === activeSessionId ||
      (activeSessionId === 'admin-daniel' && acc.email?.toLowerCase().includes('daniel')) ||
      (activeSessionId === 'admin-daniel-alt' && acc.email?.toLowerCase().includes('oguda'))
    );
    if (matchedAccount) {
      if (activeSessionId !== matchedAccount.id) {
        try {
          localStorage.setItem('kibabui_active_session_id', matchedAccount.id);
        } catch {}
      }
      initialUser = { 
        id: matchedAccount.id, 
        email: matchedAccount.email, 
        user_metadata: { full_name: matchedAccount.full_name } 
      };
      initialProfile = matchedAccount;
      if (matchedAccount.role === 'admin') {
        initialIsAdmin = true;
      }
    }
  }

  return {
    user: initialUser,
    profile: initialProfile,
    isLoading: false,
    isAdmin: initialIsAdmin,
    sentOtp: null,
    accounts: initialAccounts,
    
    initAuth: async () => {
      if (authInitialized) return;
      authInitialized = true;

      const checkAdminStatus = async (userId: string) => {
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

          const hasAdmin = !!roleData;
          if (get().isAdmin !== hasAdmin) {
            set({ isAdmin: hasAdmin });
          }
        } catch {
          // Keep current status if error
        }
      };

      const fetchProfile = async (userId: string) => {
        try {
          let { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (!data) {
            const { data: pubData } = await supabase
              .from('public_profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
            if (pubData) {
              data = pubData;
            }
          }

          let finalProfile = data || (get().profile?.id === userId ? get().profile : null);

          // Check if this user owns a store in the Supabase 'stores' table
          try {
            const { data: storeData, error: storeErr } = await supabase
              .from('stores')
              .select('*')
              .eq('owner_id', userId)
              .maybeSingle();

            if (storeData && !storeErr) {
              finalProfile = {
                ...(finalProfile || {}),
                id: userId,
                store_id: storeData.id,
                role: 'shop_owner',
                account_type: 'store',
                is_store: true,
                store_name: storeData.name || storeData.store_name,
                business_category: storeData.category || (finalProfile as any)?.business_category,
                store_location: storeData.location || (finalProfile as any)?.store_location,
                store_description: storeData.description || (finalProfile as any)?.store_description,
                store_verification_status: storeData.verification_status || 'approved'
              };

              // Reconcile and backfill store attribution for products created under this user that missed store_id
              try {
                supabase
                  .from('products')
                  .update({
                    store_id: storeData.id,
                    seller_type: 'store'
                  })
                  .eq('seller_id', userId)
                  .is('store_id', null)
                  .then(({ data, error }) => {
                    if (error) console.warn('Product store reconciliation notice:', error);
                  });
              } catch (reconcileErr) {
                console.warn('Store product reconciliation note:', reconcileErr);
              }
            }
          } catch (storeCheckErr) {
            console.warn('Store ownership check error:', storeCheckErr);
          }

          if (finalProfile && (finalProfile.id !== get().profile?.id || finalProfile.role !== get().profile?.role)) {
            set({ profile: finalProfile });
            // Keep local accounts in sync
            const currentAccounts = get().accounts;
            const updatedAccounts = currentAccounts.map(acc => acc.id === finalProfile.id ? { ...acc, ...finalProfile } : acc);
            set({ accounts: updatedAccounts });
          }
        } catch (err) {
          console.warn('Profile fetch handled:', err);
        }
      };

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (get().user?.id !== session.user.id) {
            set({ user: session.user });
          }
          fetchProfile(session.user.id);
          checkAdminStatus(session.user.id);
        }
      } catch (err) {
        console.warn('Session check handled:', err);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          if (get().user?.id !== session.user.id) {
            set({ user: session.user });
          }
          fetchProfile(session.user.id);
          checkAdminStatus(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          const activeSessionId = localStorage.getItem('kibabui_active_session_id');
          if (!activeSessionId && (get().user !== null || get().profile !== null)) {
            set({ user: null, profile: null, isAdmin: false });
          }
        }
      });
    },

    setUser: (user) => set({ user }),
    setProfile: (profile) => {
      set({ profile });
      if (profile) {
        // Sync active profile directly back into accounts array
        const updatedAccounts = get().accounts.map(acc => acc.id === profile.id ? profile : acc);
        set({ accounts: updatedAccounts });
        saveAccountsToLocal(updatedAccounts);
      }
    },
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setSentOtp: (otp) => set({ sentOtp: otp }),
    
    registerStudent: async (data) => {
      const formEmail = (data.email || '').trim().toLowerCase();
      const formPassword = (data as any).password || '';
      const fullName = (data.full_name || '').trim();
      const username = (data.username || (formEmail ? formEmail.split('@')[0] : 'comrade')).trim();

      if (!formEmail) {
        throw new Error('Email address is required.');
      }
      if (!formPassword) {
        throw new Error('Password is required.');
      }

      // Step 1: Real Supabase signUp with the real password typed by the user
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: {
            full_name: fullName,
            username: username,
            account_type: 'student'
          }
        }
      });

      if (error) {
        // Show error.message, stop here, do NOT show a success screen or invent fake accounts
        console.error('Supabase student signUp error:', error);
        throw error;
      }

      const authUser = signUpData?.user;
      if (!authUser) {
        throw new Error('Registration could not be completed. Please try again.');
      }

      const newStudent: UserProfile = {
        id: authUser.id,
        full_name: fullName,
        username: username,
        email: formEmail,
        phone: data.phone || '',
        role: 'student',
        account_type: 'student',
        can_buy: true,
        can_sell: true,
        is_store: false,
        avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
        campus: data.campus || 'Kibabii University',
        hostel_area: data.hostel_area || '',
        student_reg_number: data.student_reg_number || '',
        email_verified: Boolean(authUser.email_confirmed_at),
        student_verification_status: 'unverified',
        store_verification_status: 'unverified',
        is_top_seller: false,
        seller_rating: 0,
        total_reviews: 0,
        wishlist_count: 0,
        products_listed: 0,
        products_sold: 0,
        join_date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      // Step 2: Attempt profile synchronization with Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          full_name: fullName,
          username: username,
          email: formEmail,
          phone: data.phone || '',
          avatar_url: newStudent.avatar_url,
          role: 'buyer',
          account_type: 'student'
        });
      } catch (profErr) {
        console.warn('Profile synchronization notice:', profErr);
      }

      set({ user: authUser, profile: newStudent });
      return newStudent;
    },
    
    registerStore: async (data) => {
      const formEmail = (data.email || '').trim().toLowerCase();
      const formPassword = (data as any).password || '';
      const fullName = (data.full_name || '').trim();
      const storeName = (data.store_name || fullName || 'Campus Store').trim();
      const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
      const username = (data.username || slugify(storeName) || (formEmail ? formEmail.split('@')[0] : 'store')).trim();

      if (!formEmail) {
        throw new Error('Business email is required.');
      }
      if (!formPassword) {
        throw new Error('Password is required.');
      }
      if (!storeName) {
        throw new Error('Store name is required.');
      }

      // Step 1: Real Supabase signUp with the real password typed by the user
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: {
            full_name: fullName,
            username: username,
            account_type: 'store'
          }
        }
      });

      if (error) {
        // Show error.message, stop here, do NOT show a success screen or invent fake accounts
        console.error('Supabase store signUp error:', error);
        throw error;
      }

      const authUser = signUpData?.user;
      if (!authUser) {
        throw new Error('Store registration could not be completed. Please try again.');
      }

      // Step 2: Real Supabase stores table insertion using the real authUser.id
      const slug = `${slugify(storeName)}-${Math.random().toString(36).slice(2, 8)}`;
      const businessCategory = data.business_category || null;
      const storeLocation = data.store_location || null;
      const storeDescription = data.store_description || null;
      const bannerImageUrl = data.store_banner_image || null;

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: authUser.id,
          name: storeName,
          store_name: storeName,
          slug: slug,
          category: businessCategory,
          location: storeLocation,
          description: storeDescription,
          banner_url: bannerImageUrl,
        })
        .select()
        .single();

      if (storeError) {
        console.error('Store creation failed:', storeError);
        throw new Error(storeError.message || 'Store creation failed.');
      }

      const realStoreRow = store;

      // Step 3: Upsert profile in Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          full_name: fullName,
          username: username,
          email: formEmail,
          phone: data.phone || '',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeName)}`,
          role: 'seller',
          account_type: 'store'
        });
      } catch (profErr) {
        console.warn('Profile role sync notice:', profErr);
      }

      const newStore: UserProfile = {
        id: authUser.id,
        full_name: fullName,
        username: username,
        email: formEmail,
        phone: data.phone || '',
        role: 'shop_owner',
        account_type: 'store',
        can_buy: true,
        can_sell: true,
        is_store: true,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeName)}`,
        email_verified: Boolean(authUser.email_confirmed_at),
        student_verification_status: 'unverified',
        store_verification_status: realStoreRow?.is_verified ? 'approved' : 'unverified',
        store_name: realStoreRow?.name || storeName,
        business_category: realStoreRow?.category || data.business_category || 'General Store',
        store_location: realStoreRow?.location || data.store_location || 'Campus',
        store_description: realStoreRow?.description || data.store_description || '',
        store_banner_image: data.store_banner_image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
        followers: 0,
        is_top_seller: false,
        seller_rating: 0,
        total_reviews: 0,
        products_listed: 0,
        products_sold: 0,
        join_date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      set({ user: authUser, profile: newStore });
      return newStore;
    },
    
    login: async (email, password) => {
      let supabaseUser: any = null;
      let profileFromDb: any = null;

      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        // Enforce strict authentication: never silently fallback to local mock login
        console.error('Supabase signInWithPassword error:', error);
        throw error;
      }

      if (!data?.user) {
        throw new Error('Login failed. No active session returned.');
      }

      supabaseUser = data.user;

      try {
        // Try to fetch profile from profiles table, fallback to public_profiles
        let { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (!profileData) {
          const { data: publicProfileData } = await supabase
            .from('public_profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .maybeSingle();
          if (publicProfileData) {
            profileData = publicProfileData;
          }
        }

        if (profileData) {
          profileFromDb = profileData;
        }

        // Check if user owns a store in Supabase stores table
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', supabaseUser.id)
          .maybeSingle();

        if (storeData) {
          profileFromDb = {
            ...(profileFromDb || {}),
            id: supabaseUser.id,
            role: 'shop_owner',
            account_type: 'store',
            is_store: true,
            store_name: storeData.name || storeData.store_name,
            business_category: storeData.category || profileFromDb?.business_category,
            store_location: storeData.location || profileFromDb?.store_location,
            store_description: storeData.description || profileFromDb?.store_description,
            store_verification_status: storeData.verification_status || (storeData.is_verified ? 'approved' : 'unverified')
          };
        }
      } catch (err) {
        console.warn('Could not fetch profile from live database:', err);
      }

      const finalProfile: UserProfile = {
        id: supabaseUser.id,
        full_name: profileFromDb?.full_name || supabaseUser.user_metadata?.full_name || trimmedEmail.split('@')[0],
        username: profileFromDb?.username || supabaseUser.user_metadata?.username || trimmedEmail.split('@')[0],
        email: trimmedEmail,
        phone: profileFromDb?.phone || supabaseUser.user_metadata?.phone || '',
        role: profileFromDb?.role || supabaseUser.user_metadata?.role || (trimmedEmail === 'danieloguda11221@gmail.com' || trimmedEmail === 'ogudadaniel11221@gmail.com' ? 'admin' : 'student'),
        account_type: profileFromDb?.account_type || (profileFromDb?.is_store ? 'store' : 'student'),
        can_buy: true,
        can_sell: true,
        is_store: Boolean(profileFromDb?.is_store || profileFromDb?.store_name),
        avatar_url: profileFromDb?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
        campus: profileFromDb?.campus || 'Kibabii University',
        hostel_area: profileFromDb?.hostel_area || '',
        student_reg_number: profileFromDb?.student_reg_number || '',
        email_verified: Boolean(supabaseUser.email_confirmed_at),
        student_verification_status: profileFromDb?.student_verification_status || 'unverified',
        store_verification_status: profileFromDb?.store_verification_status || (profileFromDb?.is_store ? 'approved' : 'unverified'),
        store_name: profileFromDb?.store_name,
        business_category: profileFromDb?.business_category,
        store_location: profileFromDb?.store_location,
        store_description: profileFromDb?.store_description,
        is_top_seller: Boolean(profileFromDb?.is_top_seller),
        seller_rating: profileFromDb?.rating || profileFromDb?.seller_rating || 0,
        total_reviews: profileFromDb?.total_reviews || 0,
        join_date: profileFromDb?.created_at ? new Date(profileFromDb.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      set({ user: supabaseUser, profile: finalProfile });
      return finalProfile;
    },
    
    logoutUser: async () => {
      set({ user: null, profile: null, sentOtp: null });
      localStorage.removeItem('kibabui_active_session_id');
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch {
        // Safe check
      }
    },
    
    verifyOtpCode: async (code) => {
      // In real Supabase, email confirmation is link-based (or 6-digit OTP if email OTP enabled)
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email_confirmed_at) {
          const profile = get().profile;
          if (profile) {
            set({ profile: { ...profile, email_verified: true } });
          }
          return true;
        }

        // Try verifying as Supabase OTP token if typed
        if (code && code.trim().length >= 6) {
          const email = get().profile?.email || currentUser?.email;
          if (email) {
            const { data, error } = await supabase.auth.verifyOtp({
              email,
              token: code.trim(),
              type: 'signup'
            });
            if (!error && data.user) {
              const profile = get().profile;
              if (profile) {
                set({ profile: { ...profile, email_verified: true } });
              }
              return true;
            }
          }
        }
      } catch (e) {
        console.warn('Verify OTP error:', e);
      }
      return false;
    },
    
    submitStudentVerification: async (details) => {
      const { profile } = get();
      if (!profile) throw new Error('You must be logged in to verify student.');
      
      const updatedProfile: UserProfile = {
        ...profile,
        student_verification_status: 'pending',
        student_verification_details: details
      };
      
      set({ profile: updatedProfile });
      const updatedAccounts = get().accounts.map(acc => acc.id === profile.id ? updatedProfile : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
    },
    
    submitStoreVerification: async (details) => {
      const { profile } = get();
      if (!profile) throw new Error('You must be logged in to verify store.');
      
      const updatedProfile: UserProfile = {
        ...profile,
        store_verification_status: 'pending',
        store_verification_details: details
      };
      
      set({ profile: updatedProfile });
      const updatedAccounts = get().accounts.map(acc => acc.id === profile.id ? updatedProfile : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
    },
    
    adminApproveStudent: (userId) => {
      const { accounts, profile } = get();
      const targetUser = accounts.find(acc => acc.id === userId);
      if (!targetUser) return;
      
      const updatedAccount: UserProfile = {
        ...targetUser,
        student_verification_status: 'approved'
      };
      
      const updatedAccounts = accounts.map(acc => acc.id === userId ? updatedAccount : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
      
      // Sync active profile if logged in as approved student
      if (profile && profile.id === userId) {
        set({ profile: updatedAccount });
      }
    },
    
    adminRejectStudent: (userId) => {
      const { accounts, profile } = get();
      const targetUser = accounts.find(acc => acc.id === userId);
      if (!targetUser) return;
      
      const updatedAccount: UserProfile = {
        ...targetUser,
        student_verification_status: 'rejected'
      };
      
      const updatedAccounts = accounts.map(acc => acc.id === userId ? updatedAccount : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
      
      if (profile && profile.id === userId) {
        set({ profile: updatedAccount });
      }
    },
    
    adminApproveStore: (userId) => {
      const { accounts, profile } = get();
      const targetUser = accounts.find(acc => acc.id === userId);
      if (!targetUser) return;
      
      const updatedAccount: UserProfile = {
        ...targetUser,
        store_verification_status: 'approved'
      };
      
      const updatedAccounts = accounts.map(acc => acc.id === userId ? updatedAccount : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
      
      // Sync active profile if logged in as approved store
      if (profile && profile.id === userId) {
        set({ profile: updatedAccount });
      }
    },
    
    adminRejectStore: (userId) => {
      const { accounts, profile } = get();
      const targetUser = accounts.find(acc => acc.id === userId);
      if (!targetUser) return;
      
      const updatedAccount: UserProfile = {
        ...targetUser,
        store_verification_status: 'rejected'
      };
      
      const updatedAccounts = accounts.map(acc => acc.id === userId ? updatedAccount : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
      
      if (profile && profile.id === userId) {
        set({ profile: updatedAccount });
      }
    },
    
    adminToggleTopSeller: (userId) => {
      const { accounts, profile } = get();
      const targetUser = accounts.find(acc => acc.id === userId);
      if (!targetUser) return;
      
      const updatedAccount: UserProfile = {
        ...targetUser,
        is_top_seller: !targetUser.is_top_seller
      };
      
      const updatedAccounts = accounts.map(acc => acc.id === userId ? updatedAccount : acc);
      set({ accounts: updatedAccounts });
      saveAccountsToLocal(updatedAccounts);
      
      if (profile && profile.id === userId) {
        set({ profile: updatedAccount });
      }
    }
  };
});
