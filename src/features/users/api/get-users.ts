import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { type User, createUserFromApi } from '../data/schema'

const apiUserSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  profile: z.unknown().optional(),
})

const apiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    data: z.array(apiUserSchema),
    current_page: z.number().int().nonnegative(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    last_page: z.number().int().nonnegative().optional(),
    next_page_url: z.string().nullable().optional(),
    prev_page_url: z.string().nullable().optional(),
  }),
})

export type UsersQueryParams = {
  page?: number
  perPage?: number
  sort?: 'asc' | 'desc'
  search?: string
}

export type UsersQueryResult = {
  users: User[]
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

export async function getUsers({
  page = 1,
  perPage = 10,
  sort = 'desc',
  search,
}: UsersQueryParams = {}): Promise<UsersQueryResult> {
  const response = await apiClient.get('/api/admin/users', {
    params: {
      page,
      per_page: perPage,
      sort,
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
  })

  const parsed = apiResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to parse users response.')
  }

  const {
    data: { data: apiUsers, current_page, per_page, total, last_page, next_page_url, prev_page_url },
    message,
  } = parsed.data

  const users = apiUsers.map(createUserFromApi)

  console.log(users)

  return {
    users,
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
