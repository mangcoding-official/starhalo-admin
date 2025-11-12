import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { createInformationFromApi, type Information } from '../data/schema'

const apiInformationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  publish_date: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

const apiPaginatedResponseSchema = z.object({
  message: z.string().optional(),
  data: z
    .object({
      data: z.array(apiInformationSchema),
      current_page: z.number().int().nonnegative(),
      per_page: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      last_page: z.number().int().nonnegative().optional(),
      next_page_url: z.string().nullable().optional(),
      prev_page_url: z.string().nullable().optional(),
    })
    .optional(),
})

const fallbackArrayResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(apiInformationSchema).optional(),
})

export type InformationsQueryParams = {
  page?: number
  perPage?: number
  sort?: 'asc' | 'desc'
  search?: string
}

export type InformationsQueryResult = {
  informations: Information[]
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
}: InformationsQueryParams) {
  return {
    page,
    per_page: perPage,
    ...(sort ? { sort } : {}),
    ...(search && search.trim().length > 0 ? { s: search.trim() } : {}),
  }
}

export async function getInformations(
  params: InformationsQueryParams = {}
): Promise<InformationsQueryResult> {
  const { page = 1, perPage = 10 } = params
  const response = await apiClient.get('/api/admin/informations', {
    params: buildQueryParams(params),
  })

  const paginated = apiPaginatedResponseSchema.safeParse(response.data)

  if (paginated.success && paginated.data.data) {
    const {
      data: { data: apiItems, current_page, per_page, total, last_page, next_page_url, prev_page_url },
      message,
    } = paginated.data

    const informations = apiItems.map(createInformationFromApi)

    return {
      informations,
      pagination: {
        page: current_page,
        perPage: per_page,
        total,
        lastPage: last_page,
        hasNext: Boolean(next_page_url),
        hasPrevious: Boolean(prev_page_url),
      },
      rawMessage: message,
    }
  }

  const arrayResponse = fallbackArrayResponseSchema.safeParse(response.data)
  if (arrayResponse.success && arrayResponse.data.data) {
    const informations = arrayResponse.data.data.map(createInformationFromApi)
    const total = informations.length

    return {
      informations,
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

  throw new Error('Unable to parse informations response.')
}
