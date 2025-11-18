import { z } from 'zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WysiwygEditor } from '@/components/wysiwyg-editor'
import { useTranslation, type Translator } from '@/lib/i18n'
import type { Information } from '../data/schema'

function isEmptyHtml(value: string) {
  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .trim()
  return text.length === 0
}

const createInformationSchema = (t: Translator) =>
  z.object({
    title: z
      .string()
      .min(
        3,
        t('info.form.validation.titleMin', 'Title must be at least 3 characters')
      ),
    content: z
      .string()
      .refine(
        (val) => !isEmptyHtml(val),
        t('info.form.validation.contentRequired', 'Content is required')
      ),
    status: z.enum(['draft', 'published']),
  })

export type InformationFormValues = z.infer<
  ReturnType<typeof createInformationSchema>
>

type UpsertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Information | null
  onSubmit?: (values: InformationFormValues, current?: Information | null) => void | Promise<void>
}

export function InformationsUpsertDialog({
  open,
  onOpenChange,
  currentRow,
  onSubmit,
}: UpsertDialogProps) {
  const mode: 'create' | 'update' = currentRow ? 'update' : 'create'
  const { t } = useTranslation()
  const formSchema = useMemo(() => createInformationSchema(t), [t])

  const initialValues = useMemo<InformationFormValues>(
    () => ({
      title: currentRow?.title ?? '',
      content: currentRow?.content ?? '',
      status: currentRow?.status ?? 'draft',
    }),
    [currentRow]
  )

  const form = useForm<InformationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    } else {
      form.reset({
        title: '',
        content: '',
        status: 'draft',
      })
    }
  }, [form, initialValues, open])

  const handleSubmit = async (values: InformationFormValues) => {
    if (onSubmit) {
      await onSubmit(values, currentRow ?? null)
    } else {
      showSubmittedData(values, mode === 'create'
        ? t('info.toast.create', 'You have created the following information:')
        : t('info.toast.update', 'You have updated the following information:')
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
          <DialogTitle>
            {mode === 'create'
              ? t('info.dialog.createTitle', 'Create Information')
              : t('info.dialog.updateTitle', 'Update Information')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t(
                  'info.dialog.createDescription',
                  'Add a new announcement to be displayed in the mobile app.'
                )
              : t(
                  'info.dialog.updateDescription',
                  'Modify the announcement details below.'
                )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="information-upsert-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('info.form.fields.title.label', 'Title')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'info.form.fields.title.placeholder',
                        'Hydration Tips for This Week'
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('info.form.fields.content.label', 'Content')}
                  </FormLabel>
                  <FormControl>
                    <WysiwygEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={t(
                        'info.form.fields.content.placeholder',
                        'Write your announcement here...'
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('info.form.fields.status.label', 'Status')}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'info.form.fields.status.placeholder',
                            'Select status'
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">
                        {t('info.status.draft', 'Draft')}
                      </SelectItem>
                      <SelectItem value="published">
                        {t('info.status.published', 'Published')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              {t('info.dialog.close', 'Close')}
            </Button>
          </DialogClose>
          <Button type="submit" form="information-upsert-form" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? t('info.dialog.submitting.create', 'Creating...')
                : t('info.dialog.submitting.update', 'Updating...')
              : mode === 'create'
                ? t('info.dialog.submit.create', 'Create')
                : t('info.dialog.submit.update', 'Update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
