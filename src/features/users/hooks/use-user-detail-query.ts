import { useQuery } from '@tanstack/react-query'
import { getUserDetail, type GetUserDetailParams } from '../api/get-user'

export type UserDetailQueryOptions = {
  reportType?: GetUserDetailParams['type']
  startDate?: string
  endDate?: string
}

export function useUserDetailQuery(
  userId: string | number | null,
  enabled: boolean,
  options: UserDetailQueryOptions = {}
) {
  const { reportType = 'weekly', startDate, endDate } = options

  return useQuery({
    queryKey: [
      'admin',
      'users',
      'detail',
      userId,
      {
        reportType,
        startDate,
        endDate,
      },
    ],
    queryFn: () => {
      if (userId === null) throw new Error('User id is required')
      return getUserDetail(userId, {
        type: reportType,
        startDate,
        endDate,
      })
    },
    enabled: enabled && userId !== null,
    staleTime: 1000 * 30,
    retry: 1,
  })
}
