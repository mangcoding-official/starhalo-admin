import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { type UserStatus, createUserFromApi, type ApiUser } from '../data/schema'

const apiUserDetailSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  profile: z
    .object({
      username: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      date_of_birth: z.string().nullable().optional(),
      default_target_ml: z.number().nullable().optional(),
      target_ml: z.number().nullable().optional(),
      activity: z.string().nullable().optional(),
      weight: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
      color: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  followers: z.array(z.unknown()).optional(),
  following: z.array(z.unknown()).optional(),
  muted_users: z.array(z.unknown()).optional(),
  muting_users: z.array(z.unknown()).optional(),
  blocked_users: z.array(z.unknown()).optional(),
  blocked_by_users: z.array(z.unknown()).optional(),
  sent_reports: z.array(z.unknown()).optional(),
  received_reports: z.array(z.unknown()).optional(),
  alarm_setting: z.unknown().optional(),
  alarm_events: z.array(z.unknown()).optional(),
  daily_achievements: z.array(z.unknown()).optional(),
  intake_drink_logs: z.array(z.unknown()).optional(),
})

const apiDetailResponseSchema = z.object({
  message: z.string().optional(),
  data: apiUserDetailSchema,
})

export type UserDetail = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  status: UserStatus
  emailVerifiedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  profile: {
    username?: string | null
    phone?: string | null
    address?: string | null
    avatar?: string | null
    gender?: string | null
    dateOfBirth?: string | null
    defaultTargetMl?: number | null
    targetMl?: number | null
    activity?: string | null
    weight?: number | null
    height?: number | null
    color?: string | null
  } | null
  stats: {
    followers: number
    following: number
    mutedUsers: number
    mutingUsers: number
    blockedUsers: number
    blockedByUsers: number
    sentReports: number
    receivedReports: number
    alarmEvents: number
    dailyAchievements: number
    intakeDrinkLogs: number
  }
  raw: ApiUser
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function getUserDetail(userId: string | number): Promise<UserDetail> {
  const response = await apiClient.get(`/api/admin/users/${userId}`)
  const parsed = apiDetailResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to parse user detail response.')
  }

  const apiUser = parsed.data.data
  const baseUser = createUserFromApi(apiUser)

  const detail: UserDetail = {
    id: baseUser.id,
    name: apiUser.name ?? null,
    email: apiUser.email ?? null,
    role: apiUser.role ?? null,
    status: baseUser.status,
    emailVerifiedAt: parseDate(apiUser.email_verified_at),
    createdAt: parseDate(apiUser.created_at),
    updatedAt: parseDate(apiUser.updated_at ?? apiUser.created_at),
    profile: apiUser.profile
      ? {
          username: apiUser.profile.username ?? null,
          phone: apiUser.profile.phone ?? null,
          address: apiUser.profile.address ?? null,
          avatar: apiUser.profile.avatar ?? null,
          gender: apiUser.profile.gender ?? null,
          dateOfBirth: apiUser.profile.date_of_birth ?? null,
          defaultTargetMl: apiUser.profile.default_target_ml ?? null,
          targetMl: apiUser.profile.target_ml ?? null,
          activity: apiUser.profile.activity ?? null,
          weight: apiUser.profile.weight ?? null,
          height: apiUser.profile.height ?? null,
          color: apiUser.profile.color ?? null,
        }
      : null,
    stats: {
      followers: apiUser.followers?.length ?? 0,
      following: apiUser.following?.length ?? 0,
      mutedUsers: apiUser.muted_users?.length ?? 0,
      mutingUsers: apiUser.muting_users?.length ?? 0,
      blockedUsers: apiUser.blocked_users?.length ?? 0,
      blockedByUsers: apiUser.blocked_by_users?.length ?? 0,
      sentReports: apiUser.sent_reports?.length ?? 0,
      receivedReports: apiUser.received_reports?.length ?? 0,
      alarmEvents: apiUser.alarm_events?.length ?? 0,
      dailyAchievements: apiUser.daily_achievements?.length ?? 0,
      intakeDrinkLogs: apiUser.intake_drink_logs?.length ?? 0,
    },
    raw: apiUser,
  }

  return detail
}
