import { z } from 'zod'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation, type Translator } from '@/lib/i18n'
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

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_FILE_SIZE_LABEL = '5 MB'

function isFileInstance(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

const createPushFormSchema = (t: Translator) =>
  z.object({
    title: z
      .string()
      .min(1, t('push.form.validation.titleRequired', 'Title is required'))
      .max(100, t('push.form.validation.titleMax', 'Title is too long')),
    message: z
      .string()
      .min(1, t('push.form.validation.messageRequired', 'Message is required'))
      .max(1000, t('push.form.validation.messageMax', 'Message is too long')),
    scheduleAt: z.string().optional(),
    imageFile: z
      .custom<File | null | undefined>(
        (value) => value == null || isFileInstance(value),
        {
          message: t('push.form.validation.imageType', 'Please upload a valid image file.'),
        }
      )
      .refine(
        (file) =>
          file == null ||
          !isFileInstance(file) ||
          !file.type ||
          file.type.startsWith('image/'),
        {
          message: t('push.form.validation.imageFormat', 'Image must be a PNG, JPG, or GIF.'),
        }
      )
      .refine(
        (file) =>
          file == null ||
          !isFileInstance(file) ||
          file.size <= MAX_IMAGE_FILE_SIZE,
        {
          message: t(
            'push.form.validation.imageSize',
            `Image must be ${MAX_IMAGE_FILE_SIZE_LABEL} or smaller.`
          ),
        }
      )
      .optional(),
  }).superRefine((v, ctx) => {
    const scheduleAt = v.scheduleAt?.trim()
    if (!scheduleAt) return
    if (!DATETIME_LOCAL_REGEX.test(scheduleAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduleAt'],
        message: t(
          'push.form.validation.scheduleFormat',
          'Send date must use the YYYY-MM-DDTHH:mm format.'
        ),
      })
      return
    }
    const parsed = parseDatetimeLocal(scheduleAt)
    if (!parsed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduleAt'],
        message: t(
          'push.form.validation.scheduleInvalid',
          'Send date is invalid.'
        ),
      })
      return
    }
    if (parsed.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduleAt'],
        message: t(
          'push.form.validation.schedulePast',
          'Send date cannot be in the past.'
        ),
      })
    }
  })

export type PushNotificationFormValues = z.infer<
  ReturnType<typeof createPushFormSchema>
>

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
  const { t } = useTranslation()
  const formSchema = useMemo(() => createPushFormSchema(t), [t])

  const initialValues = useMemo<PushNotificationFormValues>(() => ({
    title: currentRow?.title ?? '',
    message: currentRow?.content ?? '',
    scheduleAt: toDatetimeLocal(currentRow?.scheduleDate ?? undefined),
    imageFile: null,
  }), [currentRow])

  const form = useForm<PushNotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  const currentImageUrl = currentRow?.imageUrl ?? null
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(currentImageUrl)
  const previewObjectUrlRef = useRef<string | null>(null)

  const updateImagePreview = (file: File | null) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    if (file) {
      const nextUrl = URL.createObjectURL(file)
      previewObjectUrlRef.current = nextUrl
      setImagePreviewUrl(nextUrl)
    } else {
      setImagePreviewUrl(currentImageUrl)
    }
  }

  const minScheduleAt = useMemo(() => {
    if (!open) return ''
    return toDatetimeLocal(new Date().toISOString())
  }, [open])

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    } else {
      form.reset({ title: '', message: '', scheduleAt: '', imageFile: null })
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setImagePreviewUrl(currentImageUrl)
  }, [open, initialValues, form, currentImageUrl])

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
          ? t(
              'push.toast.create',
              'You have created the following push notification:'
            )
          : t(
              'push.toast.update',
              'You have updated the following push notification:'
            )
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
          <DialogTitle>
            {mode === 'create'
              ? t('push.form.dialog.createTitle', 'Create Push Notification')
              : t('push.form.dialog.updateTitle', 'Update Push Notification')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t(
                  'push.form.dialog.createDescription',
                  'Compose a push notification to send now or schedule later.'
                )
              : t(
                  'push.form.dialog.updateDescription',
                  'Edit the push notification details below.'
                )}
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
                  <FormLabel>
                    {t('push.form.fields.title.label', 'Title')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'push.form.fields.title.placeholder',
                        'Stay Hydrated!'
                      )}
                      {...field}
                    />
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
                  <FormLabel>
                    {t('push.form.fields.message.label', 'Message')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'push.form.fields.message.placeholder',
                        'Drink a glass of water to keep your body fresh.'
                      )}
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
              name='imageFile'
              render={({ field }) => {
                const selectedFile =
                  field.value && isFileInstance(field.value)
                    ? field.value
                    : null
                const previewAlt =
                  selectedFile?.name ??
                  currentRow?.title ??
                  t('push.form.fields.image.previewAlt', 'Notification image preview')

                const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0] ?? null
                  field.onChange(file)
                  updateImagePreview(file)
                  event.target.value = ''
                }

                const handleClearSelection = () => {
                  field.onChange(null)
                  updateImagePreview(null)
                }

                return (
                  <FormItem>
                    <FormLabel>
                      {t('push.form.fields.image.label', 'Image (optional)')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={handleFileInputChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'push.form.fields.image.description',
                        `Upload a PNG or JPG up to ${MAX_IMAGE_FILE_SIZE_LABEL}.`
                      )}
                    </FormDescription>
                    <div className='mt-3 space-y-2'>
                      {imagePreviewUrl ? (
                        <div className='relative overflow-hidden rounded-md border border-border/60 bg-muted/10'>
                          <img
                            src={imagePreviewUrl}
                            alt={previewAlt}
                            className='h-48 w-full object-cover'
                            loading='lazy'
                          />
                          {selectedFile ? (
                            <span className='absolute right-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow'>
                              {t('push.form.fields.image.previewBadge', 'Preview')}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className='flex h-32 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/10 text-sm text-muted-foreground'>
                          {t('push.form.fields.image.noPreview', 'No image selected')}
                        </div>
                      )}

                      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                        {selectedFile ? (
                          <span>
                            {t('push.form.fields.image.selected', 'Selected: {name} ({size})')
                              .replace('{name}', selectedFile.name)
                              .replace(
                                '{size}',
                                formatFileSize(selectedFile.size) || `${selectedFile.size} B`
                              )}
                          </span>
                        ) : currentImageUrl ? (
                          <span className='flex flex-wrap items-center gap-2'>
                            {t(
                              'push.form.fields.image.currentInfo',
                              'Current image will be kept unless you upload a new one.'
                            )}
                            <a
                              href={currentImageUrl}
                              target='_blank'
                              rel='noreferrer'
                              className='text-primary underline-offset-2 hover:underline'
                            >
                              {t('push.form.fields.image.open', 'View image')}
                            </a>
                          </span>
                        ) : (
                          <span>
                            {t(
                              'push.form.fields.image.noSelection',
                              'No image selected yet.'
                            )}
                          </span>
                        )}
                        {selectedFile ? (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2'
                            onClick={handleClearSelection}
                          >
                            {t('push.form.fields.image.clear', 'Clear selection')}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="scheduleAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('push.form.fields.schedule.label', 'Schedule send time')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className='w-fit'
                      type="datetime-local"
                      placeholder={t(
                        'push.form.fields.schedule.placeholder',
                        'Optional'
                      )}
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
            <Button variant="outline" disabled={isSubmitting}>
              {t('push.form.buttons.close', 'Close')}
            </Button>
          </DialogClose>
          <Button type="submit" form="push-upsert-form" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? t('push.form.buttons.creating', 'Creating...')
                : t('push.form.buttons.updating', 'Updating...')
              : mode === 'create'
                ? t('push.form.buttons.create', 'Create')
                : t('push.form.buttons.update', 'Update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
