import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const setIsAdmin = useAuthStore((state) => state.setIsAdmin);

  return {
    user,
    profile,
    isLoading,
    isAdmin,
    setUser,
    setProfile,
    setIsLoading,
    setIsAdmin,
  };
}
