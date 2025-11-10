import { z } from 'zod'
import { apiClient } from '@/lib/api-client'

const deleteResponseSchema = z.object({
  message: z.string().optional(),
})

export async function deleteInformation(id: string | number): Promise<string | undefined> {
  const response = await apiClient.delete(`/api/admin/informations/${id}`)
  const parsed = deleteResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to delete information.')
  }

  return parsed.data.message
}
