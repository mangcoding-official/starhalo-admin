import {
  notificationStatusSchema,
  type NotificationStatus,
  type NotificationUpsert,
} from '../data/schema'
import { NOTIF_PRIORITY, NOTIF_TARGET } from '../data/data'

export type PushNotificationPayloadInput = Pick<
  NotificationUpsert,
  'title' | 'content' | 'scheduleDate'
> & {
  status: NotificationStatus
  target?: (typeof NOTIF_TARGET)[number]
  priority?: (typeof NOTIF_PRIORITY)[number]
  imageFile?: File | null
}

export function toApiStatus(status: NotificationStatus): string {
  switch (status) {
    case 'scheduled':
      return 'publish'
    case 'sending':
      return 'sending'
    case 'sent':
      return 'sent'
    case 'canceled':
      return 'canceled'
    case 'failed':
      return 'failed'
    case 'draft':
    default:
      return 'draft'
  }
}

export function formatDateForApi(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`
  }
  return trimmed
}

export function mapPushNotificationPayload(
  payload: PushNotificationPayloadInput
): Record<string, unknown> | FormData {
  if (!notificationStatusSchema.safeParse(payload.status).success) {
    throw new Error('Invalid status value')
  }

  const scheduleAt = formatDateForApi(payload.scheduleDate)

  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
    message: payload.content,
    status: toApiStatus(payload.status),
  }

  if (scheduleAt !== null) {
    body.schedule_at = scheduleAt
    body.scheduled_at = scheduleAt
  }

  if (payload.target && NOTIF_TARGET.includes(payload.target)) {
    body.target = payload.target
  }

  if (payload.priority && NOTIF_PRIORITY.includes(payload.priority)) {
    body.priority = payload.priority
  }

  const hasImageFile =
    typeof File !== 'undefined' && payload.imageFile instanceof File

  if (hasImageFile && payload.imageFile) {
    const formData = new FormData()
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      formData.append(key, String(value))
    })
    formData.append('image', payload.imageFile)
    return formData
  }

  return body
}
