import { z } from 'zod'

export const informationStatusSchema = z.enum(['draft', 'published'])
export type InformationStatus = z.infer<typeof informationStatusSchema>

export const informationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  status: informationStatusSchema,
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
})

export type Information = z.infer<typeof informationSchema>

const apiInformationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  publish_date: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type ApiInformation = z.infer<typeof apiInformationSchema>

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeStatus(value: string | null | undefined): InformationStatus {
  return (value ?? '').toLowerCase() === 'published' ? 'published' : 'draft'
}

export function createInformationFromApi(apiInformation: ApiInformation): Information {
  const parsed = apiInformationSchema.parse(apiInformation)

  const information: Information = {
    id: String(parsed.id),
    title: parsed.title?.trim() || 'Untitled',
    content: parsed.content ?? parsed.description ?? parsed.body ?? '',
    status: normalizeStatus(parsed.status),
    createdAt: parseDate(parsed.created_at),
    updatedAt: parseDate(parsed.updated_at ?? parsed.created_at),
  }

  return informationSchema.parse(information)
}
