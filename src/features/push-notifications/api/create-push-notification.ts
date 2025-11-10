import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import {
  apiNotificationSchema,
  createNotificationFromApi,
  type Notification,
} from '../data/schema'
import {
  mapPushNotificationPayload,
  type PushNotificationPayloadInput,
} from './payload'

const apiCreateResponseSchema = z.object({
  message: z.string().optional(),
  data: apiNotificationSchema.optional(),
})

export type CreatePushNotificationResponse = {
  notification?: Notification
  message?: string
}

export async function createPushNotification(
  payload: PushNotificationPayloadInput
): Promise<CreatePushNotificationResponse> {
  const response = await apiClient.post(
    '/api/admin/push-notifications',
    mapPushNotificationPayload(payload)
  )

  const parsed = apiCreateResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to parse create response.')
  }

  const notification = parsed.data.data
    ? createNotificationFromApi(parsed.data.data)
    : undefined

  return {
    notification,
    message: parsed.data.message,
  }
}
