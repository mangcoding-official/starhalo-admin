import { useQuery } from '@tanstack/react-query'
import { getUserDetail } from '../api/get-user'

export function useUserDetailQuery(userId: string | number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => {
      if (userId === null) throw new Error('User id is required')
      return getUserDetail(userId)
    },
    enabled: enabled && userId !== null,
    staleTime: 1000 * 30,
    retry: 1,
  })
}
