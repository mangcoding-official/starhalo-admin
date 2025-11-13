import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { type UserStatus, createUserFromApi } from '../data/schema'

const boolish = z.union([z.boolean(), z.number(), z.string()])

const notificationSummarySchema = z
  .object({
    new_follower: z.array(z.unknown()).optional(),
    daily_follower_progress_list: z.array(z.unknown()).optional(),
    today_notification: z.array(z.unknown()).optional(),
    last_week_notification: z.array(z.unknown()).optional(),
  })
  .optional()

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
      user_id: z.union([z.string(), z.number()]).nullable().optional(),
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
      age: z.number().nullable().optional(),
      is_target_ml_editable: boolish.nullable().optional(),
      is_pregnant: boolish.nullable().optional(),
      is_lactating: boolish.nullable().optional(),
      is_private: boolish.nullable().optional(),
      pattern: z.string().nullable().optional(),
      device_id: z.string().nullable().optional(),
      is_led: boolish.nullable().optional(),
      is_fibration: boolish.nullable().optional(),
      is_alarm: boolish.nullable().optional(),
      is_agree_service: boolish.nullable().optional(),
      is_agree_private_data: boolish.nullable().optional(),
      is_agree_location: boolish.nullable().optional(),
      is_agree_marketing: boolish.nullable().optional(),
      is_notification_muted: boolish.nullable().optional(),
      is_information_muted: boolish.nullable().optional(),
      streak: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  followers: z.array(z.unknown()).optional(),
  following: z.array(z.unknown()).optional(),
  followers_all: z.array(z.unknown()).optional(),
  muted_users: z.array(z.unknown()).optional(),
  mutedUsers: z.array(z.unknown()).optional(),
  muting_users: z.array(z.unknown()).optional(),
  blocked_users: z.array(z.unknown()).optional(),
  blockedUsers: z.array(z.unknown()).optional(),
  blocked_by_users: z.array(z.unknown()).optional(),
  sent_reports: z.array(z.unknown()).optional(),
  sentReports: z.array(z.unknown()).optional(),
  received_reports: z.array(z.unknown()).optional(),
  alarm_setting: z.unknown().optional(),
  alarmSetting: z.unknown().optional(),
  alarm_events: z.array(z.unknown()).optional(),
  daily_achievements: z.array(z.unknown()).optional(),
  intake_drink_logs: z.array(z.unknown()).optional(),
  my_thumbler: z.unknown().optional(),
  my_hydration: z.unknown().optional(),
  my_notification: notificationSummarySchema,
  my_today_drink_logs: z.array(z.unknown()).optional(),
})

const apiDetailResponseSchema = z.object({
  message: z.string().optional(),
  data: apiUserDetailSchema,
})

type ApiUserDetail = z.infer<typeof apiUserDetailSchema>

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
    userId?: string | number | null
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
    age?: number | null
    isTargetMlEditable?: boolean | null
    isPregnant?: boolean | null
    isLactating?: boolean | null
    isPrivate?: boolean | null
    pattern?: string | null
    deviceId?: string | null
    isLed?: boolean | null
    isFibration?: boolean | null
    isAlarm?: boolean | null
    isAgreeService?: boolean | null
    isAgreePrivateData?: boolean | null
    isAgreeLocation?: boolean | null
    isAgreeMarketing?: boolean | null
    isNotificationMuted?: boolean | null
    isInformationMuted?: boolean | null
    streak?: number | null
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
  raw: ApiUserDetail
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseBooleanFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return null
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return null
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return null
}

export type GetUserDetailParams = {
  type?: 'weekly' | 'monthly'
  startDate?: string
  endDate?: string
}

export async function getUserDetail(
  userId: string | number,
  params: GetUserDetailParams = {}
): Promise<UserDetail> {
  const { type = 'weekly', startDate, endDate } = params

  const query: Record<string, string> = { type }
  if (startDate && endDate) {
    query.start_date = startDate
    query.end_date = endDate
  }

  const response = await apiClient.get(`/api/admin/users/${userId}`, {
    params: query,
  })
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
          userId: apiUser.profile.user_id ?? null,
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
          age: apiUser.profile.age ?? null,
          isTargetMlEditable: parseBooleanFlag(apiUser.profile.is_target_ml_editable),
          isPregnant: parseBooleanFlag(apiUser.profile.is_pregnant),
          isLactating: parseBooleanFlag(apiUser.profile.is_lactating),
          isPrivate: parseBooleanFlag(apiUser.profile.is_private),
          pattern: apiUser.profile.pattern ?? null,
          deviceId: apiUser.profile.device_id ?? null,
          isLed: parseBooleanFlag(apiUser.profile.is_led),
          isFibration: parseBooleanFlag(apiUser.profile.is_fibration),
          isAlarm: parseBooleanFlag(apiUser.profile.is_alarm),
          isAgreeService: parseBooleanFlag(apiUser.profile.is_agree_service),
          isAgreePrivateData: parseBooleanFlag(apiUser.profile.is_agree_private_data),
          isAgreeLocation: parseBooleanFlag(apiUser.profile.is_agree_location),
          isAgreeMarketing: parseBooleanFlag(apiUser.profile.is_agree_marketing),
          isNotificationMuted: parseBooleanFlag(apiUser.profile.is_notification_muted),
          isInformationMuted: parseBooleanFlag(apiUser.profile.is_information_muted),
          streak: apiUser.profile.streak ?? null,
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
