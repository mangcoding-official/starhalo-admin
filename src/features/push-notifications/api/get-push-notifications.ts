import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import {
  apiNotificationSchema,
  createNotificationFromApi,
  type Notification,
} from '../data/schema'

const legacyPaginatedDataSchema = z.object({
  data: z.array(apiNotificationSchema),
  current_page: z.number().int().nonnegative(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().nonnegative().optional(),
  next_page_url: z.string().nullable().optional(),
  prev_page_url: z.string().nullable().optional(),
})

const itemsPaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  per_page: z.number().int().positive(),
  current_page: z.number().int().nonnegative(),
  last_page: z.number().int().nonnegative().optional(),
  from: z.number().int().nonnegative().optional(),
  to: z.number().int().nonnegative().optional(),
  next_page_url: z.string().nullable().optional(),
  prev_page_url: z.string().nullable().optional(),
})

const itemsPaginatedDataSchema = z.object({
  items: z.array(apiNotificationSchema),
  pagination: itemsPaginationSchema,
})

const apiPaginatedResponseSchema = z.object({
  message: z.string().optional(),
  data: z.union([legacyPaginatedDataSchema, itemsPaginatedDataSchema]).optional(),
})

const fallbackArrayResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(apiNotificationSchema).optional(),
})

export type PushNotificationsQueryParams = {
  page?: number
  perPage?: number
  sort?: 'asc' | 'desc'
  search?: string
}

export type PushNotificationsQueryResult = {
  notifications: Notification[]
  pagination: {
    page: number
    perPage: number
    total: number
    lastPage?: number
    hasNext: boolean
    hasPrevious: boolean
  }
  rawMessage?: string
}

function buildQueryParams({
  page = 1,
  perPage = 10,
  sort,
  search,
}: PushNotificationsQueryParams) {
  return {
    page,
    per_page: perPage,
    ...(sort ? { sort } : {}),
    ...(search && search.trim().length > 0 ? { s: search.trim() } : {}),
  }
}

export async function getPushNotifications(
  params: PushNotificationsQueryParams = {}
): Promise<PushNotificationsQueryResult> {
  const { page = 1, perPage = 10 } = params
  const response = await apiClient.get('/api/admin/push-notifications', {
    params: buildQueryParams(params),
  })

  const paginated = apiPaginatedResponseSchema.safeParse(response.data)

  if (paginated.success && paginated.data.data) {
    const { data, message } = paginated.data

    if ('data' in data) {
      const {
        data: apiItems,
        current_page,
        per_page,
        total,
        last_page,
        next_page_url,
        prev_page_url,
      } = data

      const notifications = apiItems.map(createNotificationFromApi)

      return {
        notifications,
        pagination: {
          page: current_page,
          perPage: per_page,
          total,
          lastPage: last_page,
          hasNext:
            typeof next_page_url !== 'undefined'
              ? Boolean(next_page_url)
              : typeof last_page === 'number'
                ? current_page < last_page
                : false,
          hasPrevious:
            typeof prev_page_url !== 'undefined'
              ? Boolean(prev_page_url)
              : current_page > 1,
        },
        rawMessage: message,
      }
    }

    if ('items' in data) {
      const {
        items,
        pagination: {
          current_page,
          per_page,
          total,
          last_page,
          next_page_url,
          prev_page_url,
        },
      } = data

      const notifications = items.map(createNotificationFromApi)

      return {
        notifications,
        pagination: {
          page: current_page,
          perPage: per_page,
          total,
          lastPage: last_page,
          hasNext:
            typeof next_page_url !== 'undefined'
              ? Boolean(next_page_url)
              : typeof last_page === 'number'
                ? current_page < last_page
                : false,
          hasPrevious:
            typeof prev_page_url !== 'undefined'
              ? Boolean(prev_page_url)
              : current_page > 1,
        },
        rawMessage: message,
      }
    }
  }

  const arrayResponse = fallbackArrayResponseSchema.safeParse(response.data)
  if (arrayResponse.success && arrayResponse.data.data) {
    const notifications = arrayResponse.data.data.map(createNotificationFromApi)
    const total = notifications.length

    return {
      notifications,
      pagination: {
        page,
        perPage,
        total,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
        hasNext: false,
        hasPrevious: page > 1 && page <= Math.ceil(total / perPage),
      },
      rawMessage: arrayResponse.data.message,
    }
  }

  throw new Error('Unable to parse push notifications response.')
}
