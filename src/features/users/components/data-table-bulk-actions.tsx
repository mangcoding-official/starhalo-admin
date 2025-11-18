import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type User } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { t } = useTranslation()

  const getUserLabel = (count: number) =>
    count > 1
      ? t('users.bulk.common.users', 'users')
      : t('users.bulk.common.user', 'user')

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading:
        status === 'active'
          ? t('users.bulk.activate.loading', 'Activating users...')
          : t('users.bulk.deactivate.loading', 'Deactivating users...'),
      success: () => {
        table.resetRowSelection()
        const prefix =
          status === 'active'
            ? t('users.bulk.activate.successPrefix', 'Activated')
            : t('users.bulk.deactivate.successPrefix', 'Deactivated')
        return `${prefix} ${selectedUsers.length} ${getUserLabel(
          selectedUsers.length
        )}`
      },
      error:
        status === 'active'
          ? t('users.bulk.activate.error', 'Error activating users')
          : t('users.bulk.deactivate.error', 'Error deactivating users'),
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading: t('users.bulk.invite.loading', 'Inviting users...'),
      success: () => {
        table.resetRowSelection()
        return `${t('users.bulk.invite.successPrefix', 'Invited')} ${
          selectedUsers.length
        } ${getUserLabel(selectedUsers.length)}`
      },
      error: t('users.bulk.invite.error', 'Error inviting users'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='user'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkInvite}
              className='size-8'
              aria-label={t(
                'users.bulk.invite.tooltip',
                'Invite selected users'
              )}
              title={t('users.bulk.invite.tooltip', 'Invite selected users')}
            >
              <Mail />
              <span className='sr-only'>
                {t('users.bulk.invite.tooltip', 'Invite selected users')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('users.bulk.invite.tooltip', 'Invite selected users')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('active')}
              className='size-8'
              aria-label={t(
                'users.bulk.activate.tooltip',
                'Activate selected users'
              )}
              title={t('users.bulk.activate.tooltip', 'Activate selected users')}
            >
              <UserCheck />
              <span className='sr-only'>
                {t('users.bulk.activate.tooltip', 'Activate selected users')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('users.bulk.activate.tooltip', 'Activate selected users')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('inactive')}
              className='size-8'
              aria-label={t(
                'users.bulk.deactivate.tooltip',
                'Deactivate selected users'
              )}
              title={t(
                'users.bulk.deactivate.tooltip',
                'Deactivate selected users'
              )}
            >
              <UserX />
              <span className='sr-only'>
                {t(
                  'users.bulk.deactivate.tooltip',
                  'Deactivate selected users'
                )}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {t('users.bulk.deactivate.tooltip', 'Deactivate selected users')}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={t(
                'users.bulk.delete.tooltip',
                'Delete selected users'
              )}
              title={t('users.bulk.delete.tooltip', 'Delete selected users')}
            >
              <Trash2 />
              <span className='sr-only'>
                {t('users.bulk.delete.tooltip', 'Delete selected users')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('users.bulk.delete.tooltip', 'Delete selected users')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
