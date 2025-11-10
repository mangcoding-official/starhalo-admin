import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getInformations,
  type InformationsQueryParams,
} from '../api/get-informations'

export const informationsQueryKey = ['admin', 'informations'] as const

export type UseInformationsQueryOptions = InformationsQueryParams & {
  enabled?: boolean
}

export function useInformationsQuery({
  page,
  perPage,
  sort,
  search,
  enabled = true,
}: UseInformationsQueryOptions) {
  return useQuery({
    queryKey: [
      ...informationsQueryKey,
      {
        page: page ?? 1,
        perPage: perPage ?? 10,
        sort: sort ?? 'desc',
        search: search ?? '',
      },
    ],
    queryFn: () =>
      getInformations({
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
