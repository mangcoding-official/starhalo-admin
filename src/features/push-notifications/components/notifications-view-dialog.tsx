import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/i18n'
import type { Notification } from '../data/schema'

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
  const { t } = useTranslation()
  if (!notification) {
    return null
  }

  const scheduleDate = formatDateTime(notification.scheduleDate)
  const sendAt = formatDateTime(notification.sentAt)
  const createdAt = formatDateTime(notification.createdAt)
  const updatedAt = formatDateTime(notification.updatedAt)
  const hasResultSummary =
    notification.resultSummary !== null && typeof notification.resultSummary !== 'undefined'
  const hasImage =
    typeof notification.imageUrl === 'string' && notification.imageUrl.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('push.view.title', 'Push notification detail')}</DialogTitle>
          <DialogDescription>
            {normalizeText(notification.title)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.target', 'Target')}
                </dt>
                <dd className="text-sm">
                  {t(
                    `push.target.${notification.target}` as const,
                    normalizeText(notification.target)
                  )}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.priority', 'Priority')}
                </dt>
                <dd className="text-sm">
                  {t(
                    `push.priority.${notification.priority}` as const,
                    normalizeText(notification.priority)
                  )}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.scheduleDate', 'Schedule Date')}
                </dt>
                <dd className="text-sm">{scheduleDate.display}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.sendAt', 'Send At (send_at)')}
                </dt>
                <dd className="text-sm space-y-1">
                  <span>{sendAt.display}</span>
                  {sendAt.raw && sendAt.raw !== sendAt.display && (
                    <span className="block text-xs text-muted-foreground">
                      {t('push.view.rawLabel', 'Raw:')} {sendAt.raw}
                    </span>
                  )}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.createdAt', 'Created At')}
                </dt>
                <dd className="text-sm">{createdAt.display}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase text-muted-foreground">
                  {t('push.view.updatedAt', 'Updated At')}
                </dt>
                <dd className="text-sm">{updatedAt.display}</dd>
              </div>
            </dl>
          </section>

          {hasImage && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('push.view.imageLabel', 'Image')}
              </p>
              <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center">
                <div className="w-full max-w-xs overflow-hidden rounded-md border border-border/60 bg-background">
                  <img
                    src={notification.imageUrl ?? undefined}
                    alt={notification.title ?? 'Notification image'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 break-all text-sm text-muted-foreground">
                  <p className="text-xs uppercase text-muted-foreground">
                    {t('push.view.imageLinkLabel', 'Image URL')}
                  </p>
                  <a
                    href={notification.imageUrl ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {notification.imageUrl}
                  </a>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t('push.view.titleLabel', 'Title')}
            </p>
            <p className="rounded-md border bg-muted/40 p-3 text-sm font-medium">
              {normalizeText(notification.title)}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t('push.view.contentLabel', 'Content')}
            </p>
            <p className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {normalizeText(notification.content)}
            </p>
          </section>

          {hasResultSummary && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('push.view.resultSummary', 'Result Summary')}
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
