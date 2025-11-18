import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Report } from '../data/schema'

type ReportsDialogType = 'status' | 'view'

type ReportsContextType = {
  open: ReportsDialogType | null
  setOpen: (value: ReportsDialogType | null) => void
  currentRow: Report | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Report | null>>
}

const ReportsContext = React.createContext<ReportsContextType | null>(null)

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ReportsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Report | null>(null)

  return (
    <ReportsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const ctx = React.useContext(ReportsContext)
  if (!ctx) {
    throw new Error('useReports must be used within <ReportsProvider>')
  }
  return ctx
}
