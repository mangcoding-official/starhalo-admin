import { apiClient } from '@/lib/api-client'
import type { ReportStatus } from '../data/schema'

export type UpdateReportStatusPayload = {
  status: ReportStatus
}

export async function updateReportStatus(id: string, payload: UpdateReportStatusPayload) {
  const response = await apiClient.put(`/api/admin/reports/${id}`, payload)
  if (response.data && typeof response.data.message === 'string') {
    return response.data.message as string
  }
  return 'Report status updated successfully.'
}
