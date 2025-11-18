import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import type { Report } from '../data/schema'

type ReportsViewDialogProps = {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportsViewDialog({ report, open, onOpenChange }: ReportsViewDialogProps) {
  const { t } = useTranslation()

  if (!report) {
    return null
  }

  const createdAt = report.createdAt
    ? format(report.createdAt, 'dd MMM yyyy HH:mm')
    : t('reports.viewDialog.notAvailable', 'Not available')

  const statusVariant = report.status === 'resolve' ? 'default' : 'secondary'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg space-y-4'>
        <DialogHeader>
          <DialogTitle>{t('reports.viewDialog.title', 'Report details')}</DialogTitle>
          <DialogDescription>
            {t('reports.viewDialog.subtitle', 'Review the full report information.')}
          </DialogDescription>
        </DialogHeader>

        <section className='space-y-2'>
          <p className='text-xs font-semibold uppercase text-muted-foreground'>
            {t('reports.columns.status', 'Status')}
          </p>
          <Badge variant={statusVariant}>
            {t(`reports.status.${report.status}` as const, report.status)}
          </Badge>
        </section>

        <section className='space-y-2'>
          <p className='text-xs font-semibold uppercase text-muted-foreground'>
            {t('reports.columns.reason', 'Reason')}
          </p>
          <p className='rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap'>
            {report.reason}
          </p>
        </section>

        <section className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-md border bg-muted/20 p-3'>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>
              {t('reports.columns.reporter', 'Reporter')}
            </p>
            <p className='text-sm font-medium'>{report.reporterName}</p>
            {report.reporterId ? (
              <p className='text-xs text-muted-foreground'>ID: {report.reporterId}</p>
            ) : null}
          </div>
          <div className='rounded-md border bg-muted/20 p-3'>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>
              {t('reports.columns.reported', 'Reported User')}
            </p>
            <p className='text-sm font-medium'>{report.reportedName}</p>
            {report.reportedId ? (
              <p className='text-xs text-muted-foreground'>ID: {report.reportedId}</p>
            ) : null}
          </div>
        </section>

        <section className='space-y-2'>
          <p className='text-xs font-semibold uppercase text-muted-foreground'>
            {t('reports.columns.created', 'Created')}
          </p>
          <p className='text-sm'>{createdAt}</p>
        </section>
      </DialogContent>
    </Dialog>
  )
}
