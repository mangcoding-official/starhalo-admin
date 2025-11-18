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
import { useTranslation } from '@/lib/i18n'
import { useReports } from './reports-provider'
import { reportStatusOptions } from '../data/data'
import type { ReportStatus } from '../data/schema'
import { updateReportStatus } from '../api/update-report-status'
import { reportsQueryKey } from '../hooks/use-reports-query'
import { ReportsViewDialog } from './reports-view-dialog'

export function ReportsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useReports()

  const handleClose = () => {
    setCurrentRow(null)
    setOpen(null)
  }

  return (
    <>
      <ReportsViewDialog
        report={currentRow}
        open={Boolean(currentRow) && open === 'view'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose()
          } else {
            setOpen('view')
          }
        }}
      />
      {currentRow ? (
        <ReportStatusDialog
          open={open === 'status'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleClose()
            } else {
              setOpen('status')
            }
          }}
          reportId={currentRow.id}
          initialStatus={currentRow.status}
          reporterName={currentRow.reporterName}
          reportedName={currentRow.reportedName}
        />
      ) : null}
    </>
  )
}

type ReportStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  initialStatus: ReportStatus
  reporterName: string
  reportedName: string
}

function ReportStatusDialog({
  open,
  onOpenChange,
  reportId,
  initialStatus,
  reporterName,
  reportedName,
}: ReportStatusDialogProps) {
  const [status, setStatus] = useState<ReportStatus>(initialStatus)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  useEffect(() => {
    if (open) {
      setStatus(initialStatus)
    }
  }, [initialStatus, open])

  const mutation = useMutation({
    mutationFn: async (nextStatus: ReportStatus) => updateReportStatus(reportId, { status: nextStatus }),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKey, exact: false })
      toast.success(message ?? t('reports.api.updateSuccess', 'Report status updated.'))
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t('reports.api.updateError', 'Failed to update report.')
      toast.error(message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('reports.dialog.title', 'Update Report Status')}</DialogTitle>
          <DialogDescription>
            {t('reports.dialog.description', 'Reporter: {reporter} · Reported user: {reported}')
              .replace('{reporter}', reporterName)
              .replace('{reported}', reportedName)}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            {t('reports.dialog.statusLabel', 'Status')}
          </label>
          <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus)}>
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={t('reports.dialog.statusPlaceholder', 'Select status')}
              />
            </SelectTrigger>
            <SelectContent>
              {reportStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey, option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            {t('reports.dialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => mutation.mutate(status)} disabled={mutation.isPending}>
            {mutation.isPending
              ? t('reports.dialog.saving', 'Saving...')
              : t('reports.dialog.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
