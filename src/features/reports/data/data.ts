import { type ReportStatus } from './schema'

export const reportStatusOptions: Array<{
  label: string
  labelKey: string
  value: ReportStatus
}> = [
  { label: 'Pending', labelKey: 'reports.status.pending', value: 'pending' },
  { label: 'Resolved', labelKey: 'reports.status.resolve', value: 'resolve' },
]
