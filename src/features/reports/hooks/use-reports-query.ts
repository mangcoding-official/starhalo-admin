import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getReports, type ReportsQueryParams } from '../api/get-reports'

export const reportsQueryKey = ['admin', 'reports'] as const

export type UseReportsQueryOptions = ReportsQueryParams & {
  enabled?: boolean
}

export function useReportsQuery({ page, perPage, search, status, sort, enabled = true }: UseReportsQueryOptions) {
  return useQuery({
    queryKey: [
      ...reportsQueryKey,
      {
        page: page ?? 1,
        perPage: perPage ?? 10,
        search: search ?? '',
        status: status ?? '',
        sort: sort ?? 'desc',
      },
    ],
    queryFn: () => getReports({
      page: page ?? 1,
      perPage: perPage ?? 10,
      search: search ?? '',
      status: status ?? '',
      sort: sort ?? 'desc',
    }),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 1000 * 30,
  })
}
