import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Information } from '../data/schema'

type TasksDialogType = 'create' | 'update' | 'delete' | 'import'

type InformationsContextType = {
  open: TasksDialogType | null
  setOpen: (str: TasksDialogType | null) => void
  currentRow: Information | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Information | null>>
}

const InformationsContext = React.createContext<InformationsContextType | null>(null)

export function InformationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TasksDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Information | null>(null)

  return (
    <InformationsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </InformationsContext.Provider>
  )
}

export const useInformations = () => {
  const informationsContext = React.useContext(InformationsContext)

  if (!informationsContext) {
    throw new Error('useInformations has to be used within <InformationsContext>')
  }

  return informationsContext
}