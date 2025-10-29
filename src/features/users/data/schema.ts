import { z } from 'zod'

export const userStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type UserStatus = z.infer<typeof userStatusSchema>

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  status: userStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

export const apiUserSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  profile: z.unknown().optional(),
})

export type ApiUser = z.infer<typeof apiUserSchema>

function toStatus(value: string | null | undefined, emailVerified: string | null | undefined): UserStatus {
  if (value === 'inactive') return 'inactive'
  if (emailVerified) return 'active'
  return 'inactive'
}

function safeDate(value: string | null | undefined): Date {
  if (!value) return new Date(0)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date(0)
  return parsed
}

export function createUserFromApi(apiUser: ApiUser): User {
  const parsed = apiUserSchema.parse(apiUser)

  const username =
    parsed.name?.trim() ||
    parsed.email?.trim() ||
    `user-${String(parsed.id).padStart(4, '0')}`

  const payload = {
    id: String(parsed.id),
    username,
    email: parsed.email?.trim() || 'unknown@example.com',
    status: toStatus(parsed.status, parsed.email_verified_at),
    createdAt: safeDate(parsed.created_at),
    updatedAt: safeDate(parsed.updated_at ?? parsed.created_at),
  }

  return userSchema.parse(payload)
}
