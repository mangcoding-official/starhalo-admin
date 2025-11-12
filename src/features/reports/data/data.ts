import { type ReportStatus } from './schema'

export const reportStatusOptions: Array<{ label: string; value: ReportStatus }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolve' },
]
