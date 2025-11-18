'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

type UserMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: UserMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const { t } = useTranslation()
  const confirmWord = t('users.delete.confirmWord', 'DELETE')

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    if (value.trim() !== confirmWord) {
      const message = t(
        'users.delete.placeholder',
        'Type "{word}" to confirm.'
      ).replace('{word}', confirmWord)
      toast.error(message)
      return
    }

    onOpenChange(false)

    toast.promise(sleep(2000), {
      loading: t('users.delete.toast.loading', 'Deleting users...'),
      success: () => {
        table.resetRowSelection()
        const label =
          selectedRows.length > 1
            ? t('users.bulk.common.users', 'users')
            : t('users.bulk.common.user', 'user')
        return `${t('users.delete.toast.successPrefix', 'Deleted')} ${
          selectedRows.length
        } ${label}`
      },
      error: t('users.delete.toast.error', 'Error'),
    })
  }

  const selectionLabel =
    selectedRows.length > 1
      ? t('users.bulk.common.users', 'users')
      : t('users.bulk.common.user', 'user')
  const confirmPrompt = t(
    'users.delete.inputPrompt',
    'Confirm by typing "{word}":'
  ).replace('{word}', confirmWord)
  const confirmPlaceholder = t(
    'users.delete.placeholder',
    'Type "{word}" to confirm.'
  ).replace('{word}', confirmWord)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== confirmWord}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          {t('users.delete.titlePrefix', 'Delete')} {selectedRows.length}{' '}
          {selectionLabel}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            {t(
              'users.delete.prompt',
              'Are you sure you want to delete the selected users?'
            )}{' '}
            <br />
            {t(
              'users.delete.subtext',
              'This action cannot be undone.'
            )}
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span>{confirmPrompt}</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={confirmPlaceholder}
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
