import { z } from 'zod'

export const reportStatusSchema = z.enum(['pending', 'resolve'])
export type ReportStatus = z.infer<typeof reportStatusSchema>

export const reportSchema = z.object({
  id: z.string(),
  reporterEmail: z.string(),
  reportedEmail: z.string(),
  reason: z.string(),
  status: reportStatusSchema,
  createdAt: z.date().nullable(),
})

export type Report = z.infer<typeof reportSchema>

const nestedUserSchema = z
  .object({
    email: z.string().nullable().optional(),
  })
  .partial()
  .optional()
  .nullable()

const apiReportSchema = z.object({
  id: z.union([z.string(), z.number()]),
  reporter_email: z.string().nullable().optional(),
  reporter: nestedUserSchema,
  reporter_user: nestedUserSchema,
  reporter_user_email: z.string().nullable().optional(),
  reported_email: z.string().nullable().optional(),
  reported: nestedUserSchema,
  reported_user: nestedUserSchema,
  target_email: z.string().nullable().optional(),
  target_user: nestedUserSchema,
  reason: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type ApiReport = z.infer<typeof apiReportSchema>

function pickString(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0 && trimmed.toLowerCase() !== 'null') {
        return trimmed
      }
    }
  }
  return ''
}

function normalizeStatus(value: string | null | undefined): ReportStatus {
  const normalized = (value ?? '').toLowerCase()
  if (normalized === 'resolve') {
    return 'resolve'
  }
  return 'pending'
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function createReportFromApi(apiReport: ApiReport): Report {
  const parsed = apiReportSchema.parse(apiReport)

  const reporterEmail = pickString(
    parsed.reporter_email,
    parsed.reporter_user_email,
    parsed.reporter?.email,
    parsed.reporter_user?.email
  )

  const reportedEmail = pickString(
    parsed.reported_email,
    parsed.target_email,
    parsed.reported?.email,
    parsed.reported_user?.email,
    parsed.target_user?.email
  )

  const reason = pickString(parsed.reason, parsed.message, parsed.description, parsed.notes) || 'No reason provided'

  const report: Report = {
    id: String(parsed.id),
    reporterEmail: reporterEmail || 'Unknown',
    reportedEmail: reportedEmail || 'Unknown',
    reason,
    status: normalizeStatus(parsed.status ?? parsed.state),
    createdAt: parseDate(parsed.created_at ?? parsed.updated_at),
  }

  return reportSchema.parse(report)
}
