import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://xolfhrzpgggtoeyycoeu.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvbGZocnpwZ2dndG9leXljb2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mzk1NTAsImV4cCI6MjA5MzIxNTU1MH0.zp4dCisW2y_9Uk3-Q8p7lZCnCB2222gaKzplFZCyw2A';

const dualStorage = {
  getItem: (key: string): string | null => {
    try {
      return (
        window.localStorage.getItem(key) ||
        window.sessionStorage.getItem(key)
      );
    } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {}
  },
};

let authLockQueue = Promise.resolve();
const inMemoryLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  const next = authLockQueue.then(() => fn());
  authLockQueue = next.catch(() => {});
  return next;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'kibabiimart-auth',
    storage: dualStorage,
    lock: inMemoryLock,
  },
});

// Global state for login modal
let loginModalResolver: ((value: User | null) => void) | null = null;

export const showLoginModal = (resolve: (value: User | null) => void) => {
  loginModalResolver = resolve;
  // Trigger the modal to open (set a global state)
  window.dispatchEvent(new CustomEvent('kibabii-require-login'));
};

export const resolveLoginModal = (user: User | null) => {
  if (loginModalResolver) {
    loginModalResolver(user);
    loginModalResolver = null;
  }
};

export const requireAuth = async (): Promise<User | null> => {
  try {
    // 1. Try getting existing session
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) return data.session.user;

    // 2. Try refreshing
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session?.user) return refreshed.session.user;
  } catch (err) {
    console.warn('Session check encountered network error (falling back to local):', err);
  }

  // Fallback to active local storage session if authenticated
  try {
    const activeSessionId = localStorage.getItem('kibabui_active_session_id');
    if (activeSessionId) {
      const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
      const current = accounts.find((a: any) => a.id === activeSessionId || a.email === activeSessionId);
      if (current) {
        return {
          id: current.id,
          email: current.email,
          user_metadata: { full_name: current.full_name }
        } as unknown as User;
      }
    }
  } catch {}

  // 3. Session truly gone — show login modal and wait
  return new Promise<User | null>((resolve) => {
    showLoginModal(resolve);
  });
};

