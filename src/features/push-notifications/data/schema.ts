import { z } from 'zod'
import { NOTIF_PRIORITY, NOTIF_STATUS, NOTIF_TARGET } from './data'

export const notificationStatusSchema = z.enum(NOTIF_STATUS)
export type NotificationStatus = z.infer<typeof notificationStatusSchema>

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),

  imageUrl: z.string().nullable().optional(),

  target: z.enum(NOTIF_TARGET).default('all'),
  criteria: z.unknown().nullable().optional(),

  priority: z.enum(NOTIF_PRIORITY).default('normal'),

  scheduleDate: z.string().nullable().optional(),
  status: notificationStatusSchema,
  sentAt: z.string().nullable().optional(),

  createdBy: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),

  resultSummary: z.unknown().nullable().optional(),
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationListItemSchema = notificationSchema.pick({
  id: true,
  title: true,
  content: true,
  scheduleDate: true,
  status: true,
  sentAt: true,
})

export type NotificationListItem = z.infer<typeof notificationListItemSchema>

export const notificationUpsertSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(80),
    content: z.string().min(1, 'Content is required').max(240),

    target: z.enum(NOTIF_TARGET).default('all'),
    criteria: z.unknown().nullable().optional(),

    priority: z.enum(NOTIF_PRIORITY).default('normal'),

    status: notificationStatusSchema.default('draft'),
    scheduleDate: z.string().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if ((v.status === 'scheduled' || v.status === 'sending') && !v.scheduleDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduleDate'],
        message: 'Schedule date is required when status is Scheduled/Sending',
      })
    }
  })
export type NotificationUpsert = z.infer<typeof notificationUpsertSchema>

export const notificationsListParamsSchema = z.object({
  q: z.string().optional(),
  status: notificationStatusSchema.optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
})
export type NotificationsListParams = z.infer<typeof notificationsListParamsSchema>

export const pageMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})
export const notificationsPageSchema = z.object({
  data: z.array(notificationListItemSchema),
  meta: pageMetaSchema,
})
export type NotificationsPage = z.infer<typeof notificationsPageSchema>

export const apiNotificationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  target: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  criteria: z.unknown().nullable().optional(),
  image: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  schedule_at: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  send_at: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  created_by: z.union([z.string(), z.number(), z.object({ name: z.string().optional() })]).nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  result_summary: z.unknown().nullable().optional(),
})

export type ApiNotification = z.infer<typeof apiNotificationSchema>

function toIsoString(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return trimmed
}

function normalizeStatus(value: string | null | undefined): NotificationStatus {
  switch ((value ?? '').toLowerCase()) {
    case 'scheduled':
    case 'schedule':
    case 'publish':
    case 'published':
      return 'scheduled'
    case 'sending':
      return 'sending'
    case 'sent':
      return 'sent'
    case 'canceled':
    case 'cancelled':
      return 'canceled'
    case 'failed':
      return 'failed'
    case 'draft':
    default:
      return 'draft'
  }
}

function normalizeTarget(value: string | null | undefined) {
  const v = (value ?? '').toLowerCase()
  const fallback = 'all'
  if (NOTIF_TARGET.includes(v as (typeof NOTIF_TARGET)[number])) {
    return v as (typeof NOTIF_TARGET)[number]
  }
  return fallback
}

function normalizePriority(value: string | null | undefined) {
  const v = (value ?? '').toLowerCase()
  const fallback = 'normal'
  if (NOTIF_PRIORITY.includes(v as (typeof NOTIF_PRIORITY)[number])) {
    return v as (typeof NOTIF_PRIORITY)[number]
  }
  return fallback
}

export function createNotificationFromApi(apiNotification: ApiNotification): Notification {
  const parsed = apiNotificationSchema.parse(apiNotification)

  const scheduleDate =
    toIsoString(parsed.schedule_at) ??
    toIsoString(parsed.scheduled_at) ??
    toIsoString(parsed.send_at)

  const sentAt = toIsoString(parsed.sent_at ?? parsed.send_at)

  const createdAt = toIsoString(parsed.created_at)
  const updatedAt = toIsoString(parsed.updated_at ?? parsed.created_at)

  const rawBase =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    'https://starhalo.mangcoding.com'

  const resolveBaseOrigin = () => {
    try {
      const parsed = new URL(rawBase)
      return parsed.origin
    } catch {
      return rawBase.replace(/\/+$/, '')
    }
  }

  const baseOrigin = resolveBaseOrigin().replace(/\/+$/, '')
  const storageBase = `${baseOrigin}/storage`

  const normalizeImageUrl = (value?: string | null) => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    const cleaned = trimmed.replace(/^\/+/, '')
    return `${storageBase}/${cleaned}`
  }

  const imageUrl = normalizeImageUrl(parsed.image_url) ?? normalizeImageUrl(parsed.image)

  const createdBy =
    typeof parsed.created_by === 'object'
      ? parsed.created_by?.name ?? null
      : parsed.created_by
        ? String(parsed.created_by)
        : null

  const notification = {
    id: String(parsed.id),
    title: parsed.title?.trim() || 'Untitled notification',
    content:
      parsed.content ??
      parsed.message ??
      parsed.description ??
      parsed.body ??
      '',
    imageUrl,
    target: normalizeTarget(parsed.target),
    criteria: parsed.criteria ?? null,
    priority: normalizePriority(parsed.priority),
    scheduleDate,
    status: normalizeStatus(parsed.status),
    sentAt,
    createdBy,
    createdAt,
    updatedAt,
    resultSummary: parsed.result_summary ?? null,
  }

  return notificationSchema.parse(notification)
}
