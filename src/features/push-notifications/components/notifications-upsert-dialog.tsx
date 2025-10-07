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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Notification } from '../data/schema'

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

function normalizeStatus(s?: string | null): 'draft' | 'scheduled' | 'sent' {
  if (!s) return 'draft'
  if (s === 'sent' || s === 'published') return 'sent'
  if (s === 'scheduled') return 'scheduled'
  if (s === 'draft') return 'draft'
  return 'draft' 
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
  status: z.enum(['draft', 'scheduled', 'sent'] as const),
  scheduleAt: z.string().optional().or(z.literal('')),
}).superRefine((v, ctx) => {
  if (v.status !== 'draft') {
    if (!v.scheduleAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v.scheduleAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduleAt'],
        message: 'Send date is required (YYYY-MM-DDTHH:mm) when status is Scheduled/Sent.',
      })
    }
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
    status: normalizeStatus(currentRow?.status),
    scheduleAt: toDatetimeLocal(currentRow?.scheduleDate ?? undefined),
  }), [currentRow])

  const form = useForm<PushNotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    } else {
      form.reset({ title: '', message: '', status: 'draft', scheduleAt: '' })
    }
  }, [open, initialValues])

  const handleSubmit = async (values: PushNotificationFormValues) => {
    if (values.status === 'draft') values.scheduleAt = ''
    if (onSubmit) {
      await onSubmit(values, currentRow ?? null)
    } else {
      showSubmittedData(
        values,
        mode === 'create'
          ? 'You have created the following push notification:'
          : 'You have updated the following push notification:',
      )
    }
    onOpenChange(false)
    form.reset()
  }

  // const status = form.watch('status')
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (val !== 'draft' && !form.getValues('scheduleAt')) {
                          const now = toDatetimeLocal(new Date().toISOString())
                          form.setValue('scheduleAt', now, { shouldValidate: true })
                        }
                        if (val === 'draft') {
                          form.setValue('scheduleAt', '', { shouldValidate: true })
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Publish</SelectItem>
                        {/* <SelectItem value="sent">Sent</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* {status !== 'draft' && (
                <FormField
                  control={form.control}
                  name="scheduleAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )} */}
            </div>
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
