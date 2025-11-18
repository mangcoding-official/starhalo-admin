import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { apiReportSchema, createReportFromApi, type Report } from '../data/schema'

const paginationMetaSchema = z.object({
  current_page: z.number().int().nonnegative(),
  last_page: z.number().int().nonnegative().optional(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  next_page_url: z.string().nullable().optional(),
  prev_page_url: z.string().nullable().optional(),
})

const apiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(apiReportSchema),
  meta: paginationMetaSchema,
})

export type ReportsQueryParams = {
  page?: number
  perPage?: number
  search?: string
  status?: string
  sort?: 'asc' | 'desc'
}

export type ReportsQueryResult = {
  reports: Report[]
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

function buildQueryParams({ page = 1, perPage = 10, search, status, sort }: ReportsQueryParams) {
  return {
    page,
    per_page: perPage,
    ...(search && search.trim().length > 0 ? { s: search.trim() } : {}),
    ...(status && status.trim().length > 0 ? { status: status.trim() } : {}),
    ...(sort ? { sort } : {}),
  }
}

export async function getReports(params: ReportsQueryParams = {}): Promise<ReportsQueryResult> {
  const { page = 1, perPage = 10 } = params
  const response = await apiClient.get('/api/admin/followers/report', {
    params: buildQueryParams(params),
  })

  const parsed = apiResponseSchema.safeParse(response.data)
  if (!parsed.success) {
    throw new Error('Unable to parse reports response.')
  }

  const reports = parsed.data.data.map(createReportFromApi)
  const meta = parsed.data.meta
  const hasNext =
    typeof meta.next_page_url !== 'undefined'
      ? Boolean(meta.next_page_url)
      : typeof meta.last_page === 'number'
        ? meta.current_page < meta.last_page
        : false
  const hasPrevious =
    typeof meta.prev_page_url !== 'undefined'
      ? Boolean(meta.prev_page_url)
      : meta.current_page > 1

  return {
    reports,
    pagination: {
      page: meta.current_page,
      perPage: meta.per_page,
      total: meta.total,
      lastPage: meta.last_page,
      hasNext,
      hasPrevious,
    },
    rawMessage: parsed.data.message,
  }
}
