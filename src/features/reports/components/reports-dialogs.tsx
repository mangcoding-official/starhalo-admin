import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReports } from './reports-provider'
import { reportStatusOptions } from '../data/data'
import type { ReportStatus } from '../data/schema'
import { updateReportStatus } from '../api/update-report-status'
import { reportsQueryKey } from '../hooks/use-reports-query'

export function ReportsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useReports()
  if (!currentRow) {
    return null
  }
  return (
    <ReportStatusDialog
      open={open === 'status'}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setCurrentRow(null)
          setOpen(null)
        } else {
          setOpen('status')
        }
      }}
      reportId={currentRow.id}
      initialStatus={currentRow.status}
      reporterEmail={currentRow.reporterEmail}
      reportedEmail={currentRow.reportedEmail}
    />
  )
}

type ReportStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  initialStatus: ReportStatus
  reporterEmail: string
  reportedEmail: string
}

function ReportStatusDialog({
  open,
  onOpenChange,
  reportId,
  initialStatus,
  reporterEmail,
  reportedEmail,
}: ReportStatusDialogProps) {
  const [status, setStatus] = useState<ReportStatus>(initialStatus)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      setStatus(initialStatus)
    }
  }, [initialStatus, open])

  const mutation = useMutation({
    mutationFn: async (nextStatus: ReportStatus) => updateReportStatus(reportId, { status: nextStatus }),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKey, exact: false })
      toast.success(message ?? 'Report status updated.')
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update report.'
      toast.error(message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Update Report Status</DialogTitle>
          <DialogDescription>
            Reporter: <strong>{reporterEmail}</strong> · Reported user: <strong>{reportedEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Status</label>
          <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus)}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              {reportStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate(status)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
