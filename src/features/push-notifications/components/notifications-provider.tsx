import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Notification } from '../data/schema'

type PushNotificationDialogType = 'create' | 'update' | 'delete' | 'import'

type PushNotificationsContextType = {
  open: PushNotificationDialogType | null
  setOpen: (str: PushNotificationDialogType | null) => void
  currentRow: Notification | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Notification | null>>
}

const PushNotificationsContext = React.createContext<PushNotificationsContextType | null>(null)

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<PushNotificationDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Notification | null>(null)

  return (
    <PushNotificationsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PushNotificationsContext.Provider>
  )
}

export const usePushNotifications = () => {
  const pushNotificationsContext = React.useContext(PushNotificationsContext)

  if (!pushNotificationsContext) {
    throw new Error('usePushNotifications has to be used within <PushNotificationProvider>')
  }

  return pushNotificationsContext
}