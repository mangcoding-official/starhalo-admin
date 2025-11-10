import { Informations } from '@/features/informations'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  s: z.string().optional().catch(''),
  sort: z.enum(['asc', 'desc']).optional().catch('desc'),
})

export const Route = createFileRoute('/_authenticated/informations/')({
  validateSearch: searchSchema,
  component: Informations,
})
