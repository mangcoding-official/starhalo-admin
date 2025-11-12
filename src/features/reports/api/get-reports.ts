import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { createReportFromApi, type Report } from '../data/schema'

const unknownRecordSchema = z.record(z.string(), z.any())

const apiReportSchema = z.object({
  id: z.union([z.string(), z.number()]),
  reporter_email: z.string().nullable().optional(),
  reporter_user_email: z.string().nullable().optional(),
  reporter: unknownRecordSchema.nullable().optional(),
  reporter_user: unknownRecordSchema.nullable().optional(),
  reported_email: z.string().nullable().optional(),
  target_email: z.string().nullable().optional(),
  reported: unknownRecordSchema.nullable().optional(),
  reported_user: unknownRecordSchema.nullable().optional(),
  target_user: unknownRecordSchema.nullable().optional(),
  reason: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

const legacyPaginatedSchema = z.object({
  data: z.array(apiReportSchema),
  current_page: z.number().int().nonnegative(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().nonnegative().optional(),
  next_page_url: z.string().nullable().optional(),
  prev_page_url: z.string().nullable().optional(),
})

const itemsPaginatedSchema = z.object({
  items: z.array(apiReportSchema),
  pagination: z.object({
    current_page: z.number().int().nonnegative(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    last_page: z.number().int().nonnegative().optional(),
    next_page_url: z.string().nullable().optional(),
    prev_page_url: z.string().nullable().optional(),
  }),
})

const apiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.union([legacyPaginatedSchema, itemsPaginatedSchema]).optional(),
})

const fallbackArraySchema = z.object({
  message: z.string().optional(),
  data: z.array(apiReportSchema).optional(),
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
  const response = await apiClient.get('/api/admin/reports', {
    params: buildQueryParams(params),
  })

  const parsed = apiResponseSchema.safeParse(response.data)
  if (parsed.success && parsed.data.data) {
    const { data, message } = parsed.data

    if ('data' in data) {
      const { data: items, current_page, per_page, total, last_page, next_page_url, prev_page_url } = data
      const reports = items.map(createReportFromApi)
      return {
        reports,
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

    if ('items' in data) {
      const {
        items,
        pagination: { current_page, per_page, total, last_page, next_page_url, prev_page_url },
      } = data
      const reports = items.map(createReportFromApi)
      return {
        reports,
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
  }

  const fallback = fallbackArraySchema.safeParse(response.data)
  if (fallback.success && fallback.data.data) {
    const reports = fallback.data.data.map(createReportFromApi)
    const total = reports.length
    return {
      reports,
      pagination: {
        page,
        perPage,
        total,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
        hasNext: false,
        hasPrevious: page > 1 && page <= Math.ceil(total / perPage),
      },
      rawMessage: fallback.data.message,
    }
  }

  throw new Error('Unable to parse reports response.')
}
