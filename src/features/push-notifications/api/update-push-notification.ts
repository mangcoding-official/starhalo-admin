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

const apiUpdateResponseSchema = z.object({
  message: z.string().optional(),
  data: apiNotificationSchema.optional(),
})

export type UpdatePushNotificationResponse = {
  notification?: Notification
  message?: string
}

export async function updatePushNotification(
  id: string | number,
  payload: PushNotificationPayloadInput
): Promise<UpdatePushNotificationResponse> {
  const response = await apiClient.put(
    `/api/admin/push-notifications/${id}`,
    mapPushNotificationPayload(payload)
  )

  const parsed = apiUpdateResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to parse update response.')
  }

  const notification = parsed.data.data
    ? createNotificationFromApi(parsed.data.data)
    : undefined

  return {
    notification,
    message: parsed.data.message,
  }
}
