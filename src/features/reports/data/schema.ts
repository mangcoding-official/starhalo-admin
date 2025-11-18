import { z } from 'zod'

export const reportStatusSchema = z.enum(['pending', 'resolve'])
export type ReportStatus = z.infer<typeof reportStatusSchema>

export const reportSchema = z.object({
  id: z.string(),
  reporterId: z.string().nullable(),
  reporterName: z.string(),
  reportedId: z.string().nullable(),
  reportedName: z.string(),
  reason: z.string(),
  status: reportStatusSchema,
  createdAt: z.date().nullable(),
})

export type Report = z.infer<typeof reportSchema>

export const apiReportSchema = z.object({
  id: z.union([z.string(), z.number()]),
  reason: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  reporter: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .partial()
    .nullable()
    .optional(),
  reporter_name: z.string().nullable().optional(),
  reporter_email: z.string().nullable().optional(),
  reported: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .partial()
    .nullable()
    .optional(),
  reported_name: z.string().nullable().optional(),
  reported_email: z.string().nullable().optional(),
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

  const reporterName =
    pickString(parsed.reporter?.name, parsed.reporter_name, parsed.reporter_email) || 'Unknown reporter'
  const reportedName =
    pickString(parsed.reported?.name, parsed.reported_name, parsed.reported_email) || 'Unknown user'

  const reporterId =
    parsed.reporter?.id !== null && typeof parsed.reporter?.id !== 'undefined'
      ? String(parsed.reporter.id)
      : null
  const reportedId =
    parsed.reported?.id !== null && typeof parsed.reported?.id !== 'undefined'
      ? String(parsed.reported.id)
      : null

  const reason = pickString(parsed.reason) || 'No reason provided'

  const report: Report = {
    id: String(parsed.id),
    reporterId,
    reporterName,
    reportedId,
    reportedName,
    reason,
    status: normalizeStatus(parsed.status),
    createdAt: parseDate(parsed.created_at ?? parsed.updated_at),
  }

  return reportSchema.parse(report)
}
