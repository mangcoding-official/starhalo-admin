import { z } from 'zod'
import { NOTIF_PRIORITY, NOTIF_STATUS, NOTIF_TARGET } from './data'

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),

  imageUrl: z.string().url().nullable().optional(),

  target: z.enum(NOTIF_TARGET).default('all'),
  criteria: z.unknown().nullable().optional(), 

  priority: z.enum(NOTIF_PRIORITY).default('normal'),

  scheduleDate: z.string().datetime().nullable().optional(), 
  status: z.enum(NOTIF_STATUS),                              
  sentAt: z.string().datetime().nullable().optional(),      

  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  resultSummary: z.unknown().nullable().optional(),
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationListItemSchema = notificationSchema.pick({
  id: true,
  title: true,
  content: true,
  scheduleDate: true,
  status: true,
  sentAt: true,
})

export type NotificationListItem = z.infer<typeof notificationListItemSchema>

export const notificationUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(80),
  content: z.string().min(1, 'Content is required').max(240),

  target: z.enum(NOTIF_TARGET).default('all'),
  criteria: z.unknown().nullable().optional(),

  priority: z.enum(NOTIF_PRIORITY).default('normal'),

  status: z.enum(['draft','scheduled','sent','canceled','failed','sending'] as const).default('draft'),
  scheduleDate: z.string().datetime({ message: 'Invalid date format' }).optional().nullable(),
})
.superRefine((v, ctx) => {
  if ((v.status === 'scheduled' || v.status === 'sending') && !v.scheduleDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduleDate'],
      message: 'Schedule date is required when status is Scheduled/Sending',
    })
  }
})
export type NotificationUpsert = z.infer<typeof notificationUpsertSchema>

export const notificationsListParamsSchema = z.object({
  q: z.string().optional(),                         
  status: z.enum(NOTIF_STATUS).optional(),          
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
})
export type NotificationsListParams = z.infer<typeof notificationsListParamsSchema>

export const pageMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})
export const notificationsPageSchema = z.object({
  data: z.array(notificationListItemSchema),
  meta: pageMetaSchema,
})
export type NotificationsPage = z.infer<typeof notificationsPageSchema>
