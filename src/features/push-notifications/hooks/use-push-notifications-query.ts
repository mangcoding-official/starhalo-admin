import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getPushNotifications,
  type PushNotificationsQueryParams,
} from '../api/get-push-notifications'

export const pushNotificationsQueryKey = ['admin', 'push-notifications'] as const

export type UsePushNotificationsQueryOptions = PushNotificationsQueryParams & {
  enabled?: boolean
}

export function usePushNotificationsQuery({
  page,
  perPage,
  sort,
  search,
  enabled = true,
}: UsePushNotificationsQueryOptions) {
  return useQuery({
    queryKey: [
      ...pushNotificationsQueryKey,
      {
        page: page ?? 1,
        perPage: perPage ?? 10,
        sort: sort ?? 'desc',
        search: search ?? '',
      },
    ],
    queryFn: () =>
      getPushNotifications({
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
