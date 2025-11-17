import { z } from 'zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Notification } from '../data/schema'

function toDatetimeLocal(value?: string | null) {
  if (!value) return ''
  try {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

const DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

function parseDatetimeLocal(value: string): Date | null {
  if (!DATETIME_LOCAL_REGEX.test(value)) return null
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null
  const [yearStr, monthStr, dayStr] = datePart.split('-')
  const [hourStr, minuteStr] = timePart.split(':')
  if (!yearStr || !monthStr || !dayStr || !hourStr || !minuteStr) return null
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if ([year, monthIndex, day, hour, minute].some((n) => Number.isNaN(n))) {
    return null
  }
  return new Date(year, monthIndex, day, hour, minute)
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
  scheduleAt: z.string().optional(),
}).superRefine((v, ctx) => {
  const scheduleAt = v.scheduleAt?.trim()
  if (!scheduleAt) return
  if (!DATETIME_LOCAL_REGEX.test(scheduleAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduleAt'],
      message: 'Send date must use the YYYY-MM-DDTHH:mm format.',
    })
    return
  }
  const parsed = parseDatetimeLocal(scheduleAt)
  if (!parsed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduleAt'],
      message: 'Send date is invalid.',
    })
    return
  }
  if (parsed.getTime() < Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduleAt'],
      message: 'Send date cannot be in the past.',
    })
  }
})

export type PushNotificationFormValues = z.infer<typeof formSchema>

type UpsertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Notification | null
  onSubmit?: (values: PushNotificationFormValues, current?: Notification | null) => void | Promise<void>
}

export function PushNotificationsUpsertDialog({
  open,
  onOpenChange,
  currentRow,
  onSubmit,
}: UpsertDialogProps) {
  const mode: 'create' | 'update' = currentRow ? 'update' : 'create'

  const initialValues = useMemo<PushNotificationFormValues>(() => ({
    title: currentRow?.title ?? '',
    message: currentRow?.content ?? '',
    scheduleAt: toDatetimeLocal(currentRow?.scheduleDate ?? undefined),
  }), [currentRow])

  const form = useForm<PushNotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  const minScheduleAt = useMemo(
    () => toDatetimeLocal(new Date().toISOString()),
    [open],
  )

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    } else {
      form.reset({ title: '', message: '', scheduleAt: '' })
    }
  }, [open, initialValues])

  const handleSubmit = async (values: PushNotificationFormValues) => {
    const scheduleValue =
      values.scheduleAt && values.scheduleAt.trim().length > 0
        ? values.scheduleAt.trim()
        : ''
    const submissionValues = { ...values, scheduleAt: scheduleValue }
    if (onSubmit) {
      await onSubmit(submissionValues, currentRow ?? null)
    } else {
      showSubmittedData(
        submissionValues,
        mode === 'create'
          ? 'You have created the following push notification:'
          : 'You have updated the following push notification:',
      )
    }
    onOpenChange(false)
    form.reset()
  }

  const { isSubmitting } = form.formState

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) form.reset()
      }}
    >
      <DialogContent className="gap-2 sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{mode === 'create' ? 'Create Push Notification' : 'Update Push Notification'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Compose a push notification to send now or schedule later.'
              : 'Edit the push notification details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="push-upsert-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Stay Hydrated!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Drink a glass of water to keep your body fresh."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduleAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule send time</FormLabel>
                  <FormControl>
                    <Input
                      className='w-fit'
                      type="datetime-local"
                      placeholder="Optional"
                      min={minScheduleAt || undefined}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Close</Button>
          </DialogClose>
          <Button type="submit" form="push-upsert-form" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === 'create' ? 'Creating...' : 'Updating...')
              : (mode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
