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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Information } from '../data/schema'

const formSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(1, 'Description is required'),
    status: z.enum(['draft', 'scheduled', 'published', 'archived']),
    publishDate: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === 'scheduled' && !v.publishDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['publishDate'],
        message: 'Publish date is required when status is Scheduled',
      })
    }
  })

export type InformationFormValues = z.infer<typeof formSchema>

function toDatetimeLocal(value?: string | null) {
  if (!value) return ''
  try {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  } catch {
    return ''
  }
}

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

  const initialValues = useMemo<InformationFormValues>(() => ({
    title: currentRow?.title ?? '',
    description: currentRow?.description ?? '',
    status: currentRow?.status ?? 'draft',
    publishDate: toDatetimeLocal(currentRow?.publishDate ?? ''),
  }), [currentRow])

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
        description: '',
        status: 'draft',
        publishDate: '',
      })
    }
  }, [open, initialValues])

  const handleSubmit = async (values: InformationFormValues) => {
    if (onSubmit) {
      await onSubmit(values, currentRow ?? null)
    } else {
      showSubmittedData(values, mode === 'create'
        ? 'You have created the following information:'
        : 'You have updated the following information:'
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
            {mode === 'create' ? 'Create Information' : 'Update Information'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new announcement to be displayed in the mobile app.'
              : 'Modify the announcement details below.'}
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Hydration Tips for This Week" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Rich Text)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your announcement here..."
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
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        {/* <SelectItem value="scheduled">Scheduled</SelectItem> */}
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* {status !== 'draft' && (
                <FormField
                  control={form.control}
                  name="publishDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )} */}
              {/* {status === 'archived' && (
                <FormField
                  control={form.control}
                  name="archiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archive Date</FormLabel>
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
          <Button type="submit" form="information-upsert-form" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === 'create' ? 'Creating...' : 'Updating...')
              : (mode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
