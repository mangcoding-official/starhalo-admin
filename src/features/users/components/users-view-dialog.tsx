"use client"

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DisplayField } from './users-view-display-field.tsx'
import { type User } from '../data/schema'

type UsersViewDialogProps = {
  currentRow?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersViewDialog({ currentRow, open, onOpenChange }: UsersViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View details of the selected user.</DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-3 py-2'>
          <DisplayField label='Username' value={currentRow?.username ?? '-'} />
          <DisplayField label='Email' value={currentRow?.email ?? '-'} />
          <DisplayField label='Status' value={currentRow?.status ?? '-'} />
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
