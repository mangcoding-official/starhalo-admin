import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import {
  createInformationFromApi,
  type Information,
  type InformationStatus,
  informationStatusSchema,
} from '../data/schema'

const upsertResponseSchema = z.object({
  message: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]),
      title: z.string().nullable().optional(),
      content: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      body: z.string().nullable().optional(),
      status: informationStatusSchema.nullish(),
      publish_date: z.string().nullable().optional(),
      published_at: z.string().nullable().optional(),
      scheduled_at: z.string().nullable().optional(),
      created_at: z.string().nullable().optional(),
      updated_at: z.string().nullable().optional(),
    })
    .optional(),
})

type CreateInformationPayload = {
  title: string
  content: string
  status: InformationStatus
}

function buildPayload(values: CreateInformationPayload) {
  const payload: Record<string, unknown> = {
    title: values.title,
    content: values.content,
    status: values.status,
  }

  return payload
}

export async function createInformation(
  values: CreateInformationPayload
): Promise<{ information: Information | null; message?: string }> {
  const response = await apiClient.post(
    '/api/admin/informations',
    buildPayload(values)
  )

  const parsed = upsertResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error('Unable to create information.')
  }

  const information = parsed.data.data
    ? createInformationFromApi(parsed.data.data)
    : null

  return {
    information,
    message: parsed.data.message,
  }
}
