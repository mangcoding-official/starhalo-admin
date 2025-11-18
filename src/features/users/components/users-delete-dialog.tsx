'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { useTranslation } from '@/lib/i18n'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { t } = useTranslation()

  const handleDelete = () => {
    if (value.trim() !== currentRow.username) return

    onOpenChange(false)
    showSubmittedData(
      currentRow,
      `${t('users.delete.toast.successPrefix', 'Deleted')} ${
        currentRow.username
      }`
    )
  }

  const placeholder = t(
    'users.delete.usernamePlaceholder',
    'Enter username to confirm deletion.'
  )

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.username}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          {t('users.delete.dialogTitle', 'Delete User')}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            {t(
              'users.delete.dialogPrompt',
              'Are you sure you want to delete {username}? This action will permanently remove this user from the system. This cannot be undone.'
            ).replace('{username}', currentRow.username)}
          </p>

          <Label className='my-2'>
            {t('users.delete.usernameLabel', 'Username:')}
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>
              {t('users.delete.warningTitle', 'Warning!')}
            </AlertTitle>
            <AlertDescription>
              {t(
                'users.delete.warningDescription',
                'Please be careful, this operation can not be rolled back.'
              )}
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={t('users.delete.confirmButton', 'Delete')}
      destructive
    />
  )
}
