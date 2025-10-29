// hooks/useCurrentUser.ts
import { useEffect } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCurrentUser } from '../api/get-current-user';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

const queryKey = ['auth', 'me'] as const;

export function useCurrentUser(): UseQueryResult<AuthUser, Error> {
  const accessToken = useAuthStore((s) => s.auth.accessToken);
  const setUser     = useAuthStore((s) => s.auth.setUser);

  const result = useQuery<AuthUser, Error, AuthUser, typeof queryKey>({
    queryKey,
    queryFn: getCurrentUser,              
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (result.status === 'success' && result.data) {
      setUser(result.data);
    }
  }, [result.status, result.data, setUser]);

  return result;
}
