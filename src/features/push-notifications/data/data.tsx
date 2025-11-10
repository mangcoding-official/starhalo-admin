export const NOTIF_STATUS = [
  'draft',
  'scheduled',
  'sent',
  'canceled',
  'failed',
  'sending',
] as const
export type NotifStatus = typeof NOTIF_STATUS[number]

export const NOTIF_STATUS_SCHEDULED_TAB = ['scheduled','sending'] as const  
export const NOTIF_STATUS_HISTORY_TAB   = ['sent','failed','canceled'] as const 

export const NOTIF_TARGET = ['all','platform','user','segment','role'] as const
export type NotifTarget = typeof NOTIF_TARGET[number]

export const NOTIF_PRIORITY = ['normal','high'] as const
export type NotifPriority = typeof NOTIF_PRIORITY[number]
