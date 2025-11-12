import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Notification, NotificationStatus } from '../data/schema'

type PushNotificationViewDialogProps = {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(value?: string | null) {
  if (!value) return { display: '—', raw: null }
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return {
      display: format(parsed, 'dd MMM yyyy HH:mm'),
      raw: value,
    }
  }
  return { display: value, raw: value }
}

function getStatusVariant(status: NotificationStatus) {
  switch (status) {
    case 'sent':
      return 'default'
    case 'scheduled':
    case 'sending':
      return 'secondary'
    case 'failed':
    case 'canceled':
      return 'destructive'
    default:
      return 'outline'
  }
}

function normalizeText(value?: string | null) {
  if (!value) return '—'
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '—'
}

function renderResultSummary(summary: unknown): string {
  if (summary === null || typeof summary === 'undefined') {
    return ''
  }
  if (typeof summary === 'string') {
    return summary
  }
  try {
    return JSON.stringify(summary, null, 2)
  } catch {
    return String(summary)
  }
}

export function PushNotificationViewDialog({
  notification,
  open,
  onOpenChange,
}: PushNotificationViewDialogProps) {
  if (!notification) {
    return null
  }

  const scheduleDate = formatDateTime(notification.scheduleDate)
  const sendAt = formatDateTime(notification.sentAt)
  const createdAt = formatDateTime(notification.createdAt)
  const updatedAt = formatDateTime(notification.updatedAt)
  const hasResultSummary =
    notification.resultSummary !== null && typeof notification.resultSummary !== 'undefined'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Push notification detail</DialogTitle>
          <DialogDescription>
            {normalizeText(notification.title)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Status
              </p>
              <Badge variant={getStatusVariant(notification.status)}>
                {notification.status}
              </Badge>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Target
                </dt>
                <dd className="text-sm">{normalizeText(notification.target)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Priority
                </dt>
                <dd className="text-sm">
                  {normalizeText(notification.priority)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Schedule Date
                </dt>
                <dd className="text-sm">{scheduleDate.display}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Send At (send_at)
                </dt>
                <dd className="text-sm space-y-1">
                  <span>{sendAt.display}</span>
                  {sendAt.raw && sendAt.raw !== sendAt.display && (
                    <span className="block text-xs text-muted-foreground">
                      Raw: {sendAt.raw}
                    </span>
                  )}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Created At
                </dt>
                <dd className="text-sm">{createdAt.display}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  Updated At
                </dt>
                <dd className="text-sm">{updatedAt.display}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Title
            </p>
            <p className="rounded-md border bg-muted/40 p-3 text-sm font-medium">
              {normalizeText(notification.title)}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Content
            </p>
            <p className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {normalizeText(notification.content)}
            </p>
          </section>

          {hasResultSummary && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Result Summary
              </p>
              <pre className="rounded-md border bg-muted/30 p-3 text-xs overflow-x-auto">
                {renderResultSummary(notification.resultSummary)}
              </pre>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
