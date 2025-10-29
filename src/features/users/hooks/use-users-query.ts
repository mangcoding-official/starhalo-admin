import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getUsers, type UsersQueryParams } from '../api/get-users'

const QUERY_KEY = ['admin', 'users'] as const

export type UseUsersQueryOptions = UsersQueryParams & {
  enabled?: boolean
}

export function useUsersQuery({
  page,
  perPage,
  sort,
  search,
  enabled = true,
}: UseUsersQueryOptions) {
  return useQuery({
    queryKey: [
      ...QUERY_KEY,
      { page: page ?? 1, perPage: perPage ?? 10, sort: sort ?? 'desc', search: search ?? '' },
    ],
    queryFn: () =>
      getUsers({
        page,
        perPage,
        sort,
        search,
      }),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 1000 * 30,
  })
}
