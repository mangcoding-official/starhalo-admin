import { z } from 'zod'
import { apiClient } from '@/lib/api-client'

const apiDeleteResponseSchema = z.object({
  message: z.string().optional(),
})

export async function deletePushNotification(
  id: string | number
): Promise<string | undefined> {
  const response = await apiClient.delete(
    `/api/admin/push-notifications/${id}`
  )

  const parsed = apiDeleteResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to parse delete response.')
  }

  return parsed.data.message
}
